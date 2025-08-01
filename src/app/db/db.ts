import { UserRole, UserStatus, SubmissionStatus, NotificationType } from "@prisma/client";
import prisma from "../../shared/prisma";
import bcrypt from "bcrypt";
import config from "../../config";

//! Hash Password Function
const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, Number(config.bcrypt_salt_rounds));
};

//! Super Admin
export const superAdmin: any = {
  name: "Super Admin",
  email: "superadmin@assignment-system.com",
  password: "12345678", 
  role: UserRole.INSTRUCTOR,
  status: UserStatus.ACTIVE,
};

//! Instructors
export const instructors = [
  {
    name: "Dr. John Smith",
    email: "john.smith@university.edu",
    password: "12345678", 
    role: UserRole.INSTRUCTOR,
    status: UserStatus.ACTIVE,
  },
  {
    name: "Prof. Sarah Johnson",
    email: "sarah.johnson@university.edu",
    password: "12345678", 
    role: UserRole.INSTRUCTOR,
    status: UserStatus.ACTIVE,
  },
  {
    name: "Dr. Michael Brown",
    email: "michael.brown@university.edu",
    password: "12345678", 
    role: UserRole.INSTRUCTOR,
    status: UserStatus.ACTIVE,
  },
  {
    name: "Prof. Emily Davis",
    email: "emily.davis@university.edu",
    password: "12345678", 
    role: UserRole.INSTRUCTOR,
    status: UserStatus.ACTIVE,
  },
  {
    name: "Dr. Robert Wilson",
    email: "robert.wilson@university.edu",
    password: "12345678", 
    role: UserRole.INSTRUCTOR,
    status: UserStatus.ACTIVE,
  },
];

//! Students
export const students = [
  {
    name: "Alice Cooper",
    email: "alice.cooper@student.edu",
    password: "12345678", 
    role: UserRole.STUDENT,
    status: UserStatus.ACTIVE,
  },
  {
    name: "Bob Martinez",
    email: "bob.martinez@student.edu",
    password: "12345678", 
    role: UserRole.STUDENT,
    status: UserStatus.ACTIVE,
  },
  {
    name: "Carol Thompson",
    email: "carol.thompson@student.edu",
    password: "12345678", 
    role: UserRole.STUDENT,
    status: UserStatus.ACTIVE,
  },
  {
    name: "David Lee",
    email: "david.lee@student.edu",
    password: "12345678", 
    role: UserRole.STUDENT,
    status: UserStatus.ACTIVE,
  },
  {
    name: "Emma Garcia",
    email: "emma.garcia@student.edu",
    password: "12345678", 
    role: UserRole.STUDENT,
    status: UserStatus.ACTIVE,
  },
  {
    name: "Frank Miller",
    email: "frank.miller@student.edu",
    password: "12345678", 
    role: UserRole.STUDENT,
    status: UserStatus.ACTIVE,
  },
  {
    name: "Grace Chen",
    email: "grace.chen@student.edu",
    password: "12345678", 
    role: UserRole.STUDENT,
    status: UserStatus.ACTIVE,
  },
  {
    name: "Henry Rodriguez",
    email: "henry.rodriguez@student.edu",
    password: "12345678", 
    role: UserRole.STUDENT,
    status: UserStatus.ACTIVE,
  },
  {
    name: "Isabel Kim",
    email: "isabel.kim@student.edu",
    password: "12345678", 
    role: UserRole.STUDENT,
    status: UserStatus.ACTIVE,
  },
  {
    name: "Jack Taylor",
    email: "jack.taylor@student.edu",
    password: "12345678", 
    role: UserRole.STUDENT,
    status: UserStatus.ACTIVE,
  },
];

//! Sample Assignments Data
export const sampleAssignments = [
  {
    title: "Introduction to React Components",
    description: "Create a simple React application with at least 3 functional components. Include state management using useState and props passing between components. Submit your code via GitHub repository link.",
    deadline: new Date("2024-12-15T23:59:59Z"),
    isActive: true,
  },
  {
    title: "Database Design Project",
    description: "Design a normalized database schema for an e-commerce platform. Include at least 5 related tables, proper relationships, and constraints. Submit your ERD and SQL schema file.",
    deadline: new Date("2024-12-20T23:59:59Z"),
    isActive: true,
  },
  {
    title: "API Development with Node.js",
    description: "Build a RESTful API using Node.js and Express. Include CRUD operations, input validation, error handling, and proper HTTP status codes. Document your API endpoints.",
    deadline: new Date("2024-12-25T23:59:59Z"),
    isActive: true,
  },
  {
    title: "Data Structures and Algorithms",
    description: "Implement and analyze the time complexity of binary search tree operations. Include insertion, deletion, search, and traversal methods with detailed comments.",
    deadline: new Date("2025-01-05T23:59:59Z"),
    isActive: true,
  },
  {
    title: "Web Security Assessment",
    description: "Conduct a security audit of a provided web application. Identify vulnerabilities, provide detailed reports, and suggest remediation strategies.",
    deadline: new Date("2025-01-10T23:59:59Z"),
    isActive: true,
  },
];

//! Sample Submissions Data
export const sampleSubmissions = [
  {
    submissionUrl: "https://github.com/alice-cooper/react-components-project",
    note: "Completed all requirements. Added extra styling with CSS modules.",
    status: SubmissionStatus.ACCEPTED,
    feedback: "Excellent work! Clean code structure and good use of React hooks.",
  },
  {
    submissionUrl: "https://github.com/bob-martinez/ecommerce-database",
    note: "Database schema with sample data included.",
    status: SubmissionStatus.PENDING,
    feedback: null,
  },
  {
    submissionUrl: "https://github.com/carol-thompson/nodejs-api",
    note: "API includes authentication middleware and comprehensive testing.",
    status: SubmissionStatus.ACCEPTED,
    feedback: "Great implementation of best practices. Well documented.",
  },
  {
    submissionUrl: "https://github.com/david-lee/binary-search-tree",
    note: "Implemented with TypeScript for better type safety.",
    status: SubmissionStatus.REJECTED,
    feedback: "Missing deletion method implementation. Please complete and resubmit.",
  },
];

//! Insert Super Admin
export const insertSuperAdmin = async () => {
  const existingSuperAdmin = await prisma.user.findUnique({
    where: {
      email: superAdmin.email,
    },
  });

  if (existingSuperAdmin) return;

  const hashedPassword = await hashPassword(superAdmin.password);

  await prisma.user.create({
    data: {
      ...superAdmin,
      password: hashedPassword,
    },
  });
};

//! Insert Instructors
export const insertInstructors = async () => {
  const existingInstructors = await prisma.user.findMany({
    where: {
      email: {
        in: instructors.map(instructor => instructor.email),
      },
    },
    select: { email: true },
  });

  const existingEmails = new Set(existingInstructors.map(user => user.email));
  const newInstructors = instructors.filter(instructor => !existingEmails.has(instructor.email));

  if (newInstructors.length) {
    // Hash passwords for all new instructors
    const instructorsWithHashedPasswords = await Promise.all(
      newInstructors.map(async (instructor) => ({
        ...instructor,
        password: await hashPassword(instructor.password),
      }))
    );

    await prisma.user.createMany({
      data: instructorsWithHashedPasswords,
    });
  }
};

//! Insert Students
export const insertStudents = async () => {
  const existingStudents = await prisma.user.findMany({
    where: {
      email: {
        in: students.map(student => student.email),
      },
    },
    select: { email: true },
  });

  const existingEmails = new Set(existingStudents.map(user => user.email));
  const newStudents = students.filter(student => !existingEmails.has(student.email));

  if (newStudents.length) {
    // Hash passwords for all new students
    const studentsWithHashedPasswords = await Promise.all(
      newStudents.map(async (student) => ({
        ...student,
        password: await hashPassword(student.password),
      }))
    );

    await prisma.user.createMany({
      data: studentsWithHashedPasswords,
    });
  }
};

//! Insert Assignments
export const insertAssignments = async () => {
  // Get all instructors to assign assignments to them
  const instructorsList = await prisma.user.findMany({
    where: { role: UserRole.INSTRUCTOR },
    select: { id: true },
  });

  if (!instructorsList.length) {
    console.log("No instructors found. Please seed instructors first.");
    return;
  }

  // Check for existing assignments by title
  const existingAssignments = await prisma.assignment.findMany({
    where: {
      title: {
        in: sampleAssignments.map(assignment => assignment.title),
      },
    },
    select: { title: true },
  });

  const existingTitles = new Set(existingAssignments.map(assignment => assignment.title));
  const newAssignments = sampleAssignments.filter(assignment => !existingTitles.has(assignment.title));

  if (newAssignments.length) {
    // Assign each assignment to a random instructor
    const assignmentsWithInstructors = newAssignments.map((assignment, index) => ({
      ...assignment,
      instructorId: instructorsList[index % instructorsList.length].id,
    }));

    await prisma.assignment.createMany({
      data: assignmentsWithInstructors,
    });
  }
};

//! Insert Sample Submissions
export const insertSubmissions = async () => {
  // Get assignments and students
  const assignments = await prisma.assignment.findMany({
    select: { id: true, title: true },
  });

  const studentsList = await prisma.user.findMany({
    where: { role: UserRole.STUDENT },
    select: { id: true },
  });

  if (!assignments.length || !studentsList.length) {
    console.log("No assignments or students found. Please seed them first.");
    return;
  }

  // Create submissions for each assignment
  const submissionsToCreate = [];

  for (let i = 0; i < Math.min(assignments.length, sampleSubmissions.length); i++) {
    const assignment = assignments[i];
    const submission = sampleSubmissions[i];
    const student = studentsList[i % studentsList.length];

    // Check if submission already exists
    const existing = await prisma.submission.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId: assignment.id,
          studentId: student.id,
        },
      },
    });

    if (!existing) {
      submissionsToCreate.push({
        ...submission,
        assignmentId: assignment.id,
        studentId: student.id,
      });
    }
  }

  if (submissionsToCreate.length) {
    await prisma.submission.createMany({
      data: submissionsToCreate,
    });
  }
};

//! Insert Sample Notifications
export const insertNotifications = async () => {
  const users = await prisma.user.findMany({
    where: { role: UserRole.STUDENT },
    select: { id: true },
  });

  const assignments = await prisma.assignment.findMany({
    select: { id: true, title: true },
  });

  const submissions = await prisma.submission.findMany({
    select: { id: true, assignmentId: true, studentId: true },
  });

  if (!users.length) return;

  const sampleNotifications = [
    {
      title: "New Assignment Posted",
      message: "A new assignment has been posted. Check your dashboard for details.",
      type: NotificationType.NEW_ASSIGNMENT,
      isRead: false,
    },
    {
      title: "Assignment Deadline Reminder",
      message: "Don't forget! Your assignment is due in 2 days.",
      type: NotificationType.DEADLINE_REMINDER,
      isRead: false,
    },
    {
      title: "Assignment Graded",
      message: "Your submission has been graded. Check your feedback.",
      type: NotificationType.ASSIGNMENT_GRADED,
      isRead: true,
    },
  ];

  const notificationsToCreate = sampleNotifications.map((notification, index) => ({
    ...notification,
    userId: users[index % users.length].id,
    assignmentId: assignments.length ? assignments[index % assignments.length].id : null,
    submissionId: submissions.length ? submissions[index % submissions.length].id : null,
  }));

  await prisma.notification.createMany({
    data: notificationsToCreate,
  });
};

