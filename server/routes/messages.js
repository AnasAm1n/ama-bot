import express from "express";
import {
  createMessage,
  deleteMessages,
  getMessages
} from "../controllers/messagesController.js";

const router = express.Router();

// Jeg har disse ruter som den overskuelige adgang til chatdata. Det er praktisk, fordi hele logikken for at læse og rydde samtalen ligger separat fra resten af serveren.
router.get("/", getMessages);
router.post("/", createMessage);
router.delete("/", deleteMessages);

export default router;
