import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import httpStatus from "http-status";
import { submissionService } from "./Submission.service";

const createSubmission = catchAsync(async (req: Request, res: Response) => {
  const result = await submissionService.createSubmission(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Submission created successfully",
    data: result,
  });
});

const getAllSubmissions = catchAsync(async (req: Request, res: Response) => {
  const results = await submissionService.getAllSubmissions(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Submissions retrieved successfully",
    data: results,
  });
});

const getSingleSubmission = catchAsync(async (req: Request, res: Response) => {
  const result = await submissionService.getSingleSubmission(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Submission retrieved successfully",
    data: result,
  });
});

const updateSubmission = catchAsync(async (req: Request, res: Response) => {
  const result = await submissionService.updateSubmission(
    req.params.id,
    req.body,
    req.body.context
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Submission updated successfully",
    data: result,
  });
});

const deleteSubmission = catchAsync(async (req: Request, res: Response) => {
  const result = await submissionService.deleteSubmission(
    req.params.id,
    req.user.id
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Submission deleted successfully",
    data: result,
  });
});

//update submission status
const updateSubmissionStatus = catchAsync(
  async (req: Request, res: Response) => {
    const submissionId = req.params.id;
    const instructorId = req.user.id;

    const { newStatus, feedback } = req.body;

    const result = await submissionService.updateSubmissionStatus({
      submissionId,
      newStatus,
      feedback,
      instructorId,
    });
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Submission status updated successfully",
      data: result,
    });
  }
);

//getSubmissionChartDataForInstructor
const getSubmissionChartDataForInstructor = catchAsync(
  async (req: Request, res: Response) => {
    const result = await submissionService.getSubmissionChartDataForInstructor(
      req.user.id
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Submission chart data retrieved successfully",
      data: result,
    });
  }
);

//getStudentSubmissionChartData
const getStudentSubmissionChartData = catchAsync(
  async (req: Request, res: Response) => {
    const result = await submissionService.getStudentSubmissionChartData(
      req.user.id
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Submission chart data retrieved successfully",
      data: result,
    });
  }
);

//getStudentRecentSubmissions
const getStudentRecentSubmissions = catchAsync(
  async (req: Request, res: Response) => {
    const result = await submissionService.getStudentRecentSubmissions(
      req.user.id
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Submission chart data retrieved successfully",
      data: result,
    });
  }
);

//getMySubmissionStats
const getMySubmissionStats = catchAsync(async (req: Request, res: Response) => {
  const result = await submissionService.getMySubmissionStats(req.user.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Submission chart data retrieved successfully",
    data: result,
  });
});

//giveSubmissionFeedback
const giveSubmissionFeedback = catchAsync(
  async (req: Request, res: Response) => {
    const result = await submissionService.giveSubmissionFeedback(
      req.user.id,
      req.params.id,
      req.body
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Submission chart data retrieved successfully",
      data: result,
    });
  }
);

export const submissionController = {
  createSubmission,
  getAllSubmissions,
  getSingleSubmission,
  updateSubmission,
  deleteSubmission,
  updateSubmissionStatus,
  getSubmissionChartDataForInstructor,
  getStudentSubmissionChartData,
  getStudentRecentSubmissions,
  getMySubmissionStats,
  giveSubmissionFeedback,
};
