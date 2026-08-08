const {
  listPublicApps,
  getPublicApp,
  listAdminApps,
  getAdminApp,
  createAdminApp,
  updateAdminApp,
  deleteAdminApp
} = require("../controllers/app-page-controller");
const { getApiPathname } = require("../lib/http");

async function handleAppPageRoutes(req, res) {
  const pathname = getApiPathname(req);

  if (req.method === "GET" && pathname === "/api/apps") {
    await listPublicApps(req, res);
    return true;
  }

  if (req.method === "GET" && pathname.startsWith("/api/apps/")) {
    await getPublicApp(req, res, pathname.split("/").pop());
    return true;
  }

  if (req.method === "GET" && pathname === "/api/admin/apps") {
    await listAdminApps(req, res);
    return true;
  }

  if (req.method === "POST" && pathname === "/api/admin/apps") {
    await createAdminApp(req, res);
    return true;
  }

  if (pathname.startsWith("/api/admin/apps/")) {
    const id = pathname.split("/").pop();

    if (req.method === "GET") {
      await getAdminApp(req, res, id);
      return true;
    }

    if (req.method === "PATCH") {
      await updateAdminApp(req, res, id);
      return true;
    }

    if (req.method === "DELETE") {
      await deleteAdminApp(req, res, id);
      return true;
    }
  }

  return false;
}

module.exports = {
  handleAppPageRoutes
};
