import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload image buffer to Cloudinary
 */
export const uploadImageToCloudinary = async (
  buffer: Buffer,
  fileName: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          resource_type: 'image',
          folder: 'craftworks/chat-images',
          public_id: `chat-${Date.now()}-${fileName}`,
          format: 'webp', // Convert to WebP for optimization
          quality: 'auto:good',
          fetch_format: 'auto',
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result!.secure_url);
          }
        }
      )
      .end(buffer);
  });
};

export default cloudinary;
