import { NextRequest, NextResponse } from 'next/server';
import { saveSheetSubmission, isGoogleConfigured } from '@/lib/google-service';
import { auditionSchema } from '@/lib/validation-schema';

export async function POST(req: NextRequest) {
  try {
    if (!isGoogleConfigured()) {
      return NextResponse.json(
        { success: false, error: 'Google Service Account credentials not configured in server environment.' },
        { status: 500 }
      );
    }

    const body = await req.json();

    // Perform Zod schema validation
    const validation = auditionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed', 
          details: validation.error.format() 
        },
        { status: 400 }
      );
    }

    const validatedData = validation.data;

    // Save to Google Sheets
    const result = await saveSheetSubmission(validatedData);

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully',
      submissionId: result.submissionId,
      referenceNumber: result.referenceNumber,
      timestamp: result.timestamp,
    });

  } catch (error: any) {
    console.error('Submit Route Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An error occurred during submission.' },
      { status: 500 }
    );
  }
}
