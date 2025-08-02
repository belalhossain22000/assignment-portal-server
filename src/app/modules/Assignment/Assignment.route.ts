import { Router } from "express";
import { assignmentController } from "./Assignment.controller";
import validateRequest from "../../middlewares/validateRequest";
import { createAssignmentSchema } from "./Assignment.validation";
import auth from "../../middlewares/auth";

const router = Router();

// create assignment
router.post(
  "/create",
  validateRequest(createAssignmentSchema),
  assignmentController.createAssignment
);

//getAssignmentStatsByInstructorId
router.get(
  "/assignment-stats/instructor/:id",
  auth(),
  assignmentController.getAssignmentStatsByInstructorId
);

//getRecentAssignmentsByInstructor
router.get(
  "/recent-assignments/instructor/:id",
  auth(),
  assignmentController.getRecentAssignmentsByInstructor
);

//getAllAssignmentsByInstructor
router.get(
  "/all-assignments/instructor/:id",
  auth(),
  assignmentController.getAllAssignmentsByInstructor
);

// getStudentAssignmentStats
router.get(
  "/student-assignment-stats/:id",
  auth(),
  assignmentController.getStudentAssignmentStats
);

//getAvailableAssignmentsForStudent
router.get(
  "/available-assignments-for-student",
  auth(),
  assignmentController.getAvailableAssignmentsForStudent
);

// get all assignment
router.get("/", assignmentController.getAllAssignments);

// get single assignment by id
router.get("/:id", assignmentController.getSingleAssignment);

// update assignment
router.put("/:id", assignmentController.updateAssignment);

// delete assignment
router.delete("/:id", auth(), assignmentController.deleteAssignment);

export const assignmentRoutes = router;
