/**
 * Image processing utilities for profile photo upload.
 * Resizes and compresses image on the client side into a lightweight Data URL (JPEG).
 */

export const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';

export const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
];

/**
 * Validates and compresses an image file to a Base64 data URL.
 * @param {File} file - Selected image file
 * @param {number} maxDimension - Max width/height in px (default 320px for avatars)
 * @param {number} quality - JPEG compression quality 0-1 (default 0.82)
 * @returns {Promise<{ dataUrl: string | null, error: string | null }>}
 */
export const processImageFile = (file, maxDimension = 320, quality = 0.82) => {
  return new Promise((resolve) => {
    if (!file) {
      return resolve({ dataUrl: null, error: 'No file selected.' });
    }

    // Validate mime type
    if (!file.type.startsWith('image/')) {
      return resolve({ dataUrl: null, error: 'Please select a valid image file (PNG, JPG, JPEG, WEBP).' });
    }

    // Limit raw upload size to 10MB
    const MAX_BYTES = 10 * 1024 * 1024;
    if (file.size > MAX_BYTES) {
      return resolve({ dataUrl: null, error: 'Image is too large. Please select a photo under 10MB.' });
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let { width, height } = img;

          // Calculate aspect ratio preservation
          if (width > height) {
            if (width > maxDimension) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            }
          } else {
            if (height > maxDimension) {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return resolve({ dataUrl: e.target.result, error: null });
          }

          // Smooth rendering
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Output compressed JPEG
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve({ dataUrl: compressedDataUrl, error: null });
        } catch (err) {
          console.warn('Canvas compression failed, falling back to raw data URL:', err);
          resolve({ dataUrl: e.target.result, error: null });
        }
      };

      img.onerror = () => {
        resolve({ dataUrl: null, error: 'Failed to read the image file. Please try another photo.' });
      };

      img.src = e.target.result;
    };

    reader.onerror = () => {
      resolve({ dataUrl: null, error: 'Failed to read file from your device.' });
    };

    reader.readAsDataURL(file);
  });
};
