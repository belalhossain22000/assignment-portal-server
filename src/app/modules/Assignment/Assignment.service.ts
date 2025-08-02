import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status";

// 1. Create assignment
const createAssignment = async (data: any) => {
  try {
    // 2. Verify instructor exists and has correct role
    const instructor = await prisma.user.findUnique({
      where: {
        id: data.instructorId,
        role: "INSTRUCTOR",
        status: "ACTIVE",
      },
    });

    if (!instructor) {
      return {
        success: false,
        error: "Instructor not found or not authorized to create assignments",
      };
    }

    // 3. Check for duplicate assignment titles by same instructor
    const existingAssignment = await prisma.assignment.findFirst({
      where: {
        title: data.title,
        instructorId: data.instructorId,
        isActive: true,
      },
    });

    if (existingAssignment) {
      return {
        success: false,
        error: "An assignment with this title already exists",
      };
    }

    // 4. Create assignment in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the assignment
      const assignment = await tx.assignment.create({
        data: {
          title: data.title,
          description: data.description,
          deadline: data.deadline,
          instructorId: data.instructorId,
          isActive: true,
        },
        include: {
          instructor: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      // 5. Get all active students for notifications
      const activeStudents = await tx.user.findMany({
        where: {
          role: "STUDENT",
          status: "ACTIVE",
        },
        select: { id: true, name: true, email: true },
      });

      // 6. Create notifications for all students
      if (activeStudents.length > 0) {
        const notifications = activeStudents.map((student) => ({
          userId: student.id,
          title: "New Assignment Posted",
          message: `${instructor.name} has posted a new assignment: "${
            assignment.title
          }". Deadline: ${assignment.deadline.toLocaleDateString()}`,
          type: "NEW_ASSIGNMENT" as const,
          assignmentId: assignment.id,
        }));

        await tx.notification.createMany({
          data: notifications,
        });
      }

      return {
        assignment,
        notificationCount: activeStudents.length,
      };
    });

    // 7. Log successful creation
    console.log(
      `Assignment "${result.assignment.title}" created by ${instructor.name} (${instructor.id})`
    );
    console.log(`${result.notificationCount} notifications sent to students`);

    return {
      data: result.assignment,
      notificationsSent: result.notificationCount,
    };
  } catch (error: any) {
    // 8. Error handling
    console.error("Assignment creation failed:", error.message);
  }
};

// 2. Get all assignments
const getAllAssignments = async () => {
  const result = await prisma.assignment.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      instructor: {
        select: { id: true, name: true, email: true },
      },
      _count: {
        select: { submissions: true },
      },
    },
  });

  return result;
};

const getSingleAssignment = async (id: string) => {
  const result = await prisma.assignment.findUnique({
    where: { id },
    include: {
      instructor: {
        select: { id: true, name: true, email: true },
      },
      submissions: {
        include: {
          student: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
  });

  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Assignment not found..!!");
  }

  return result;
};

const updateAssignment = async (id: string, data: any) => {
  try {
    const existingAssignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        instructor: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!existingAssignment) {
      throw new ApiError(httpStatus.NOT_FOUND, "Assignment not found");
    }

    // Optional: check instructor permission
    if (
      data.instructorId &&
      data.instructorId !== existingAssignment.instructorId
    ) {
      throw new ApiError(httpStatus.FORBIDDEN, "You cannot reassign ownership");
    }

    // Optional: check for duplicate title
    if (data.title && data.title !== existingAssignment.title) {
      const duplicate = await prisma.assignment.findFirst({
        where: {
          title: data.title as string,
          instructorId: existingAssignment.instructorId,
          isActive: true,
          NOT: { id },
        },
      });

      if (duplicate) {
        throw new ApiError(
          httpStatus.CONFLICT,
          "Duplicate assignment title for this instructor"
        );
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.assignment.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
        include: {
          instructor: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      // ✅ Send notifications only if important fields changed
      const fieldsChanged =
        (data.title && data.title !== existingAssignment.title) ||
        (data.description &&
          data.description !== existingAssignment.description) ||
        (data.deadline && data.deadline !== existingAssignment.deadline);

      let notificationCount = 0;

      if (fieldsChanged) {
        const activeStudents = await tx.user.findMany({
          where: {
            role: "STUDENT",
            status: "ACTIVE",
          },
          select: { id: true, name: true, email: true },
        });

        if (activeStudents.length > 0) {
          const notifications = activeStudents.map((student) => ({
            userId: student.id,
            title: "Assignment Updated",
            message: `${existingAssignment.instructor.name} updated the assignment: "${result.title}". Please check for changes.`,
            type: "ASSIGNMENT_UPDATED" as const,
            assignmentId: result.id,
          }));

          await tx.notification.createMany({
            data: notifications,
          });

          notificationCount = notifications.length;
        }
      }

      return { result, notificationCount };
    });

    console.log(
      `Assignment "${updated.result.title}" updated by ${updated.result.instructor.name}. Notifications sent: ${updated.notificationCount}`
    );

    return {
      notificationsSent: updated.notificationCount,
      data: updated.result,
    };
  } catch (error: any) {
    console.error("Assignment update failed:", error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  }
};

const deleteAssignment = async (id: string, instructorId: string) => {
  const existingAssignment = await prisma.assignment.findUnique({
    where: { id },
  });

  if (!existingAssignment) {
    throw new ApiError(httpStatus.NOT_FOUND, "Assignment not found..!!");
  }

  // ✅ Check if the requesting user is the owner
  if (existingAssignment.instructorId !== instructorId) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "You are not allowed to delete this assignment"
    );
  }

  // Proceed to delete the assignment and related data
  await prisma.$transaction(async (tx) => {
    await tx.submission.deleteMany({ where: { assignmentId: id } });
    await tx.assignment.delete({ where: { id } });
  });

  console.log(
    `Assignment "${existingAssignment.title}" deleted by instructor ${instructorId}`
  );
  return { success: true };
};

//!

const getAssignmentStatsByInstructorId = async (instructorId: string) => {
  const assignments = await prisma.assignment.findMany({
    where: { instructorId },
    include: {
      submissions: true,
    },
  });

  const totalAssignments = assignments.length;
  const totalSubmissions = assignments.reduce(
    (acc, assignment) => acc + assignment.submissions.length,
    0
  );

  const pendingReview = assignments.reduce(
    (acc, assignment) =>
      acc +
      assignment.submissions.filter((sub) => sub.status === "PENDING").length,
    0
  );

  const acceptedSubmissions = assignments.reduce(
    (acc, assignment) =>
      acc +
      assignment.submissions.filter((sub) => sub.status === "ACCEPTED").length,
    0
  );

  const completionRate =
    totalSubmissions > 0
      ? Math.round((acceptedSubmissions / totalSubmissions) * 100)
      : 0;

  return {
    totalAssignments,
    totalSubmissions,
    pendingReview,
    completionRate,
    acceptedSubmissions,
    rejectedSubmissions: totalSubmissions - acceptedSubmissions - pendingReview,
  };
};

const getRecentAssignmentsByInstructor = async (
  instructorId: string,
  limit = 5
) => {
  return await prisma.assignment.findMany({
    where: { instructorId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      submissions: {
        select: {
          id: true,
          status: true,
          submittedAt: true,
          student: {
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

// 4. Get all assignments by instructor
const getAllAssignmentsByInstructor = async (instructorId: string) => {
  const [assignments, totalCount] = await Promise.all([
    prisma.assignment.findMany({
      where: { instructorId },
      orderBy: { createdAt: "desc" },

      include: {
        submissions: {
          select: {
            id: true,
            status: true,
            submittedAt: true,
            student: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    }),
    prisma.assignment.count({
      where: { instructorId },
    }),
  ]);

  return {
    totalCount,
    assignments,
  };
};

const getStudentAssignmentStats = async (studentId: string) => {
  const [allAssignments, mySubmissions] = await Promise.all([
    prisma.assignment.count({
      where: { isActive: true },
    }),
    prisma.submission.findMany({
      where: { studentId },
      select: {
        status: true,
        assignmentId: true,
      },
    }),
  ]);

  const submissionsByAssignment = mySubmissions.reduce((acc: any, sub: any) => {
    acc[sub.assignmentId] = sub;
    return acc;
  }, {});

  const mySubmissionCount = mySubmissions.length;
  const pendingCount = mySubmissions.filter(
    (sub: any) => sub.status === "PENDING"
  ).length;
  const acceptedCount = mySubmissions.filter(
    (sub: any) => sub.status === "ACCEPTED"
  ).length;
  const rejectedCount = mySubmissions.filter(
    (sub: any) => sub.status === "REJECTED"
  ).length;

  return {
    availableAssignments: allAssignments,
    mySubmissions: mySubmissionCount,
    pending: pendingCount,
    accepted: acceptedCount,
    rejected: rejectedCount,
    notSubmitted: allAssignments - mySubmissionCount,
  };
};


const getAvailableAssignmentsForStudent = async (studentId:any) => {

  
  // Get assignments that student hasn't submitted yet
  const submittedAssignmentIds = await prisma.submission.findMany({
    where: { studentId },
    select: { assignmentId: true }
  }).then(submissions => submissions.map(sub => sub.assignmentId));

  const [assignments, totalCount] = await Promise.all([
    prisma.assignment.findMany({
      where: {
        isActive: true,
        id: {
          notIn: submittedAssignmentIds
        }
      },
      orderBy: { deadline: 'asc' },
     
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    }),
    prisma.assignment.count({
      where: {
        isActive: true,
        id: {
          notIn: submittedAssignmentIds
        }
      }
    })
  ]);

  return {
    totalCount,
    assignments,
    
  };
};

export const assignmentService = {
  createAssignment,
  getAllAssignments,
  getSingleAssignment,
  updateAssignment,
  deleteAssignment,
};
