import express from "express";
import { createTenant } from "../controllers/TenantController.js";

const router = express.Router();

router.post("/", createTenant);

export default router;
