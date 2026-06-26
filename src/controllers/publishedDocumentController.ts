import { Response, NextFunction } from "express";
import prisma from "../services/db_services.js";
import { Prisma } from "@prisma/client";

// 1. Get a single published document by ID (Increments views)
export const getPublishedDocumentByIdController = async (
  req: any,
  res: Response,
) => {
  try {
    const { id } = req.params;

    const document = await prisma.publishedDocuments.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true } },
        appreciations: true,
        document: true,
      },
    });

    if (!document) {
      return res
        .status(404)
        .json({ success: false, message: "Published document not found" });
    }

    // Increment view count
    await prisma.publishedDocuments.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    return res.status(200).json({ success: true, document: document.document });
  } catch (error) {
    console.error("Get Published Document Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

// 2. Search Published Documents (by title, category, author, timeline)
export const searchPublishedDocumentsController = async (
  req: any,
  res: Response,
) => {
  try {
    const { q, category, author, startDate, endDate } = req.query;

    const whereClause: Prisma.PublishedDocumentsWhereInput = {};

    // Search by Title
    if (q) {
      whereClause.title = { contains: q as string, mode: "insensitive" };
    }

    // Search by Category
    if (category) {
      whereClause.categories = {
        has: category as string,
      };
    }

    // Search by Author (name or ID)
    if (author) {
      whereClause.author = {
        OR: [
          { name: { contains: author as string, mode: "insensitive" } },
          { id: author as string },
        ],
      };
    }

    // Search by Timeline (Date range)
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = new Date(startDate as string);
      if (endDate) whereClause.createdAt.lte = new Date(endDate as string);
    }

    const documents = await prisma.publishedDocuments.findMany({
      where: whereClause,
      include: {
        author: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return res
      .status(200)
      .json({ success: true, count: documents.length, documents });
  } catch (error) {
    console.error("Search Published Documents Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

// 3. Toggle Appreciation (Like/Unlike)
export const toggleAppreciationController = async (req: any, res: Response) => {
  try {
    const { id } = req.params; // PublishedDocument ID
    const userId = req.user.userId;

    const publishedDoc = await prisma.publishedDocuments.findUnique({
      where: { id },
    });
    if (!publishedDoc) {
      return res
        .status(404)
        .json({ success: false, message: "Document not found" });
    }

    // Check if appreciation already exists
    const existingAppreciation = await prisma.appreciation.findFirst({
      where: { userId, publishedDocumentId: id },
    });

    if (existingAppreciation) {
      // Unlike (Remove appreciation)
      await prisma.$transaction([
        prisma.appreciation.delete({ where: { id: existingAppreciation.id } }),
        prisma.publishedDocuments.update({
          where: { id },
          data: { appreciationCount: { decrement: 1 } },
        }),
      ]);

      return res.status(200).json({
        success: true,
        message: "Appreciation removed",
        appreciated: false,
      });
    } else {
      // Like (Add appreciation)
      await prisma.$transaction([
        prisma.appreciation.create({
          data: { userId, publishedDocumentId: id },
        }),
        prisma.publishedDocuments.update({
          where: { id },
          data: { appreciationCount: { increment: 1 } },
        }),
      ]);

      return res.status(200).json({
        success: true,
        message: "Appreciation added",
        appreciated: true,
      });
    }
  } catch (error) {
    console.error("Toggle Appreciation Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

// 4. Toggle Bookmark (Save/Unsave)
export const toggleBookmarkController = async (req: any, res: Response) => {
  try {
    const { id } = req.params; // PublishedDocument ID
    const userId = req.user.userId;

    const publishedDoc = await prisma.publishedDocuments.findUnique({
      where: { id },
    });
    if (!publishedDoc) {
      return res
        .status(404)
        .json({ success: false, message: "Document not found" });
    }

    // Bookmarks table links to Documents table, so we use publishedDoc.document_id
    const documentId = publishedDoc.document_id;

    const existingBookmark = await prisma.bookmarks.findFirst({
      where: { userId, documentId },
    });

    if (existingBookmark) {
      // Unsave (Remove bookmark)
      await prisma.bookmarks.delete({ where: { id: existingBookmark.id } });
      return res.status(200).json({
        success: true,
        message: "Bookmark removed",
        bookmarked: false,
      });
    } else {
      // Save (Add bookmark)
      await prisma.bookmarks.create({
        data: { userId, documentId },
      });
      return res
        .status(200)
        .json({ success: true, message: "Bookmark added", bookmarked: true });
    }
  } catch (error) {
    console.error("Toggle Bookmark Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

// 5. Get User's Bookmarked Documents
export const getUserBookmarksController = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;

    const bookmarks = await prisma.bookmarks.findMany({
      where: { userId },
      include: {
        document: {
          include: {
            publishedDocuments: true, // Include the published details
            author: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res
      .status(200)
      .json({ success: true, count: bookmarks.length, bookmarks });
  } catch (error) {
    console.error("Get User Bookmarks Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

// Get "For You" Feed (Top 15 latest published articles)
export const getForYouFeedController = async (req: any, res: Response) => {
  try {
    const feed = await prisma.publishedDocuments.findMany({
      take: 15, // Limits to 15 or less
      orderBy: {
        createdAt: "desc", // Gets the latest articles first
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      count: feed.length,
      feed,
    });
  } catch (error) {
    console.error("Get For You Feed Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

export const getFeaturedArticlesController = async (
  req: any,
  res: Response,
) => {
  try {
    const feed = await prisma.publishedDocuments.findMany({
      take: 20, // Limits to 15 or less
      orderBy: {
        createdAt: "desc", // Gets the latest articles first
      },
      include: {
        
        author: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      count: feed.length,
      feed,
    });
  } catch (error) {
    console.error("Featured Feed Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};
