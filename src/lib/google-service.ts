/**
 * Google Service Helper (Apps Script Proxy Mode)
 * Proxies Google Sheets and Google Drive upload operations directly to 
 * the deployed Google Apps Script Web App.
 */

const appsScriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL;

/**
 * Checks if the Google Apps Script Web App URL is configured
 */
export function isGoogleConfigured(): boolean {
  return !!appsScriptUrl;
}

/**
 * Internal helper to send a POST request to the Google Apps Script Web App API
 */
async function callAppsScript(action: string, payload: any) {
  if (!isGoogleConfigured()) {
    throw new Error("GOOGLE_APPS_SCRIPT_URL is not configured in the server environment variables.");
  }

  try {
    const response = await fetch(appsScriptUrl!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action,
        ...payload
      }),
      redirect: 'follow', // Automatically follow redirect
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Apps Script responded with status ${response.status}: ${errText}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const htmlText = await response.text();
      console.error("Non-JSON HTML response received from Google Apps Script Web App:", htmlText);
      const titleMatch = htmlText.match(/<title>(.*?)<\/title>/i);
      const title = titleMatch ? titleMatch[1] : "HTML Error Page";
      throw new Error(`Google Apps Script returned an HTML page ("${title}"). This usually indicates an authorization prompt, incorrect deployment parameters, or a runtime script crash. Please check your Next.js server console for details.`);
    }

    const json = await response.json();
    if (!json.success) {
      throw new Error(json.error || "An unknown error occurred inside Google Apps Script Web App.");
    }

    return json.data;
  } catch (error: any) {
    console.error(`Apps Script communication failure for action "${action}":`, error);
    throw error;
  }
}

/**
 * Proxies base64 file upload directly to Google Drive via Apps Script Web App
 */
export async function uploadFileToAppsScript(base64Data: string, fileName: string, folderName: string) {
  return callAppsScript('uploadFile', { fileData: base64Data, fileName, folderName });
}

export async function getResumableUploadUrl(fileName: string, mimeType: string, folderName: string, origin?: string) {
  return callAppsScript('getResumableUrl', { fileName, mimeType, folderName, origin });
}

/**
 * Appends a new submission row into Google Sheets
 */
export async function saveSheetSubmission(submission: any) {
  return callAppsScript('saveSubmission', { submission });
}

/**
 * Reads all rows from Google Sheets, mapping them to JS Objects using the headers in Row 1
 */
export async function readGoogleSheet(): Promise<Record<string, any>[]> {
  return callAppsScript('readSheet', {});
}

/**
 * Updates status of an applicant in Google Sheet by finding matching Submission ID
 */
export async function updateApplicantStatus(submissionId: string, status: 'Pending' | 'Shortlisted' | 'Rejected') {
  return callAppsScript('updateStatus', { submissionId, status });
}
