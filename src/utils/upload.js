export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

/** Client-side guard. Cloudinary still enforces its own limits server-side. */
export function validateImageFile(file) {
  if (!file) return 'Choose an image to upload';
  if (!file.type.startsWith('image/')) return 'Only image files can be uploaded';
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return 'Use a JPG, PNG, WEBP, GIF or AVIF image';
  if (file.size > MAX_IMAGE_BYTES) return 'Image must be 5 MB or smaller';
  return null;
}

/**
 * Uploads a file straight to Cloudinary using a signature issued by our API.
 *
 * XMLHttpRequest rather than fetch, because only XHR reports upload progress.
 * The request goes directly to Cloudinary, so it must not carry our own
 * Authorization header - hence the raw XHR instead of the axios client.
 */
export function uploadToCloudinary(file, signed, onProgress) {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append('file', file);
    form.append('api_key', signed.apiKey);
    form.append('timestamp', signed.timestamp);
    form.append('signature', signed.signature);
    form.append('folder', signed.folder);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', signed.uploadUrl, true);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      let payload;
      try {
        payload = JSON.parse(xhr.responseText);
      } catch {
        reject(new Error('Cloudinary returned an unreadable response'));
        return;
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({ imageUrl: payload.secure_url, imagePublicId: payload.public_id });
      } else {
        reject(new Error(payload?.error?.message || `Upload failed (${xhr.status})`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error while uploading to Cloudinary'));
    xhr.onabort = () => reject(new Error('Upload cancelled'));

    xhr.send(form);
  });
}

/**
 * Builds a resized delivery URL from a Cloudinary image URL.
 * Falls back to the original for non-Cloudinary URLs (a pasted link).
 */
export function thumbUrl(url, width = 96) {
  if (!url || !url.includes('/image/upload/')) return url;
  return url.replace('/image/upload/', `/image/upload/c_fill,w_${width},h_${width},q_auto,f_auto/`);
}
