import "dotenv/config"; //newer way om
import express from "express";
import cookieParser from "cookie-parser";

import authRouter from "./src/routes/authRoutes.js";
import publishedDocumentsRouter from "./src/routes/publishedDocumentsRoutes.js";
import documentRouter from "./src/routes/documentRoutes.js";

import cors from "cors";
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

const allowedOrigins = [
  process.env.FRONTEND_URL_ekam,
  process.env.FRONTEND_URL,
  "http://localhost:3000",
]; // Removes undefined, null, or ""

const corsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void,
  ) => {
    // Allow requests with no origin (like mobile apps, curl, or Postman)
    if (!origin) {
      return callback(null, true);
    }

    // Check if the incoming origin is in your allowed list
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Apply middleware
app.use(cors(corsOptions));
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/auth", authRouter);
app.use("/documents", documentRouter);
app.use("/articles", publishedDocumentsRouter);

app.listen(4000, () => {
  console.log("Server is running on port 4000");
});
