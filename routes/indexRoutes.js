import express from "express";
import chatRoutes from "./Chat.js";
import MessageRoutes from "./Message.js";
import TenantRoutes from "./Tenant.js";
import AuthRoutes from "./Auth.js";

const router = express.Router();

router.use("/auth", AuthRoutes);
router.use("/chat", chatRoutes);
router.use("/message", MessageRoutes);
router.use("/tenant", TenantRoutes);

export default router;
