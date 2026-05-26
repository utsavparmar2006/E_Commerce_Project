/**
 * Helper to compress and resize an image file on the client side using HTML5 Canvas.
 * @param {File} file - The original image File.
 * @param {number} maxWidth - Maximum allowed width.
 * @param {number} maxHeight - Maximum allowed height.
 * @param {number} quality - JPEG compression quality (0.0 to 1.0).
 * @returns {Promise<Blob|File>} A promise resolving to the compressed File/Blob (or original File if compression fails).
 */
function compressImage(file, maxWidth = 1024, maxHeight = 1024, quality = 0.8) {
  return new Promise((resolve) => {
    // Only compress image files and skip animated GIFs
    if (!file || !file.type || !file.type.startsWith('image/') || file.type === 'image/gif') {
      resolve(file);
      return;
    }

    if (typeof window === 'undefined' || typeof document === 'undefined') {
      resolve(file);
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          try {
            let width = img.width;
            let height = img.height;

            // Calculate new dimensions keeping aspect ratio
            if (width > maxWidth || height > maxHeight) {
              if (width > height) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
              } else {
                width = Math.round((width * maxHeight) / height);
                height = maxHeight;
              }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
              resolve(file);
              return;
            }

            // Draw image on canvas
            ctx.drawImage(img, 0, 0, width, height);

            // Export to blob
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  try {
                    // Create a new File from the blob
                    const fileName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
                    const compressedFile = new File([blob], `${fileName}.jpg`, {
                      type: 'image/jpeg',
                      lastModified: Date.now(),
                    });

                    // Only return compressed file if it is actually smaller
                    if (compressedFile.size < file.size) {
                      resolve(compressedFile);
                    } else {
                      resolve(file);
                    }
                  } catch (e) {
                    // Fallback if File constructor fails (e.g. some environment restrictions)
                    resolve(blob.size < file.size ? blob : file);
                  }
                } else {
                  resolve(file);
                }
              },
              'image/jpeg',
              quality
            );
          } catch (e) {
            resolve(file);
          }
        };
        img.onerror = () => resolve(file);
        img.src = event.target.result;
      };
      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    } catch (e) {
      resolve(file);
    }
  });
}

/**
 * Uploads a file to Cloudinary using direct unsigned upload.
 * @param {File} file - The file object to upload.
 * @returns {Promise<string>} The secure URL of the uploaded image.
 */
export async function uploadToCloudinary(file) {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName) {
    throw new Error('Cloudinary Cloud Name is not configured in the frontend environment.');
  }
  if (!uploadPreset) {
    throw new Error(
      'Cloudinary Upload Preset is not configured. Please add VITE_CLOUDINARY_UPLOAD_PRESET in your frontend/.env file.'
    );
  }

  // Compress image on the client side before uploading to Cloudinary
  let fileToUpload = file;
  try {
    fileToUpload = await compressImage(file);
  } catch (err) {
    console.warn('Image compression failed, uploading original file:', err);
  }

  const formData = new FormData();
  formData.append('file', fileToUpload);
  formData.append('upload_preset', uploadPreset);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'Failed to upload image to Cloudinary');
  }

  const data = await response.json();
  return data.secure_url;
}
