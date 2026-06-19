const config = window.KD_STUDIOS_CONFIG || {};
const apiBaseUrl = (config.apiBaseUrl || "http://localhost:4000").replace(/\/$/, "");

// Auto-fill helper (optional). If you don't want this, remove this block.
// It helps during testing and prevents admin-password 

const storageKey = "kd_studios_auth";

const adminLoginForm = document.getElementById("adminLoginForm");
const adminOtpForm = document.getElementById("adminOtpForm");
const authMessage = document.getElementById("authMessage");

function setMessage(text, type = "") {
  if (!authMessage) return;
  authMessage.className = "form-message" + (type ? ` ${type}` : "");
  authMessage.textContent = text;
}

function saveAuth(auth) {
  if (auth) {
    sessionStorage.setItem(storageKey, JSON.stringify(auth));
  } else {
    sessionStorage.removeItem(storageKey);
  }
}

// Force visibility in case any shared logic marks auth elements hidden.
if (adminLoginForm) {
  adminLoginForm.classList.remove("hidden");
}
if (adminOtpForm) {
  adminOtpForm.classList.remove("hidden");
}
if (authMessage) {
  authMessage.classList.remove("hidden");
}

async function apiFetch(path, options = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error || "Request failed.");
  }
  return result;
}

async function handleAdminLogin(event) {
  event.preventDefault();

  if (!adminLoginForm) return;
  const payload = Object.fromEntries(new FormData(adminLoginForm).entries());

  try {
    setMessage("Checking admin login...");

      const result = await apiFetch("/api/auth/admin/request-otp", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    if (adminOtpForm) {
      adminOtpForm.classList.remove("hidden");
      adminOtpForm.email.value = payload.email;
      adminOtpForm.password.value = payload.password;
    }

    setMessage(result.message, "success");
  } catch (error) {
    setMessage(error.message, "error");
  }
}

async function handleAdminOtpSubmit(event) {
  event.preventDefault();

  if (!adminOtpForm) return;
  const payload = Object.fromEntries(new FormData(adminOtpForm).entries());

  try {
    setMessage("Verifying admin code...");

    const result = await apiFetch("/api/auth/admin/verify-otp", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    saveAuth({ token: result.token, user: result.user });
    adminOtpForm.reset();
    if (adminLoginForm) adminLoginForm.reset();
    adminOtpForm.classList.add("hidden");

    setMessage("Admin login successful.", "success");
    window.location.href = "/dashboard.html";
  } catch (error) {
    setMessage(error.message, "error");
  }
}

if (adminLoginForm) {
  adminLoginForm.addEventListener("submit", handleAdminLogin);
}
if (adminOtpForm) {
  adminOtpForm.addEventListener("submit", handleAdminOtpSubmit);
}

