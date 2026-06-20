import { Router } from "express";
import {
  getPublishedDocumentById,
  getPublishedDocuments,
  getDocumentsByAuthor,
  getDocumentsByCategory,
} from "../controllers/publishedDocumentController";

const router = Router();

router.get("/:id", getPublishedDocumentById);
router.get("/", getPublishedDocuments);

export default router;
