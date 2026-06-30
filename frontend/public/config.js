window.KD_STUDIOS_CONFIG = {
  apiBaseUrl:
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
      ? "http://localhost:4000"
      : "https://kd-studios.onrender.com",

  // Resend OTP Worker for OTP (Cloudflare Worker)
  otpWorkerUrl: "https://resndotp.your-subdomain.workers.dev",

  adminEmail: "rahul2112@gmail.com"
};