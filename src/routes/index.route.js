const express = require("express");
const router = express.Router();

const PATH_API = process.env.PATH_API || "/api/v0";

const attachmentRoutes = require("./attachment.route");
const reportRoutes = require("./report.route");
const templateRoutes = require("./template.route");
const reportHistoryRoutes = require("./report-history.route");

attachmentRoutes(router, PATH_API);
reportRoutes(router, PATH_API);
templateRoutes(router, PATH_API);
reportHistoryRoutes(router, PATH_API);

module.exports = router;
