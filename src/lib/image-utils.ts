
/**
 * Image utility functions for client-side processing.
 */

/**
 * Compresses an image file and converts it to WebP using HTML5 Canvas.
 * 
 * @param file The original image File object.
 * @param maxWidth The maximum width or height of the compressed image.
 * @param quality Compression quality from 0 to 1 (0.75 is a good balance).
 * @returns A promise that resolves to a compressed WebP Blob.
 */
export async function compressImage(
  file: File, 
  maxWidth = 1200, 
  quality = 0.75
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = document.createElement('img');
      
      // Crucial: Set onload before setting src to handle cached images and race conditions
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxWidth) {
            width *= maxWidth / height;
            height = maxWidth;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Canvas to Blob conversion failed'));
            }
          },
          'image/webp',
          quality
        );
      };

      img.onerror = (err) => reject(new Error('Failed to load image for compression'));
      
      // Ensure we treat the source correctly
      const result = event.target?.result;
      if (typeof result === 'string') {
        img.src = result;
      } else {
        reject(new Error('Failed to read file as Data URL'));
      }
    };
    reader.onerror = (err) => reject(new Error('FileReader error'));
  });
}
