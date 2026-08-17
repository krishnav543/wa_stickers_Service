// services/storageService.js
const { createClient } = require('@supabase/supabase-js');

// Service role key bypasses Row Level Security — safe here because ALL
// storage access goes through this backend; the Flutter app never talks
// to Supabase Storage directly and never sees this key.
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'sticker-packs';

async function uploadBuffer(buffer, relativePath, contentType) {
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(relativePath, buffer, {
      contentType,
      cacheControl: '31536000',
      upsert: true, // overwrite if the same path is uploaded again
    });

  if (error) throw new Error(`Supabase upload failed: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(relativePath);
  return data.publicUrl;
}

async function deleteFile(relativePath) {
  const { error } = await supabase.storage.from(BUCKET).remove([relativePath]);
  if (error) throw new Error(`Supabase delete failed: ${error.message}`);
}

module.exports = { uploadBuffer, deleteFile };