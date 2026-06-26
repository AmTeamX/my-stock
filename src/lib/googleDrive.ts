import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';
import { Readable } from 'stream';

function getDriveAuth() {
  const privateKey = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  const auth = new GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  });
  return auth;
}

/**
 * Upload an image to Google Drive and return a publicly accessible URL
 * @param base64Image - Base64 encoded image (with or without data URI prefix)
 * @param fileName - File name for the uploaded image
 * @returns The shareable image URL
 */
export async function uploadImageToDrive(
  base64Image: string,
  fileName: string
): Promise<string> {
  const auth = getDriveAuth();
  const drive = google.drive({ version: 'v3', auth });

  // Strip data URI prefix if present (e.g., "data:image/png;base64,...")
  let base64Data = base64Image;
  let mimeType = 'image/png';

  if (base64Image.startsWith('data:')) {
    const matches = base64Image.match(/^data:([^;]+);base64,(.+)$/);
    if (matches) {
      mimeType = matches[1];
      base64Data = matches[2];
    }
  }

  // Convert base64 to buffer
  const buffer = Buffer.from(base64Data, 'base64');
  const stream = Readable.from(buffer);

  // Upload to Google Drive
  const response = await drive.files.create({
    requestBody: {
      name: fileName,
      mimeType: mimeType,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID || 'root'],
    },
    media: {
      mimeType: mimeType,
      body: stream,
    },
  });

  const fileId = response.data.id;
  if (!fileId) {
    throw new Error('Failed to upload image to Google Drive');
  }

  // Make the file publicly accessible (anyone with link can view)
  await drive.permissions.create({
    fileId: fileId,
    requestBody: {
      role: 'reader',
      type: 'anyone',
    },
  });

  // Return the direct image URL
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
}

/**
 * Delete an image from Google Drive by URL
 * @param imageUrl - The Google Drive image URL
 */
export async function deleteImageFromDrive(imageUrl: string): Promise<void> {
  const auth = getDriveAuth();
  const drive = google.drive({ version: 'v3', auth });

  // Extract file ID from URL
  const match = imageUrl.match(/id=([^&]+)/);
  if (!match) return;

  const fileId = match[1];
  try {
    await drive.files.delete({ fileId });
  } catch (error) {
    console.error('Failed to delete image:', error);
  }
}
