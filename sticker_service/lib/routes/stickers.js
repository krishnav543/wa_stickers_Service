// routes/stickers.js
const express = require("express");
const multer = require("multer");
const router = express.Router();

const Sticker = require("../models/Sticker");
const StickerPack = require("../models/StickerPack");
const {
  addStickerToPack,
  removeSticker,
} = require("../services/stickerService");
const swagger = require("../config/swagger");
const requireAdminKey = require("../middleware/requireAdminKey");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!["image/webp", "image/png"].includes(file.mimetype)) {
      return cb(new Error("Only .webp or .png files are accepted"));
    }
    cb(null, true);
  },
});

/**
 * @swagger
 * /api/packs:
 *   post:
 *     summary: Create a new sticker pack
 *     tags: [Packs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, slug]
 *             properties:
 *               name: { type: string }
 *               slug: { type: string }
 *               description: { type: string }
 *               category: { type: string }
 *     responses:
 *       201:
 *         description: Pack created
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/StickerPack' }
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post("/packs", async (req, res) => {
  try {
    const { name, slug, description, category } = req.body;
    const pack = await StickerPack.create({
      name,
      slug,
      description,
      category,
    });
    res.status(201).json(pack);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/packs:
 *   get:
 *     summary: List all public sticker packs
 *     tags: [Packs]
 *     responses:
 *       200:
 *         description: List of packs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/StickerPack' }
 */
router.get("/packs", async (req, res) => {
  const packs = await StickerPack.find({ isPublic: true }).sort({
    createdAt: -1,
  });
  res.json(packs);
});

/**
 * @swagger
 * /api/packs/{packId}/stickers:
 *   post:
 *     summary: Upload a .webp sticker into a pack
 *     tags: [Stickers]
 *     parameters:
 *       - in: path
 *         name: packId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               tags:
 *                 type: string
 *                 description: Comma-separated tags
 *     responses:
 *       201:
 *         description: Sticker created
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Sticker' }
 *       400:
 *         description: Invalid file or input
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post(
  "/packs/:packId/stickers",
  upload.single("file"),
  async (req, res) => {
    try {
      const { packId } = req.params;
      const tags = (req.body.tags || "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });

      const sticker = await addStickerToPack({
        fileBuffer: req.file.buffer,
        packId,
        tags,
      });
      res.status(201).json(sticker);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },
);

/**
 * @swagger
 * /api/packs/{packId}/stickers:
 *   get:
 *     summary: Get all stickers in a pack
 *     tags: [Stickers]
 *     parameters:
 *       - in: path
 *         name: packId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of stickers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Sticker' }
 */
router.get("/packs/:packId/stickers", async (req, res) => {
  const stickers = await Sticker.find({ packId: req.params.packId });
  res.json(stickers);
});

/**
 * @swagger
 * /api/stickers/{id}:
 *   delete:
 *     summary: Delete a sticker
 *     tags: [Stickers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: Deleted
 *       404:
 *         description: Sticker not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.delete("/stickers/:id", async (req, res) => {
  const deleted = await removeSticker(req.params.id);
  if (!deleted) return res.status(404).json({ error: "Sticker not found" });
  res.sendStatus(204);
});

/**
 * @swagger
 * /api/stickers/search:
 *   get:
 *     summary: Full-text search stickers by name/tags
 *     tags: [Stickers]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Matching stickers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Sticker' }
 */
router.get("/stickers/search", async (req, res) => {
  const { q } = req.query;
  const stickers = await Sticker.find(
    { $text: { $search: q } },
    { score: { $meta: "textScore" } },
  )
    .sort({ score: { $meta: "textScore" } })
    .limit(30);
  res.json(stickers);
});

/**
 * @swagger
 * /api/stickers/trending:
 *   get:
 *     summary: Get top 20 stickers by usage count
 *     tags: [Stickers]
 *     responses:
 *       200:
 *         description: Trending stickers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Sticker' }
 */
router.get("/stickers/trending", async (req, res) => {
  const stickers = await Sticker.find().sort({ usageCount: -1 }).limit(20);
  res.json(stickers);
});

/**
 * @swagger
 * /api/stickers/{id}/use:
 *   post:
 *     summary: Increment a sticker's usage count
 *     tags: [Stickers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: Usage recorded
 */
router.post("/stickers/:id/use", async (req, res) => {
  await Sticker.findByIdAndUpdate(req.params.id, { $inc: { usageCount: 1 } });
  res.sendStatus(204);
});

/**
 * @swagger
 * /api/packs/{packId}/tray:
 *   post:
 *     summary: Upload/replace a pack's tray icon (admin only)
 *     tags: [Packs]
 *     security:
 *       - AdminKey: []
 *     parameters:
 *       - in: path
 *         name: packId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: PNG, 96x96, <=50KB
 *     responses:
 *       200:
 *         description: Pack updated with new tray icon
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/StickerPack' }
 *       400:
 *         description: Invalid file (wrong type, too large, or missing)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       401:
 *         description: Missing or invalid x-admin-key header
 *       404:
 *         description: Pack not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post(
  "/packs/:packId/tray",
  upload.single("file"),
  async (req, res) => {
    try {
      const { packId } = req.params;
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });

      if (req.file.mimetype !== "image/png") {
        return res.status(400).json({ error: "Tray icon must be a PNG file" });
      }
      if (req.file.size > 50 * 1024) {
        return res.status(400).json({ error: "Tray icon must be <= 50KB" });
      }

      const { uploadBuffer } = require("../services/storageService");
      const storagePath = `${packId}/tray.png`;
      const url = await uploadBuffer(req.file.buffer, storagePath, "image/png");

      const pack = await StickerPack.findByIdAndUpdate(
        packId,
        { coverImageUrl: url },
        { new: true },
      );
      if (!pack) return res.status(404).json({ error: "Pack not found" });

      res.json(pack);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },
);
module.exports = router;
