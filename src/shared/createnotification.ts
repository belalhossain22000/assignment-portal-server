import { NotificationType, SubmissionStatus } from "@prisma/client";
import prisma from "./prisma";

function getNotificationData(status: SubmissionStatus, submission: any) {
  const assignmentTitle = submission.assignment.title;
  
  switch (status) {
    case SubmissionStatus.ACCEPTED:
      return {
        title: 'Submission Accepted ✅',
        message: `Your submission for "${assignmentTitle}" has been accepted.${submission.feedback ? ` Feedback: ${submission.feedback}` : ''}`,
        type: NotificationType.ASSIGNMENT_GRADED
      };
    
    case SubmissionStatus.REJECTED:
      return {
        title: 'Submission Requires Revision ❌',
        message: `Your submission for "${assignmentTitle}" needs revision.${submission.feedback ? ` Feedback: ${submission.feedback}` : ''}`,
        type: NotificationType.ASSIGNMENT_FEEDBACK
      };
    
    case SubmissionStatus.PENDING:
    default:
      return {
        title: 'Submission Under Review ⏳',
        message: `Your submission for "${assignmentTitle}" is being reviewed.`,
        type: NotificationType.ASSIGNMENT_GRADED
      };
  }
}

export async function createStatusUpdateNotification(submission: any, newStatus: SubmissionStatus) {
  const notificationData = getNotificationData(newStatus, submission);
  
  await prisma.notification.create({
    data: {
      userId: submission.studentId,
      title: notificationData.title,
      message: notificationData.message,
      type: notificationData.type,
      assignmentId: submission.assignmentId,
      submissionId: submission.id
    }
  });
}