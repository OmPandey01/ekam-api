import express from "express";
import {
  createDocumentController,
  updateDocumentController,
  deleteDocumentController,
  getDocumentByIdController,
  getUnpublishedDocumentByIdController,
  getUnpublishedDocumentsController,
  getPublishedDocumentsController,
  getDocumentsByAuthorController,
  getDocumentsByCategoryController,
} from "../controllers/publishedDocumentController";
import { authenticatedMiddleware } from "../middilewares/authenticated-middileware";

const router = express.Router();

export default router;
