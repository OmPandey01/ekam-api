import express from "express";
import { getPublishedDocumentByIdController, searchPublishedDocumentsController, toggleAppreciationController, toggleBookmarkController, getUserBookmarksController, getFeaturedArticlesController, getForYouFeedController, } from "../controllers/publishedDocumentController.js";
import { auth } from "../middilewares/authenticated-middileware.js";
const router = express.Router();
// Search published documents (Query params: ?q=title&category=cat&author=name&startDate=...&endDate=...)
router.get("/search", auth, searchPublishedDocumentsController);
// Get user's bookmarked documents
router.get("/bookmarks/me", auth, getUserBookmarksController);
// Get a single published document by ID (increments views)
router.get("/:id", auth, getPublishedDocumentByIdController);
// Appreciate (Like/Unlike) a published document
router.post("/:id/appreciate", auth, toggleAppreciationController);
// Bookmark (Save/Unsave) a published document
router.post("/:id/bookmark", auth, toggleBookmarkController);
// Get featured articles
// "For You" feed - Top 15 latest articles
router.get("/for-you", auth, getForYouFeedController);
router.get("/featured", auth, getFeaturedArticlesController);
export default router;
