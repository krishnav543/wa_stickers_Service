const mongoose = require('mongoose');

const userStickerUsageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  stickerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sticker', required: true },
  isFavorite: { type: Boolean, default: false },
  lastUsedAt: Date,
  useCount: { type: Number, default: 0 }
});

userStickerUsageSchema.index({ userId: 1, stickerId: 1 }, { unique: true });
userStickerUsageSchema.index({ userId: 1, lastUsedAt: -1 });
userStickerUsageSchema.index({ userId: 1, isFavorite: 1 });

module.exports = mongoose.model('UserStickerUsage', userStickerUsageSchema);