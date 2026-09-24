import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { uploadImage } from '../services/cloudinary.service';

/** Max decoded image size we accept (5 MB). */
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const DATA_URI_PATTERN = /^data:image\/(jpeg|jpg|png|webp|heic|heif|gif);base64,/i;

/** Which kind of image this is — decides the Cloudinary subfolder. */
const PURPOSES = ['menu', 'restaurant', 'logo', 'profile', 'review'] as const;
type Purpose = (typeof PURPOSES)[number];

/**
 * POST /upload/image
 * Body: { image: "data:image/jpeg;base64,...", purpose?: "menu" | "restaurant" | "logo" | "profile" | "review" }
 * Returns: { url, publicId, width, height }
 */
export const uploadImageHandler = async (req: AuthRequest, res: Response) => {
  try {
    const { image, purpose = 'menu' } = req.body ?? {};

    if (typeof image !== 'string' || !DATA_URI_PATTERN.test(image)) {
      return res.status(400).json({ message: 'image must be a base64 image data URI' });
    }

    if (!PURPOSES.includes(purpose as Purpose)) {
      return res.status(400).json({ message: `purpose must be one of: ${PURPOSES.join(', ')}` });
    }

    // base64 encodes 3 bytes into 4 chars
    const base64Length = image.length - image.indexOf(',') - 1;
    if ((base64Length * 3) / 4 > MAX_IMAGE_BYTES) {
      return res.status(413).json({ message: 'Image is too large (max 5 MB)' });
    }

    const { role, id } = req.user!;
    const uploaded = await uploadImage(image, `${role}/${id}/${purpose}`);

    res.status(201).json({
      url: uploaded.url,
      publicId: uploaded.publicId,
      width: uploaded.width,
      height: uploaded.height,
    });
  } catch (error: any) {
    console.error('Image upload error:', error);
    res.status(500).json({ message: error.message || 'Failed to upload image' });
  }
};
