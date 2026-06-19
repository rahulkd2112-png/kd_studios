window.KD_STUDIOS_CONFIG = {
  apiBaseUrl:
    window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
      ? "http://localhost:4000"
      : "https://kd-studios-api.onrender.com",
  // IMPORTANT: admin flow trigger ke liye required
  // Login page me admin email yahan set kiye hue adminEmail se match hona chahiye.
  adminEmail: "rahulkd2112@gmail.com"
};

