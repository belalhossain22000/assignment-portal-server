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
    console.error("Assignment update failed:", error.message);
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Assignment update failed"
    );
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
    throw new ApiError(httpStatus.FORBIDDEN, "You are not allowed to delete this assignment");
  }

  // Proceed to delete the assignment and related data
  await prisma.$transaction(async (tx) => {
    await tx.submission.deleteMany({ where: { assignmentId: id } });
    await tx.assignment.delete({ where: { id } });
  });

  console.log(`Assignment "${existingAssignment.title}" deleted by instructor ${instructorId}`);
  return { success: true };
};


export const assignmentService = {
  createAssignment,
  getAllAssignments,
  getSingleAssignment,
  updateAssignment,
  deleteAssignment,
};
