import prisma from "../../shared/prisma";
import {
  insertAssignments,
  insertInstructors,
  insertNotifications,
  insertStudents,
  insertSubmissions,
  insertSuperAdmin,
} from "./db";

export const seedDatabase = async () => {
  console.log("🌱 Starting database seeding...");

  await insertSuperAdmin();
  console.log("✅ Super admin inserted");

  await insertInstructors();
  console.log("✅ Instructors inserted");

  await insertStudents();
  console.log("✅ Students inserted");

  await insertAssignments();
  console.log("✅ Assignments inserted");

  await insertSubmissions();
  console.log("✅ Submissions inserted");

  await insertNotifications();
  console.log("✅ Notifications inserted");

  console.log("🎉 Database seeding completed successfully!");

  process.exit(0);
};

seedDatabase()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
