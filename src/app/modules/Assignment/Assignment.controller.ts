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


//getAssignmentStatsByInstructorId
const getAssignmentStatsByInstructorId = catchAsync(
  async (req: Request, res: Response) => {
    const result = await assignmentService.getAssignmentStatsByInstructorId(
      req.user.id
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Assignment stats retrieved successfully",
      data: result,
    });
  }
)

//getRecentAssignmentsByInstructor
const getRecentAssignmentsByInstructor = catchAsync(
  async (req: Request, res: Response) => {
    const result = await assignmentService.getRecentAssignmentsByInstructor(
      req.user.id
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Recent assignments retrieved successfully",
      data: result,
    });
  }
)

//getAllAssignmentsByInstructor
const getAllAssignmentsByInstructor = catchAsync(
  async (req: Request, res: Response) => {
    const result = await assignmentService.getAllAssignmentsByInstructor(
      req.user.id
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "All assignments retrieved successfully",
      data: result,
    });
  }
)

//getStudentAssignmentStats
const getStudentAssignmentStats = catchAsync(
  async (req: Request, res: Response) => {
    const result = await assignmentService.getStudentAssignmentStats(
      req.user.id
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Assignment stats retrieved successfully",
      data: result,
    });
  }
)

//getAvailableAssignmentsForStudent
const getAvailableAssignmentsForStudent = catchAsync(
  async (req: Request, res: Response) => {
    const result = await assignmentService.getAvailableAssignmentsForStudent(
      req.user.id
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Assignment stats retrieved successfully",
      data: result,
    });
  }
)

export const assignmentController = {
  createAssignment,
  getAllAssignments,
  getSingleAssignment,
  updateAssignment,
  deleteAssignment,
  getAssignmentStatsByInstructorId,
  getRecentAssignmentsByInstructor,
  getAllAssignmentsByInstructor,
  getStudentAssignmentStats,
  getAvailableAssignmentsForStudent
};
