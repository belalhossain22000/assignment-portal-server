import { Request, Response } from "express";

// Notification.controller: Module file for the Notification.controller functionality.
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { NotificationService } from "./Notification.service";

const getNotificationsByUserId = catchAsync(
  async (req: Request, res: Response) => {
    const result = await NotificationService.getNotificationsByUserId(
      req.user.id
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Notifications retrieved successfully",
      data: result,
    });
  }
);


export const notificationController = {
  getNotificationsByUserId,
};
