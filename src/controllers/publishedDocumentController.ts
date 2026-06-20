import prisma from "../services/db_services.js";
import { Request, Response } from "express";

export const getPublishedDocuments = async (req: Request, res: Response) => {
  const docs = prisma.publishedDocuments.findMany();
  res.status(201).json({ publishedDocuments: docs });
};

export const publishDocument = async (req: Request, res: Response) => {
  const { title, document_id, author_id, thumbnail, categories } = req.body;
  const user = req.user;

  try {
    if (!title || !document_id || !author_id) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const doc = await prisma.documents.findUnique({
      where: { id: document_id },
    });
    if (doc?.author_id !== author_id) {
      return res
        .status(404)
        .json({ error: "Article does not belong to the author" });
    }

    //check if docuement actually belongs to the author
    if (user && author_id !== user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const document = await prisma.publishedDocuments.create({
      data: {
        title,
        document_id,
        author_id,
        thumbnail: thumbnail ?? "null",
        createdAt: new Date(),
        categories: categories ?? "null",
      },
    });
    res.status(201).json({ publishedDocument: document });
  } catch (error) {
    res.status(500).json({ error: "Failed to publish document" });
  }
};
