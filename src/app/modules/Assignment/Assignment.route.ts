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

// get all assignment
router.get("/", assignmentController.getAllAssignments);

// get single assignment by id
router.get("/:id", assignmentController.getSingleAssignment);

// update assignment
router.put("/:id", assignmentController.updateAssignment);

// delete assignment
router.delete("/:id", auth(), assignmentController.deleteAssignment);

export const assignmentRoutes = router;
