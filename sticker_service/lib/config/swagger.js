// config/swagger.js
const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Sticker Service API",
      version: "1.0.0",
      description:
        "MongoDB + local-storage backed API for sticker packs and stickers (no auth yet)",
    },
    servers: [
      {
        url: process.env.PUBLIC_BASE_URL || "http://localhost:3000",
        description: "Local server",
      },
    ],
    components: {
      securitySchemes: {
        AdminKey: { type: "apiKey", in: "header", name: "x-admin-key" },
      },
      schemas: {
        StickerPack: {
          type: "object",
          properties: {
            _id: { type: "string" },
            name: { type: "string" },
            slug: { type: "string" },
            description: { type: "string" },
            category: { type: "string" },
            stickerCount: { type: "number" },
            isPublic: { type: "boolean" },
            downloadCount: { type: "number" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Sticker: {
          type: "object",
          properties: {
            _id: { type: "string" },
            packId: { type: "string" },
            name: { type: "string" },
            url: { type: "string" },
            storagePath: { type: "string" },
            format: { type: "string", enum: ["webp"] },
            width: { type: "number" },
            height: { type: "number" },
            sizeBytes: { type: "number" },
            tags: { type: "array", items: { type: "string" } },
            usageCount: { type: "number" },
          },
        },
        Error: {
          type: "object",
          properties: { error: { type: "string" } },
        },
      },
    },
  },
  // Files containing the JSDoc @swagger comments
  apis: ["./lib/routes/*.js"],
};

module.exports = swaggerJsdoc(options);
