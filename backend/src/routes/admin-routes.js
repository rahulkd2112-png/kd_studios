const {
  getDashboard,
  listUsers,
  listRequests,
  updateRequest,
  changePassword,
  blockUser,
  unblockUser,
  deleteUser
} = require("../controllers/admin-controller");

async function handleAdminRoutes(req, res) {
  const { pathname } = new URL(req.url, "http://localhost");

  if (!pathname.startsWith("/api/admin")) {
    return false;
  }

  if (req.method === "GET" && pathname === "/api/admin/dashboard") {
    await getDashboard(req, res);
    return true;
  }

  if (req.method === "GET" && pathname === "/api/admin/users") {
    await listUsers(req, res);
    return true;
  }

  if (req.method === "GET" && pathname === "/api/admin/requests") {
    await listRequests(req, res);
    return true;
  }

  if (req.method === "PATCH" && pathname === "/api/admin/change-password") {
    await changePassword(req, res);
    return true;
  }

  if (req.method === "PATCH" && pathname.startsWith("/api/admin/requests/")) {
    await updateRequest(req, res, pathname.split("/").pop());
    return true;
  }

  if (req.method === "PATCH" && pathname.startsWith("/api/admin/users/") && pathname.endsWith("/block")) {
    await blockUser(req, res, pathname.split("/")[4]);
    return true;
  }

  if (req.method === "PATCH" && pathname.startsWith("/api/admin/users/") && pathname.endsWith("/unblock")) {
    await unblockUser(req, res, pathname.split("/")[4]);
    return true;
  }

  if (req.method === "DELETE" && pathname.startsWith("/api/admin/users/")) {
    await deleteUser(req, res, pathname.split("/").pop());
    return true;
  }

  return false;
}

module.exports = {
  handleAdminRoutes
};
