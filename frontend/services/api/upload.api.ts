import * as ImagePicker from 'expo-image-picker';
import { apiClient } from './client';

export type UploadPurpose = 'menu' | 'restaurant' | 'logo' | 'profile' | 'review';

export interface UploadedImage {
  url: string;
  publicId: string;
  width: number;
  height: number;
}

export const uploadAPI = {
  /** Upload a base64 image data URI to Cloudinary (via our backend). */
  uploadImage: async (dataUri: string, purpose: UploadPurpose): Promise<UploadedImage> => {
    const { data } = await apiClient.post<UploadedImage>(
      '/upload/image',
      { image: dataUri, purpose },
      { timeout: 60000 },
    );
    return data;
  },
};

/**
 * Open the photo library and upload the picked image to Cloudinary.
 * Returns the hosted image URL, or null if permission was denied / the user cancelled.
 */
export async function pickAndUploadImage(
  purpose: UploadPurpose,
  aspect: [number, number],
): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Please allow access to your photo library');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect,
    quality: 0.7,
    base64: true,
  });

  if (result.canceled || !result.assets[0]) return null;

  const asset = result.assets[0];
  if (!asset.base64) throw new Error('Could not read the selected image');

  const mimeType = asset.mimeType ?? 'image/jpeg';
  const { url } = await uploadAPI.uploadImage(`data:${mimeType};base64,${asset.base64}`, purpose);
  return url;
}
