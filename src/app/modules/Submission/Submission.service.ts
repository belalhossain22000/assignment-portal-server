import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status";
import { Submission, UserRole } from "@prisma/client";
import { createStatusUpdateNotification } from "../../../shared/createnotification";

const createSubmission = async (data: Submission) => {
  try {
    // Check if assignment exists and is active
    const assignment = await prisma.assignment.findFirst({
      where: {
        id: data.assignmentId,
        isActive: true,
      },
    });

    if (!assignment) {
      throw new Error("Assignment not found or is inactive");
    }

    // Check if deadline has passed
    if (assignment.deadline < new Date()) {
      throw new Error("Assignment deadline has passed");
    }

    // Check if student exists and is active
    const student = await prisma.user.findFirst({
      where: {
        id: data.studentId,
        role: "STUDENT",
        status: "ACTIVE",
      },
    });

    if (!student) {
      throw new Error("Student not found or is inactive");
    }

    // Check if submission already exists (handled by unique constraint, but better UX)
    const existingSubmission = await prisma.submission.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId: data.assignmentId,
          studentId: data.studentId,
        },
      },
    });

    if (existingSubmission) {
      throw new Error("Submission already exists for this assignment");
    }

    // Create the submission with transaction for data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Create submission
      const submission = await tx.submission.create({
        data: data,
        include: {
          assignment: {
            select: {
              title: true,
              instructor: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          student: {
            select: {
              name: true,
            },
          },
        },
      });

      // Create notification for instructor
      await tx.notification.create({
        data: {
          userId: submission.assignment.instructor.id,
          title: "New Submission Received",
          message: `${submission.student.name} submitted assignment: ${submission.assignment.title}`,
          type: "NEW_SUBMISSION",
          assignmentId: submission.assignmentId,
          submissionId: submission.id,
        },
      });

      return submission;
    });

    return {
      success: true,
      data: result,
    };
  } catch (error: any) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
};

const getAllSubmissions = async (query: {
  assignmentId?: string;
  studentId?: string;
  status?: "PENDING" | "ACCEPTED" | "REJECTED";
}) => {
  const { assignmentId, studentId, status } = query;

  const result = await prisma.submission.findMany({
    where: {
      assignmentId: assignmentId ?? undefined,
      studentId: studentId ?? undefined,
      status: status ?? undefined,
    },
    include: {
      assignment: {
        select: { id: true, title: true, deadline: true },
      },
      student: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return result;
};

const getSingleSubmission = async (id: string) => {
  const result = await prisma.submission.findUnique({
    where: { id },
    include: {
      assignment: {
        select: { id: true, title: true, deadline: true },
      },
      student: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Submission not found..!!");
  }

  return result;
};

const updateSubmission = async (id: string, data: any, context: any) => {
  try {
    // Validate ID format
    if (!id || typeof id !== "string") {
      return {
        success: false,
        error: "Invalid submission ID provided",
      };
    }

    // Get existing submission with related data
    const existingSubmission = await prisma.submission.findUnique({
      where: { id },
      include: {
        assignment: {
          include: {
            instructor: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        student: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!existingSubmission) {
      return {
        success: false,
        error: "Submission not found",
      };
    }

    // Authorization checks
    const isInstructor = context.userRole === "INSTRUCTOR";
    const isStudent = context.userRole === "STUDENT";
    const isSubmissionOwner = existingSubmission.studentId === context.userId;
    const isAssignmentInstructor =
      existingSubmission.assignment.instructorId === context.userId;

    // Check if user has permission to update this submission
    if (!isAssignmentInstructor && !isSubmissionOwner) {
      return {
        success: false,
        error: "You do not have permission to update this submission",
      };
    }

    // Business logic validations
    const updateData: any = {};
    let notificationData: any = null;

    // Students can only update their own submissions and only certain fields
    if (isStudent && isSubmissionOwner) {
      // Students cannot update status or feedback
      if (data.status || data.feedback) {
        return {
          success: false,
          error: "Students cannot update status or feedback",
        };
      }

      // Check if submission is still editable (not graded yet)
      if (existingSubmission.status !== "PENDING") {
        return {
          success: false,
          error: "Cannot update submission after it has been graded",
        };
      }

      // Check deadline (optional - you might want to allow late submissions)
      if (existingSubmission.assignment.deadline < new Date()) {
        return {
          success: false,
          error: "Cannot update submission after deadline",
        };
      }

      // Students can update submission URL and note
      if (data.submissionUrl) updateData.submissionUrl = data.submissionUrl;
      if (data.note !== undefined) updateData.note = data.note;

      // Create notification for instructor about updated submission
      if (Object.keys(updateData).length > 0) {
        notificationData = {
          userId: existingSubmission.assignment.instructorId,
          title: "Submission Updated",
          message: `${existingSubmission.student.name} updated their submission for ${existingSubmission.assignment.title}`,
          type: "NEW_SUBMISSION",
          assignmentId: existingSubmission.assignmentId,
          submissionId: existingSubmission.id,
        };
      }
    }

    // Instructors can update status and feedback
    if (isInstructor && isAssignmentInstructor) {
      if (data.status) updateData.status = data.status;
      if (data.feedback !== undefined) updateData.feedback = data.feedback;

      // Create notification for student about grading
      if (data.status && data.status !== "PENDING") {
        notificationData = {
          userId: existingSubmission.studentId,
          title: "Assignment Graded",
          message: `Your submission for ${
            existingSubmission.assignment.title
          } has been ${data.status.toLowerCase()}`,
          type: "ASSIGNMENT_GRADED",
          assignmentId: existingSubmission.assignmentId,
          submissionId: existingSubmission.id,
        };
      } else if (data.feedback) {
        notificationData = {
          userId: existingSubmission.studentId,
          title: "Feedback Added",
          message: `New feedback added to your submission for ${existingSubmission.assignment.title}`,
          type: "ASSIGNMENT_FEEDBACK",
          assignmentId: existingSubmission.assignmentId,
          submissionId: existingSubmission.id,
        };
      }
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return {
        success: false,
        error: "No valid fields provided for update",
      };
    }

    // Update submission with transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update the submission
      const updatedSubmission = await tx.submission.update({
        where: { id },
        data: updateData,
        include: {
          assignment: {
            select: {
              id: true,
              title: true,
              deadline: true,
              instructor: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          student: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Create notification if needed
      if (notificationData) {
        await tx.notification.create({
          data: notificationData,
        });
      }

      return updatedSubmission;
    });

    return {
      success: true,
      data: result,
      message: "Submission updated successfully",
    };
  } catch (error: any) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
};

const deleteSubmission = async (id: string, userId: string) => {
  const existingSubmission = await prisma.submission.findUnique({
    where: { id },
  });

  if (!existingSubmission) {
    throw new ApiError(httpStatus.NOT_FOUND, "Submission not found..!!");
  }

  // ✅ Check if the requesting user is the owner
  if (existingSubmission.studentId !== userId) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "You are not allowed to delete this submission"
    );
  }

  // Optional: instructors can delete any submission, or add further checks here

  await prisma.submission.delete({ where: { id } });

  return { success: true };
};

const updateSubmissionStatus = async ({
  submissionId,
  newStatus,
  feedback,
  instructorId,
}: any) => {
  try {
    // Validate instructor permissions
    const instructor = await prisma.user.findUnique({
      where: { id: instructorId },
      select: { id: true, role: true, status: true },
    });

    if (!instructor) {
      return { success: false, error: "Instructor not found" };
    }

    if (instructor.role !== UserRole.INSTRUCTOR) {
      return {
        success: false,
        error: "Only instructors can update submission status",
      };
    }

    if (instructor.status !== "ACTIVE") {
      return { success: false, error: "Instructor account is not active" };
    }

    // Get submission with related data
    const existingSubmission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: {
          include: {
            instructor: true,
          },
        },
        student: true,
      },
    });

    if (!existingSubmission) {
      return { success: false, error: "Submission not found" };
    }

    // Verify instructor owns the assignment
    if (existingSubmission.assignment.instructorId !== instructorId) {
      return {
        success: false,
        error: "You can only update submissions for your own assignments",
      };
    }

    // Prevent updating if already in the same status
    if (existingSubmission.status === newStatus) {
      return {
        success: false,
        error: `Submission is already ${newStatus.toLowerCase()}`,
      };
    }

    // Update submission status
    const updatedSubmission = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        status: newStatus,
        feedback: feedback || existingSubmission.feedback,
        updatedAt: new Date(),
      },
      include: {
        assignment: true,
        student: true,
      },
    });

    // Create notification for student
    await createStatusUpdateNotification(updatedSubmission, newStatus);

    return {
      success: true,
      submission: updatedSubmission,
    };
  } catch (error: any) {
    console.error("Error updating submission status:", error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  }
};

//!

//Submission chart API for pie chart (instructor view)
const getSubmissionChartDataForInstructor = async (instructorId: string) => {
  const submissions = await prisma.submission.findMany({
    where: {
      assignment: {
        instructorId,
      },
    },
    select: {
      status: true,
    },
  });

  const statusCounts = submissions.reduce((acc: any, submission) => {
    acc[submission.status] = (acc[submission.status] || 0) + 1;
    return acc;
  }, {});

  return [
    { name: "Pending", value: statusCounts.PENDING || 0, color: "#fbbf24" },
    { name: "Accepted", value: statusCounts.ACCEPTED || 0, color: "#10b981" },
    { name: "Rejected", value: statusCounts.REJECTED || 0, color: "#ef4444" },
  ];
};

const getStudentSubmissionChartData = async (studentId: any) => {
  const submissions = await prisma.submission.findMany({
    where: { studentId },
    select: {
      status: true,
    },
  });

  const statusCounts = submissions.reduce((acc: any, submission) => {
    acc[submission.status] = (acc[submission.status] || 0) + 1;
    return acc;
  }, {});

  const totalAssignments = await prisma.assignment.count({
    where: { isActive: true },
  });

  const totalSubmissions = submissions.length;
  const notSubmitted = totalAssignments - totalSubmissions;

  return [
    { name: "Pending", value: statusCounts.PENDING || 0, color: "#fbbf24" },
    { name: "Accepted", value: statusCounts.ACCEPTED || 0, color: "#10b981" },
    { name: "Rejected", value: statusCounts.REJECTED || 0, color: "#ef4444" },
    { name: "Not Submitted", value: notSubmitted, color: "#6b7280" },
  ];
};

const getStudentRecentSubmissions = async (studentId: any, limit = 5) => {
  return await prisma.submission.findMany({
    where: { studentId },
    orderBy: { submittedAt: "desc" },
    take: limit,
    include: {
      assignment: {
        select: {
          id: true,
          title: true,
          description: true,
          deadline: true,
          instructor: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });
};

const getMySubmissionStats = async (studentId: any) => {
  const submissions = await prisma.submission.findMany({
    where: { studentId },
    select: {
      status: true,
      submittedAt: true,
      assignment: {
        select: {
          deadline: true,
        },
      },
    },
  });

  const totalSubmissions = submissions.length;
  const pendingReview = submissions.filter(
    (sub) => sub.status === "PENDING"
  ).length;
  const accepted = submissions.filter(
    (sub) => sub.status === "ACCEPTED"
  ).length;
  const rejected = submissions.filter(
    (sub) => sub.status === "REJECTED"
  ).length;

  // Calculate late submissions
  const lateSubmissions = submissions.filter(
    (sub) => new Date(sub.submittedAt) > new Date(sub.assignment.deadline)
  ).length;

  // Calculate on-time submissions
  const onTimeSubmissions = totalSubmissions - lateSubmissions;

  // Calculate acceptance rate
  const reviewedSubmissions = accepted + rejected;
  const acceptanceRate =
    reviewedSubmissions > 0
      ? Math.round((accepted / reviewedSubmissions) * 100)
      : 0;

  return {
    totalSubmissions,
    pendingReview,
    accepted,
    rejected,
    lateSubmissions,
    onTimeSubmissions,
    acceptanceRate,
    averageResponseTime:
      reviewedSubmissions > 0
        ? Math.round((reviewedSubmissions / totalSubmissions) * 100)
        : 0,
  };
};

//Give feedback to a submission (Accept/Reject with feedback)
const giveSubmissionFeedback = async (
  instructorId: string,
  submissionId: string,
  feedbackData: any
) => {
  const { feedback } = feedbackData;
  console.log(feedback);

  // Validate submission belongs to instructor's assignment
  const submission = await prisma.submission.findFirst({
    where: {
      id: submissionId,
      assignment: {
        instructorId,
      },
    },
    include: {
      assignment: {
        select: {
          id: true,
          title: true,
          instructorId: true,
        },
      },
      student: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!submission) {
    throw new ApiError(404, "Submission not found or unauthorized");
  }

  // Update submission with feedback
  const updatedSubmission = await prisma.submission.update({
    where: { id: submissionId },
    data: {
      feedback,
      updatedAt: new Date(),
    },
    include: {
      assignment: {
        select: {
          id: true,
          title: true,
          instructorId: true,
        },
      },
      student: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  // Create notification for student
  await prisma.notification.create({
    data: {
      userId: submission.student.id,
      title: `Assignment ${
        status === "ACCEPTED" ? "Accepted" : "Feedback Received"
      }`,
      message: `Your submission for "${
        submission.assignment.title
      }" has been ${status.toLowerCase()}. ${
        feedback ? "Check the feedback for details." : ""
      }`,
      type: status === "ACCEPTED" ? "ASSIGNMENT_GRADED" : "ASSIGNMENT_FEEDBACK",
      assignmentId: submission.assignment.id,
      submissionId: submissionId,
    },
  });

  return updatedSubmission;
};

export const submissionService = {
  createSubmission,
  getAllSubmissions,
  getSingleSubmission,
  updateSubmission,
  deleteSubmission,
  updateSubmissionStatus,
  //!
  getSubmissionChartDataForInstructor,
  getStudentSubmissionChartData,
  getStudentRecentSubmissions,
  getMySubmissionStats,
  giveSubmissionFeedback,
};
