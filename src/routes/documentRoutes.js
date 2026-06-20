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
  publishDocumentController, // Added the publish controller
} from "../controllers/documentController.ts"; // Adjust path as necessary
import { auth } from "../middilewares/authenticated-middileware.ts";

const router = express.Router();

// Create a new document
router.post("/create", auth, createDocumentController);

// Update a document (Author only)
router.put("/:id", auth, updateDocumentController);

// Delete a document (Author only)
router.delete("/:id", auth, deleteDocumentController);

// Publish a document (Author only)
router.post("/:id/publish", auth, publishDocumentController);

// Get a specific document by ID
router.get("/:id", auth, getDocumentByIdController);

// Get all unpublished documents for the authenticated user
router.get("/unpublished/me", auth, getUnpublishedDocumentsController);

// Get a specific unpublished document by ID for the authenticated user
router.get("/unpublished/:id", auth, getUnpublishedDocumentByIdController);

// Get all published documents
router.get("/published/all", getPublishedDocumentsController);

// Get documents by a specific author
router.get("/author/:authorId", getDocumentsByAuthorController);

// Get published documents by category
router.get("/category/:category", auth, getDocumentsByCategoryController);

export default router;
