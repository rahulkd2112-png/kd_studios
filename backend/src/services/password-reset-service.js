const { prisma } = require("../lib/prisma");
const config = require("../config");
const { sanitizeText, isValidEmail, validatePassword } = require("../lib/validation");
const { hashOtp, verifyOtp, generateOtpCode, hashPassword } = require("../lib/security");
const { sendEmailOtp } = require("../lib/email");

async function requestPasswordReset(payload) {
  const email = sanitizeText(payload.email, 160).toLowerCase();
  if (!isValidEmail(email)) {
    return { message: "If this email exists, a password reset OTP has been sent." };
  }
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return {
      message: "If this email exists, a password reset OTP has been generated."
    };
  }

  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + config.passwordResetOtpTtlMinutes * 60 * 1000);

  await prisma.passwordResetOtp.updateMany({
    where: {
      userId: user.id,
      consumedAt: null
    },
    data: {
      consumedAt: new Date()
    }
  });

  await prisma.passwordResetOtp.create({
    data: {
      codeHash: hashOtp(code),
      expiresAt,
      userId: user.id
    }
  });

  try {
    await sendEmailOtp({ toEmail: user.email, otp: code });
  } catch (error) {
    await prisma.passwordResetOtp.updateMany({
      where: { userId: user.id, consumedAt: null },
      data: { consumedAt: new Date() }
    });
    throw error;
  }

  return {
    message: "If this email exists, a password reset OTP has been sent.",
    expiresAt
  };
}

async function confirmPasswordReset(payload) {
  const email = sanitizeText(payload.email, 160).toLowerCase();
  const otp = sanitizeText(payload.otp, 12);
  const newPassword = String(payload.newPassword || "");
  const passwordError = validatePassword(newPassword);
  if (passwordError) throw new Error(passwordError);
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new Error("Password reset code is invalid or expired.");
  }

  const record = await prisma.passwordResetOtp.findFirst({
    where: {
      userId: user.id,
      consumedAt: null
    },
    orderBy: { createdAt: "desc" }
  });

  if (!record || record.expiresAt < new Date()) {
    throw new Error("Password reset OTP expired or unavailable.");
  }

  if (record.attempts >= config.passwordResetOtpMaxAttempts) {
    await prisma.passwordResetOtp.update({
      where: { id: record.id },
      data: { consumedAt: new Date() }
    });
    throw new Error("Password reset attempt limit reached. Request a new code.");
  }

  if (!verifyOtp(otp, record.codeHash)) {
    await prisma.passwordResetOtp.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } }
    });
    throw new Error("Password reset code is invalid or expired.");
  }

  await prisma.passwordResetOtp.update({
    where: { id: record.id },
    data: { consumedAt: new Date() }
  });

  const passwordHash = await hashPassword(newPassword);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash }
    }),
    prisma.session.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() }
    })
  ]);

  return {
    message: "Password reset successful."
  };
}

module.exports = {
  requestPasswordReset,
  confirmPasswordReset
};
