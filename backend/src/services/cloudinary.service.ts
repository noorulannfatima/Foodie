import { v2 as cloudinary } from 'cloudinary';

/**
 * Cloudinary image hosting service.
 *
 * The app sends picked photos to our backend as base64 data URIs; this service
 * pushes them to Cloudinary and returns the public HTTPS URL, which is what we
 * store in Mongo (menu item images, restaurant banners, logos).
 *
 * Credentials never reach the client — only the backend knows the API secret.
 *
 * Docs: https://cloudinary.com/documentation/node_integration
 */

// ----- Types ---------------------------------------------------------------

export interface UploadedImage {
  url: string;
  publicId: string;
  width: number;
  height: number;
  bytes: number;
}

// ----- Config --------------------------------------------------------------

let configured = false;

function ensureConfigured(): void {
  if (configured) return;

  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error(
      'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in .env',
    );
  }

  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });
  configured = true;
}

/** Root folder all app uploads live under, e.g. "foodie/restaurant/<id>". */
const ROOT_FOLDER = process.env.CLOUDINARY_FOLDER || 'foodie';

// ----- Public API ----------------------------------------------------------

/**
 * Upload an image to Cloudinary.
 *
 * @param source    - A base64 data URI ("data:image/jpeg;base64,...") or a remote URL
 * @param subfolder - Path under the root folder, e.g. "restaurant/<id>/menu"
 */
export async function uploadImage(source: string, subfolder: string): Promise<UploadedImage> {
  ensureConfigured();

  const result = await cloudinary.uploader.upload(source, {
    folder: `${ROOT_FOLDER}/${subfolder}`,
    resource_type: 'image',
    // Cap stored size and let Cloudinary pick the best format/quality on delivery.
    transformation: [{ width: 1600, height: 1600, crop: 'limit' }],
  });

  return {
    url: optimizedUrl(result.public_id),
    publicId: result.public_id,
    width: result.width,
    height: result.height,
    bytes: result.bytes,
  };
}

/** Delete an image by its public id. Resolves even if the image is already gone. */
export async function deleteImage(publicId: string): Promise<void> {
  ensureConfigured();
  await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
}

/** Delivery URL with automatic format (WebP/AVIF) and quality. */
function optimizedUrl(publicId: string): string {
  return cloudinary.url(publicId, {
    secure: true,
    fetch_format: 'auto',
    quality: 'auto',
  });
}
