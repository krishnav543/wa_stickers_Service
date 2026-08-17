// services/stickerService.js
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const Sticker = require('../models/Sticker');
const StickerPack = require('../models/StickerPack');
const { uploadBuffer, deleteFile } = require('./StorageService');

async function addStickerToPack({ fileBuffer, packId, tags = [] }) {
  const id = uuidv4();
  const storagePath = `${packId}/${id}.webp`;

  // Re-encode instead of storing the upload as-is. This isn't about
  // format conversion (input and output are both .webp) — it's a
  // workaround for a real bug in a third-party Dart package (`image`,
  // used internally by the WhatsApp sticker plugin) that crashes
  // decoding WebP files whose alpha channel uses more Huffman
  // meta-groups than its decoder supports (a hardcoded 0..31 bound).
  // That's libwebp's DEFAULT alpha-compression behavior, so most WebP
  // files with transparency can trigger it depending on how complex
  // the alpha channel's encoding turned out.
  //
  // effort:0 uses libwebp's simplest/fastest encoding pass, which
  // produces much simpler (fewer-group) Huffman tables for the alpha
  // channel — the most reliable lever available here to stay under
  // that decoder's cap, since sharp/libvips doesn't expose libwebp's
  // alpha_method toggle directly.
  const webp = await sharp(fileBuffer)
    .webp({
      quality: 90,
      alphaQuality: 100,
      lossless: false,
      effort: 0,
    })
    .toBuffer();

  const meta = await sharp(webp).metadata();

  const url = await uploadBuffer(webp, storagePath, 'image/webp');

  const sticker = await Sticker.create({
    packId,
    name: id,
    url,
    storagePath,
    format: 'webp',
    width: meta.width,
    height: meta.height,
    sizeBytes: webp.length,
    tags
  });

  await StickerPack.findByIdAndUpdate(packId, { $inc: { stickerCount: 1 } });
  return sticker;
}

async function removeSticker(stickerId) {
  const sticker = await Sticker.findById(stickerId);
  if (!sticker) return null;

  await deleteFile(sticker.storagePath);
  await Sticker.findByIdAndDelete(stickerId);
  await StickerPack.findByIdAndUpdate(sticker.packId, { $inc: { stickerCount: -1 } });
  return sticker;
}

module.exports = { addStickerToPack, removeSticker };