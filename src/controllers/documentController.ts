import { Response } from "express";
import prisma from "../services/db_services.js";
import { Prisma } from "@prisma/client";
import { title } from "node:process";

// Create a new document (unpublished by default based on schema)
export const syncDocumentController = async (req: any, res: Response) => {
  try {
    const { document_id, document } = req.body;
    const author_id = req.user.userId;

    // 1. Validate the user exists
    const userExists = await prisma.user.findUnique({
      where: { id: author_id },
    });

    if (!userExists) {
      return res.status(404).json({
        success: false,
        error: "Author not found. Cannot create document.",
      });
    }

    console.log("✏️ Syncing Document:", document_id, "for Author:", author_id);

    // 2. Perform an atomic upsert operation
    const syncedDocument = await prisma.documents.upsert({
      where: {
        document_id_author_id: {
          document_id,
          author_id,
        },
      },
      update: {
        data: document,
      },
      create: {
        document_id,
        data: document,

        author: {
          connect: { id: author_id },
        },
      },
    });

    // 3. Determine if it was created or updated to return the correct status code
    const isNew =
      syncedDocument.createdAt.getTime() === syncedDocument.updatedAt.getTime();

    return res.status(isNew ? 201 : 200).json({
      success: true,
      message: isNew
        ? "Document created successfully"
        : "Document updated successfully",
      document: syncedDocument,
    });
  } catch (error) {
    console.error("Sync Document Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Update Document (Verifies author)
export const updateDocumentController = async (req: any, res: Response) => {
  try {
    const { document_id } = req.params;
    const { data } = req.body;
    const userId = req.user.userId;

    const document = await prisma.documents.findUnique({
      where: { document_id_author_id: { document_id, author_id: userId } },
    });

    if (!document) {
      return res
        .status(404)
        .json({ success: false, message: "Document not found" });
    }

    if (document.author_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: You are not the author",
      });
    }

    const updatedDocument = await prisma.documents.update({
      where: { document_id_author_id: { document_id, author_id: userId } },
      data: { data },
    });

    return res.status(200).json({
      success: true,
      message: "Document updated successfully",
      document: updatedDocument,
    });
  } catch (error) {
    console.error("Update Document Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

// Delete Document (Verifies author)
export const deleteDocumentController = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    console.log("User who is requesting to delete is ", userId);

    const document = await prisma.documents.findUnique({
      where: { document_id_author_id: { document_id: id, author_id: userId } },
    });

    if (!document) {
      return res
        .status(404)
        .json({ success: false, message: "Document not found" });
    }

    if (document.author_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: You are not the author",
      });
    }

    // Transaction ensures both Document and PublishedDocument (if exists) are deleted

    await prisma.documents.delete({
      where: {
        document_id_author_id: { document_id: id, author_id: userId },
      },
      //foreign key delete
    });

    return res.status(200).json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    console.error("Delete Document Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

// Publish Document (Verifies author)
export const publishDocumentController = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    const userId = req.user.userId;

    const document = await prisma.documents.findUnique({
      where: { document_id_author_id: { document_id: id, author_id: userId } },
    });

    if (!document) {
      return res
        .status(404)
        .json({ success: false, message: "Document not found" });
    }

    // Verify that document's author and anying user are the same
    if (document.author_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: You cannot publish another user's document",
      });
    }

    if (document.isPublished) {
      return res
        .status(400)
        .json({ success: false, message: "Document is already published" });
    }

    // Transaction to update isPublished flag AND create the PublishedDocuments record
    const result = await prisma.$transaction([
      prisma.documents.update({
        where: {
          document_id_author_id: { document_id: id, author_id: userId },
        },
        data: { isPublished: true },
      }),
      prisma.publishedDocuments.create({
        data: {
          title: title ?? "Untitled",
          document_id: document.id, // Maps to Documents.id
          author_id: userId,
          // thumbnail: thumbnail || "null",
          // categories: categories || "null",
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      message: "Document published successfully",
      publishedDocument: result[1],
    });
  } catch (error) {
    console.error("Publish Document Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

// Get a single document by ID
export const getDocumentByIdController = async (req: any, res: Response) => {
  try {
    const { id } = req.params;

    const document = await prisma.documents.findUnique({
      where: {
        document_id_author_id: { document_id: id, author_id: req.user.userId },
      },
      include: { author: true, publishedDocuments: true },
    });
    console.log("Got request for document", document);

    if (!document) {
      return res
        .status(404)
        .json({ success: false, message: "Document not found" });
    }

    return res.status(200).json({ success: true, document });
  } catch (error) {
    console.error("Get Document Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

// Get a specific user's unpublished documents
export const getUnpublishedDocumentsController = async (
  req: any,
  res: Response,
) => {
  try {
    const userId = req.user.userId;
    console.log("🥲 got user to get all docs", userId);
    const documents = await prisma.documents.findMany({
      where: { author_id: userId, isPublished: false },
    });

    return res
      .status(200)
      .json({ success: true, count: documents.length, documents });
  } catch (error) {
    console.error("Get Unpublished Documents Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

// Get a specific user's unpublished document by ID
export const getUnpublishedDocumentByIdController = async (
  req: any,
  res: Response,
) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const document = await prisma.documents.findFirst({
      where: { id, author_id: userId, isPublished: false },
    });

    if (!document) {
      return res
        .status(404)
        .json({ success: false, message: "Unpublished document not found" });
    }

    return res.status(200).json({ success: true, document });
  } catch (error) {
    console.error("Get Unpublished Document Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

// Get all published documents
export const getPublishedDocumentsController = async (
  req: any,
  res: Response,
) => {
  const authorId = req.user.userId;
  try {
    const documents = await prisma.publishedDocuments.findMany({
      where: { author_id: authorId },
      include: {
        document: true,
        author: true,
        _count: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      success: true,
      count: documents.length,
      documents: documents,
    });
  } catch (error) {
    console.error("Get Published Documents Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

// Get documents by Author
export const getDocumentsByAuthorController = async (
  req: any,
  res: Response,
) => {
  try {
    const { authorId } = req.params;

    const documents = await prisma.documents.findMany({
      where: { author_id: authorId },
    });

    return res
      .status(200)
      .json({ success: true, count: documents.length, documents });
  } catch (error) {
    console.error("Get Documents By Author Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

// Get documents by Category
export const getDocumentsByCategoryController = async (
  req: any,
  res: Response,
) => {
  try {
    const { category } = req.params;

    const documents = await prisma.publishedDocuments.findMany({
      where: { categories: category },
    });

    return res
      .status(200)
      .json({ success: true, count: documents.length, documents });
  } catch (error) {
    console.error("Get Documents By Category Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};
