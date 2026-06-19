const config = require("../config");
const nodemailer = require("nodemailer");

function getTransporter() {
  if (!config.emailUser || !config.emailPass) {
    return null;
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: config.emailUser,
      pass: config.emailPass
    }
  });
}


function buildOtpEmail({ otp, toEmail }) {
  return {
    from: config.emailFrom || `KD Studios <${config.emailUser}>`,
    to: toEmail,
    subject: "Your KD Studios verification OTP",
    html: `
      <div style="font-family: Arial, sans-serif; color: #111;">
        <h2 style="margin:0 0 12px;">KD Studios Verification</h2>
        <p style="margin:0 0 10px;">Your one-time verification code is:</p>
        <div style="font-size: 24px; font-weight: 700; letter-spacing: 3px; margin: 14px 0;">
          ${otp}
        </div>
        <p style="margin:0; font-size: 13px; color:#555;">
          This code expires soon. If you didn’t request it, you can ignore this email.
        </p>
      </div>
    `
  };
}

async function sendEmailOtp({ toEmail, otp }) {
  if (!config.emailUser || !config.emailPass) {
    throw new Error(
      "Email OTP delivery is not configured. Set EMAIL_USER and EMAIL_PASS in .env."
    );
  }

  const transporter = getTransporter();
  if (!transporter) {
    throw new Error("Email transport could not be initialized.");
  }

  const email = buildOtpEmail({ otp, toEmail });
  await transporter.sendMail(email);
}

module.exports = {
  sendEmailOtp
};

