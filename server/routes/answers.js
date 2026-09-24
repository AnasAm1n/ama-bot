import express from "express";
import {
  createAnswer,
  deleteAnswer,
  getAnswerByCategory,
  getAnswers,
  updateAnswer
} from "../controllers/answersController.js";

const router = express.Router();

router.get("/", getAnswers);
router.get("/:category", getAnswerByCategory);
router.post("/", createAnswer);
router.put("/:category", updateAnswer);
router.delete("/:category", deleteAnswer);

export default router;
