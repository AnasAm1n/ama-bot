import express from "express";
import {
  createAnswer,
  deleteAnswer,
  getAnswerByCategory,
  getAnswers,
  updateAnswer
} from "../controllers/answersController.js";

const router = express.Router();

// Jeg bruger disse ruter som den simple API-oversigt til svarreglerne. Det gør det nemt at læse, opdatere og slette kategorier uden at smide logikken ud i selve serveren.
router.get("/", getAnswers);
router.get("/:category", getAnswerByCategory);
router.post("/", createAnswer);
router.put("/:category", updateAnswer);
router.delete("/:category", deleteAnswer);

export default router;
