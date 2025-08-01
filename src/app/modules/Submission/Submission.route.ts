import { Router } from "express";
import { submissionController } from "./Submission.controller";
import validateRequest from "../../middlewares/validateRequest";
import { SubmissionValidation } from "./Submission.validation";
import auth from "../../middlewares/auth";

const router = Router();

// create submission
router.post(
  "/create",
  validateRequest(SubmissionValidation.createSubmissionSchema),
  submissionController.createSubmission
);

// get all submission
router.get("/", submissionController.getAllSubmissions);

// get single submission by id
router.get("/:id", submissionController.getSingleSubmission);

//update submission status
router.put(
  "/status/:id",
  auth(),
  validateRequest(SubmissionValidation.UpdateSubmissionStatusSchema),
  submissionController.updateSubmissionStatus
);

// update submission
router.put(
  "/:id",
  auth(),
  validateRequest(SubmissionValidation.updateSubmissionSchema),
  submissionController.updateSubmission
);

// delete submission
router.delete("/:id", auth(), submissionController.deleteSubmission);

export const submissionRoutes = router;
