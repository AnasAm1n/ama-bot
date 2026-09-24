import express from "express";
import {
  createMessage,
  deleteMessages,
  getMessages
} from "../controllers/messagesController.js";

const router = express.Router();

router.get("/", getMessages);
router.post("/", createMessage);
router.delete("/", deleteMessages);

export default router;
