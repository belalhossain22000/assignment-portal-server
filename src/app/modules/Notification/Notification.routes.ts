// Notification.routes: Module file for the Notification.routes functionality.
import express from "express";
import { notificationController } from "./Notification.controller";

const router = express.Router();

// Get notifications by user ID route (GET)
router.get(
  "/",

  notificationController.getNotificationsByUserId
);

export const notificationRoutes = router;
