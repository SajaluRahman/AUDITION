import { NextRequest, NextResponse } from 'next/server';
import { readGoogleSheet, updateApplicantStatus, isGoogleConfigured } from '@/lib/google-service';

export async function GET(req: NextRequest) {
  try {
    if (!isGoogleConfigured()) {
      return NextResponse.json(
        { success: false, error: 'Google credentials not configured on server.' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const submissionId = searchParams.get('id');

    const applicants = await readGoogleSheet();

    // If ID is provided, find and return that specific applicant's status
    if (submissionId) {
      const applicant = applicants.find(app => app['Submission ID'] === submissionId);
      
      if (!applicant) {
        return NextResponse.json(
          { success: false, error: 'Application not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          submissionId: applicant['Submission ID'],
          firstName: applicant['First Name'],
          lastName: applicant['Last Name'],
          email: applicant['Email'],
          status: applicant['Status'] || 'Pending',
          timestamp: applicant['Timestamp'],
        }
      });
    }

    // Otherwise, return all applicants (for admin panel)
    // In a real-world scenario, you would add authentication middleware here
    return NextResponse.json({
      success: true,
      data: applicants
    });

  } catch (error: any) {
    console.error('Status GET Route Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Server error retrieving status data' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!isGoogleConfigured()) {
      return NextResponse.json(
        { success: false, error: 'Google credentials not configured on server.' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { submissionId, status } = body; // status can be "Shortlisted", "Rejected", "Pending"

    if (!submissionId || !status) {
      return NextResponse.json(
        { success: false, error: 'Missing submissionId or status parameters.' },
        { status: 400 }
      );
    }

    if (!['Pending', 'Shortlisted', 'Rejected'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status value. Must be Pending, Shortlisted, or Rejected.' },
        { status: 400 }
      );
    }

    const result = await updateApplicantStatus(submissionId, status);

    return NextResponse.json({
      success: true,
      message: `Applicant status updated to ${status} successfully.`,
      ...result
    });

  } catch (error: any) {
    console.error('Status POST Route Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Server error updating applicant status' },
      { status: 500 }
    );
  }
}
