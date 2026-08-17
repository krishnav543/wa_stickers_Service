const mongoose = require('mongoose');

const stickerSchema = new mongoose.Schema({
  packId: { type: mongoose.Schema.Types.ObjectId, ref: 'StickerPack', index: true },
  name: { type: String, required: true },
  url: { type: String, required: true },
  thumbnailUrl: String,
  format: { type: String, enum: ['webp', 'png', 'gif'], default: 'webp' },
  width: Number,
  height: Number,
  sizeBytes: Number,
  tags: { type: [String], index: true },
  usageCount: { type: Number, default: 0 }
}, { timestamps: true });

stickerSchema.index({ name: 'text', tags: 'text' });
stickerSchema.index({ usageCount: -1 });

module.exports = mongoose.model('Sticker', stickerSchema);