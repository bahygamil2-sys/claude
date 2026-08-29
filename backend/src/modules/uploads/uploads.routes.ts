import { Router } from "express";
import multer from "multer";
import crypto from "node:crypto";
import { Role } from "@prisma/client";
import { authenticate } from "../../middleware/authenticate";
import { requireRole } from "../../middleware/requireRole";
import { ApiError } from "../../lib/ApiError";
import { UPLOADS_DIR } from "../../config/paths";

const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    // Never trust the client's filename/extension directly; derive it from the sniffed mimetype.
    const ext = MIME_EXTENSIONS[file.mimetype] ?? "";
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!MIME_EXTENSIONS[file.mimetype]) {
      cb(new Error("Unsupported file type. Allowed: JPEG, PNG, WebP, GIF."));
      return;
    }
    cb(null, true);
  },
});

export const uploadsRouter = Router();

uploadsRouter.post(
  "/image",
  authenticate,
  requireRole(Role.RESTAURANT_OWNER, Role.ADMIN),
  (req, res, next) => {
    upload.single("image")(req, res, (err) => {
      if (err) return next(ApiError.badRequest(err instanceof Error ? err.message : "Upload failed"));
      next();
    });
  },
  (req, res) => {
    if (!req.file) throw ApiError.badRequest("No image file provided");
    res.status(201).json({ url: `/uploads/${req.file.filename}` });
  }
);
