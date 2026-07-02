/**
 * Audition Portal - Google Apps Script
 * Deploy this script as a Web App to handle file uploads to Google Drive 
 * and row insertion into Google Sheets.
 */

// Set this to your desired spreadsheet ID, or it will use the spreadsheet to which the script is bound.
var SPREADSHEET_ID = "1y2o323lN3uojLWjD4lp8zp5kI_e2pZAIHLNTI0Q6AFY"; 

// Set this to your desired parent Google Drive folder ID, or it will create a new folder "Auditions".
var PARENT_FOLDER_ID = "17kCW90o-xeO6ft3KNqZkRjc4NzQT9gYE";

// Base Folder under which files will be organized
var PARENT_FOLDER_NAME = "Auditions";
var SUB_FOLDERS = ["Photos", "Portfolio", "Resume", "Videos"];

/**
 * Handles incoming POST requests (creates uploads, saves submissions)
 * Implements CORS headers for Next.js API/client integration.
 */
function doPost(e) {
  // Handle CORS preflight
  if (e.parameter && e.parameter.method === 'OPTIONS') {
    return ContentService.createTextOutput(JSON.stringify({ status: 'CORS OK' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  try {
    var data;
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else {
      data = e.parameter;
    }

    var action = data.action;
    var responseData;

    if (action === 'uploadFile') {
      responseData = uploadFile(data.fileData, data.fileName, data.folderName);
    } else if (action === 'getResumableUrl') {
      responseData = getResumableUrl(data.fileName, data.mimeType, data.folderName, data.origin);
    } else if (action === 'saveSubmission') {
      responseData = saveSubmission(data.submission);
    } else if (action === 'getStatus') {
      responseData = getStatus(data.submissionId);
    } else if (action === 'updateStatus') {
      responseData = updateStatus(data.submissionId, data.status);
    } else if (action === 'readSheet') {
      responseData = readSheet();
    } else {
      throw new Error('Invalid action: ' + action);
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      data: responseData
    }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handles incoming GET requests (for status checks and reading sheets)
 */
function doGet(e) {
  try {
    var action = e.parameter.action;
    var responseData;

    if (action === 'getStatus') {
      responseData = getStatus(e.parameter.submissionId);
    } else if (action === 'readSheet') {
      responseData = readSheet();
    } else {
      throw new Error('Invalid or missing action in GET request');
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      data: responseData
    }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Helper to get the target Google Sheet instance.
 */
function getTargetSheet() {
  if (SPREADSHEET_ID) {
    return SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
  }
  return SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
}

/**
 * Creates folders structure under "Auditions" if they do not exist
 */
function createFoldersIfNotExists() {
  var parentFolder;
  if (PARENT_FOLDER_ID) {
    parentFolder = DriveApp.getFolderById(PARENT_FOLDER_ID);
  } else {
    var folders = DriveApp.getFoldersByName(PARENT_FOLDER_NAME);
    if (folders.hasNext()) {
      parentFolder = folders.next();
    } else {
      parentFolder = DriveApp.createFolder(PARENT_FOLDER_NAME);
      // Make the parent folder open so files are publically readable via links
      parentFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    }
  }

  var folderMap = {};
  for (var i = 0; i < SUB_FOLDERS.length; i++) {
    var subName = SUB_FOLDERS[i];
    var subFolders = parentFolder.getFoldersByName(subName);
    var subFolder;
    if (subFolders.hasNext()) {
      subFolder = subFolders.next();
    } else {
      subFolder = parentFolder.createFolder(subName);
      subFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    }
    folderMap[subName] = subFolder.getId();
  }

  return {
    parentFolderId: parentFolder.getId(),
    subFolders: folderMap
  };
}

/**
 * Uploads a base64 encoded file directly to a subfolder under Auditions
 * @param {string} base64Data Data URL e.g. "data:image/png;base64,iVBOR..."
 * @param {string} fileName Name of the file with extension
 * @param {string} folderName Name of the subfolder e.g., "Photos", "Resume", "Videos"
 */
function uploadFile(base64Data, fileName, folderName) {
  var folderConfig = createFoldersIfNotExists();
  var folderId = folderConfig.subFolders[folderName];
  if (!folderId) {
    throw new Error("Folder category not found: " + folderName);
  }
  
  var folder = DriveApp.getFolderById(folderId);
  
  // Extract content type and base64 string
  var matches = base64Data.match(/^data:(.+);base64,(.+)$/);
  var contentType = matches ? matches[1] : 'application/octet-stream';
  var rawBase64 = matches ? matches[2] : base64Data;
  
  var decoded = Utilities.base64Decode(rawBase64);
  var blob = Utilities.newBlob(decoded, contentType, fileName);
  
  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  
  return {
    fileId: file.getId(),
    fileName: file.getName(),
    url: getDriveLink(file.getId()),
    downloadUrl: file.getDownloadUrl()
  };
}

/**
 * Generates an alternative public sharing view link for Google Drive files
 */
function getDriveLink(fileId) {
  return "https://drive.google.com/uc?export=view&id=" + fileId;
}

/**
 * Generates a unique submission ID with date and random characters
 */
function generateUniqueID() {
  var dateStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || "GMT", "yyyyMMdd");
  var rand = Math.floor(1000 + Math.random() * 9000); // 4 digit random number
  return "AUD-" + dateStr + "-" + rand;
}

/**
 * Saves submission row to Google Sheets
 */
function saveSubmission(submission) {
  var sheet = getTargetSheet();
  var submissionId = generateUniqueID();
  var timestamp = new Date();
  
  // Columns:
  // 1. Timestamp, 2. Submission ID, 3. First Name, 4. Last Name, 5. Age, 6. Gender, 7. DOB, 8. Phone, 9. WhatsApp, 10. Email,
  // 11. Address, 12. City, 13. State, 14. Country, 15. Height, 16. Weight, 17. Instagram, 18. Facebook, 19. YouTube, 20. Occupation,
  // 21. Experience, 22. Languages, 23. Talent, 24. Bio, 25. Reason, 26. Profile Photo URL, 27. Portfolio URL, 28. Resume URL, 29. Video URL, 30. Status
  
  var row = [
    timestamp,
    submissionId,
    submission.firstName || "",
    submission.lastName || "",
    submission.age || "",
    submission.gender || "",
    submission.dob || "",
    submission.phone || "",
    submission.whatsApp || "",
    submission.email || "",
    submission.address || "",
    submission.city || "",
    submission.state || "",
    submission.country || "",
    submission.height || "",
    submission.weight || "",
    submission.instagram || "",
    submission.facebook || "",
    submission.youtube || "",
    submission.occupation || "",
    submission.experience || "",
    submission.languages || "",
    submission.talentCategory || "",
    submission.bio || "",
    submission.reason || "",
    submission.profilePhotoUrl || "",
    submission.portfolioUrls || "", // Comma-separated or JSON array string
    submission.resumeUrl || "",
    submission.videoUrl || "",
    "Pending" // Default Status
  ];
  
  sheet.appendRow(row);
  
  return {
    submissionId: submissionId,
    referenceNumber: "REF-" + Math.floor(100000 + Math.random() * 900000),
    timestamp: timestamp.toISOString()
  };
}

/**
 * Reads all rows from Google Sheets (excluding header)
 */
function readSheet() {
  var sheet = getTargetSheet();
  var range = sheet.getDataRange();
  var values = range.getValues();
  if (values.length <= 1) {
    return [];
  }
  
  var headers = values[0];
  var rows = [];
  
  for (var i = 1; i < values.length; i++) {
    var row = {};
    for (var j = 0; j < headers.length; j++) {
      var cellVal = values[i][j];
      // Format timestamps for JSON response
      if (cellVal instanceof Date) {
        cellVal = cellVal.toISOString();
      }
      row[headers[j]] = cellVal;
    }
    rows.push(row);
  }
  return rows;
}

/**
 * Gets submission status by Submission ID
 */
function getStatus(submissionId) {
  var rows = readSheet();
  for (var i = 0; i < rows.length; i++) {
    if (rows[i]["Submission ID"] === submissionId) {
      return rows[i];
    }
  }
  return null;
}

/**
 * Updates submission status by Submission ID (Shortlist, Reject, etc.)
 */
function updateStatus(submissionId, status) {
  var sheet = getTargetSheet();
  var range = sheet.getDataRange();
  var values = range.getValues();
  
  for (var i = 1; i < values.length; i++) {
    if (values[i][1] === submissionId) { // column index 1 is Submission ID (Column B)
      sheet.getRange(i + 1, 30).setValue(status); // Column 30 is Status (Column AD)
      return {
        submissionId: submissionId,
        status: status,
        updated: true
      };
    }
  }
  throw new Error("Submission ID not found: " + submissionId);
}

/**
 * Initiates a Google Drive resumable upload session on behalf of the Web App owner
 * and returns the Location URL header so the browser client can upload files directly.
 */
function getResumableUrl(fileName, mimeType, folderName, origin) {
  var folderConfig = createFoldersIfNotExists();
  var folderId = folderConfig.subFolders[folderName];
  if (!folderId) {
    throw new Error("Folder category not found: " + folderName);
  }
  
  var url = "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable";
  var metadata = {
    name: fileName,
    parents: [folderId]
  };
  
  var headers = {
    Authorization: "Bearer " + ScriptApp.getOAuthToken()
  };
  
  // Set Origin if present to authorize client CORS requests on Google's upload servers
  if (origin) {
    headers["Origin"] = origin;
  }
  
  var options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(metadata),
    headers: headers,
    muteHttpExceptions: true,
    followRedirects: false
  };
  
  var response = UrlFetchApp.fetch(url, options);
  var responseCode = response.getResponseCode();
  
  if (responseCode !== 200 && responseCode !== 201) {
    throw new Error("Failed to initiate Drive upload: " + response.getContentText());
  }
  
  var headers = response.getHeaders();
  var uploadUrl = headers["Location"] || headers["location"];
  if (!uploadUrl) {
    throw new Error("Location header containing upload URL not returned by Google API.");
  }
  
  return { uploadUrl: uploadUrl };
}
