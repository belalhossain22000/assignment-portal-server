import { Assignment } from "@prisma/client";
import prisma from "./prisma";

const getActiveStudentNotifications = async (assignment: Assignment & { instructor?: { name: string } }) => {
  const activeStudents = await prisma.user.findMany({
    where: {
      role: 'STUDENT',
      status: 'ACTIVE',
    },
    select: { id: true },
  });

  return activeStudents.map((student) => ({
    userId: student.id,
    title: 'Assignment Removed',
    message: `The assignment "${assignment.title}" by ${assignment.instructor?.name} has been removed.`,
    type: 'ASSIGNMENT_DELETED' as const,
    assignmentId: assignment.id,
  }));
};
