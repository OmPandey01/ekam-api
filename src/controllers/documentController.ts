import { Request, Response } from "express";
import prisma from "../services/db_services";

// Create a new document (unpublished by default based on schema)
export const createDocumentController = async (req: Request, res: Response) => {
  try {
    const { document_id, data } = req.body;
    const author_id = req.user.id; // Assuming auth middleware injects user object

    const newDocument = await prisma.documents.create({
      data: {
        document_id,
        author_id,
        data,
        isPublished: false, // Explicitly setting default
      },
    });

    return res.status(201).json({
      success: true,
      message: "Document created successfully",
      document: newDocument,
    });
  } catch (error) {
    console.error("Create Document Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

// Update Document (Verifies author)
export const updateDocumentController = async (req: Request, res: Response) => {
  try {
    const { document_id } = req.params;
    const { data } = req.body;
    const userId = req.user.id;

    const document = await prisma.documents.findUnique({
      where: { document_id },
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
      where: { id },
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
export const deleteDocumentController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const document = await prisma.documents.findUnique({ where: { id } });

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
    await prisma.$transaction([
      prisma.publishedDocuments.deleteMany({ where: { document_id: id } }),
      prisma.documents.delete({ where: { id } }),
    ]);

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
export const publishDocumentController = async (
  req: Request,
  res: Response,
) => {
  try {
    const { id } = req.params;
    const { title, thumbnail, categories } = req.body;
    const userId = req.user.id;

    const document = await prisma.documents.findUnique({ where: { id } });

    if (!document) {
      return res
        .status(404)
        .json({ success: false, message: "Document not found" });
    }

    // Verify that document's author and requesting user are the same
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
        where: { id },
        data: { isPublished: true },
      }),
      prisma.publishedDocuments.create({
        data: {
          title,
          document_id: document.id, // Maps to Documents.id
          author_id: userId,
          thumbnail: thumbnail || "null",
          categories: categories || "null",
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
export const getDocumentByIdController = async (
  req: Request,
  res: Response,
) => {
  try {
    const { id } = req.params;

    const document = await prisma.documents.findUnique({
      where: { id },
      include: { author: true, publishedDocuments: true },
    });

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
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.user.id;

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
  req: Request,
  res: Response,
) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

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
  req: Request,
  res: Response,
) => {
  try {
    const documents = await prisma.publishedDocuments.findMany({
      include: { appreciations: true },
      orderBy: { createdAt: "desc" },
    });

    return res
      .status(200)
      .json({ success: true, count: documents.length, documents });
  } catch (error) {
    console.error("Get Published Documents Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

// Get documents by Author
export const getDocumentsByAuthorController = async (
  req: Request,
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
  req: Request,
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
