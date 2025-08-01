import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import httpStatus from "http-status";
import { assignmentService } from "./Assignment.service";

const createAssignment = catchAsync(async (req: Request, res: Response) => {
  const result = await assignmentService.createAssignment(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Assignment created successfully",
    data: result,
  });
});

const getAllAssignments = catchAsync(async (req: Request, res: Response) => {
  const results = await assignmentService.getAllAssignments();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Assignments retrieved successfully",
    data: results,
  });
});

const getSingleAssignment = catchAsync(async (req: Request, res: Response) => {
  const result = await assignmentService.getSingleAssignment(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Assignment retrieved successfully",
    data: result,
  });
});

const updateAssignment = catchAsync(async (req: Request, res: Response) => {
  const result = await assignmentService.updateAssignment(
    req.params.id,
    req.body
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Assignment updated successfully",
    data: result,
  });
});

const deleteAssignment = catchAsync(async (req: Request, res: Response) => {
  const result = await assignmentService.deleteAssignment(
    req.params.id,
    req.user.id
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Assignment deleted successfully",
    data: result,
  });
});

export const assignmentController = {
  createAssignment,
  getAllAssignments,
  getSingleAssignment,
  updateAssignment,
  deleteAssignment,
};
