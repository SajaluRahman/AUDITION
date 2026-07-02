import { NextRequest, NextResponse } from 'next/server';
import { getResumableUploadUrl, isGoogleConfigured, uploadFileToAppsScript } from '@/lib/google-service';

export async function POST(req: NextRequest) {
  try {
    if (!isGoogleConfigured()) {
      return NextResponse.json(
        { success: false, error: 'Google Apps Script Web App URL is not configured on the server.' },
        { status: 500 }
      );
    }

    const contentType = req.headers.get('content-type') || '';

    // Action check for resumable upload initiation (typically for videos)
    if (contentType.includes('application/json')) {
      const body = await req.json();
      const { fileName, mimeType, folderName, action } = body;

      if (action === 'resumable') {
        if (!fileName || !mimeType || !folderName) {
          return NextResponse.json(
            { success: false, error: 'Missing parameters for initiating resumable upload' },
            { status: 400 }
          );
        }
        const origin = req.headers.get('origin') || undefined;
        const result = await getResumableUploadUrl(fileName, mimeType, folderName, origin);
        return NextResponse.json({ success: true, ...result });
      }
    }

    // Standard multipart form upload for smaller files (photos, resumes)
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const folderName = formData.get('folderName') as string | null; // e.g. "Photos" or "Resume"

    if (!file || !folderName) {
      return NextResponse.json(
        { success: false, error: 'Missing file or folderName parameter' },
        { status: 400 }
      );
    }

    // Convert file object to base64 to send to Google Apps Script Web App
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = `data:${file.type};base64,${buffer.toString('base64')}`;

    // Upload to Google Drive via Apps Script Web App Proxy
    const result = await uploadFileToAppsScript(base64Data, file.name, folderName);

    return NextResponse.json({
      success: true,
      fileId: result.fileId,
      fileName: result.fileName,
      url: result.url,
    });

  } catch (error: any) {
    console.error('Upload Route Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An error occurred during file upload.' },
      { status: 500 }
    );
  }
}
