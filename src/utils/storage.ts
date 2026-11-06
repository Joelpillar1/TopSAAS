import { supabase } from './supabase';

/**
 * Upload an image file to Supabase Storage bucket 'screenshots'.
 * If the bucket exists and upload succeeds, returns the public CDN URL.
 * If storage is unconfigured or upload fails, returns null so the app
 * gracefully falls back to the compressed local data URL.
 */
export async function uploadScreenshotToStorage(
  fileOrBlob: File | Blob,
  filenamePrefix: string = 'shot'
): Promise<string | null> {
  try {
    const ext = fileOrBlob.type.includes('png')
      ? 'png'
      : fileOrBlob.type.includes('webp')
      ? 'webp'
      : 'jpg';

    const cleanPrefix = filenamePrefix.replace(/[^a-z0-9_-]/gi, '').slice(0, 32) || 'shot';
    const filePath = `${cleanPrefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

    const { data, error } = await supabase.storage
      .from('screenshots')
      .upload(filePath, fileOrBlob, {
        contentType: fileOrBlob.type || 'image/jpeg',
        cacheControl: '31536000', // 1-year browser & CDN cache
        upsert: false,
      });

    if (error || !data) {
      return null;
    }

    const { data: publicData } = supabase.storage.from('screenshots').getPublicUrl(filePath);
    return publicData?.publicUrl || null;
  } catch {
    return null;
  }
}
