/**
 * Google Apps Script Backend for Evaluation Management System
 * 
 * Setup Instructions:
 * 1. Create a Google Sheet with tabs: users, GV, NV, DataGV, DataNV, Config, AuditLog
 * 2. Replace SPREADSHEET_ID with your Sheet ID
 * 3. Deploy as Web App (Execute as: Me, Access: Anyone)
 */

const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE'; // Replace this
const JWT_SECRET = 'YOUR_SUPER_SECRET_KEY_CHANGE_THIS';

function doPost(e) {
  try {
    // Handle CORS preflight
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({ success: false, error: "No payload" });
    }

    const request = JSON.parse(e.postData.contents);
    const action = request.action;
    const payload = request.payload || {};
    const token = request.token;

    let user = null;
    
    // Auth check for protected routes
    const publicActions = ['login', 'getDashboardData', 'getConfig'];
    if (!publicActions.includes(action)) {
      user = verifyJWT(token);
      if (!user) {
        return createJsonResponse({ success: false, error: "Unauthorized" });
      }
    }

    let result;
    switch (action) {
      case 'login':
        result = handleLogin(payload.username, payload.password);
        break;
      case 'getDashboardData':
        result = handleGetDashboardData();
        break;
      case 'getConfig':
        result = handleGetConfig();
        break;
      case 'getEvaluationTemplate':
        result = handleGetTemplate(payload.type);
        break;
      case 'submitEvaluation':
        result = handleSubmitEvaluation(user, payload);
        break;
      case 'getUsers':
        if (user.role !== 'Admin') throw new Error("Forbidden");
        result = handleGetUsers();
        break;
      default:
        throw new Error("Unknown action: " + action);
    }

    return createJsonResponse({ success: true, data: result });

  } catch (error) {
    logAudit('SYSTEM', 'ERROR', error.toString());
    return createJsonResponse({ success: false, error: error.toString() });
  }
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// --- Handlers ---

function handleLogin(username, password) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('users');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[1] === username && row[2] === password) { // Plain text as requested
      const user = {
        id: row[0],
        username: row[1],
        role: row[3],
        name: row[4],
        teamId: row[5]
      };
      
      const token = createJWT(user);
      logAudit(user.id, 'LOGIN', 'User logged in');
      
      return { token, user };
    }
  }
  throw new Error("Invalid credentials");
}

function handleGetDashboardData() {
  // Mock implementation for dashboard
  return {
    totalMembers: 120,
    completionRate: 85,
    teamAverages: [
      { team: "Math", average: 92 },
      { team: "Science", average: 88 },
      { team: "Literature", average: 90 }
    ]
  };
}

function handleGetConfig() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Config');
  if (!sheet) return {};
  const data = sheet.getDataRange().getValues();
  const config = {};
  for (let i = 1; i < data.length; i++) {
    config[data[i][0]] = data[i][1];
  }
  return config;
}

function handleGetTemplate(type) {
  const sheetName = type === 'GV' ? 'GV' : 'NV';
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(sheetName);
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  const template = [];
  for (let i = 1; i < data.length; i++) {
    template.push({
      id: data[i][0],
      section: data[i][1],
      criteria: data[i][2],
      description: data[i][3],
      maxScore: data[i][4]
    });
  }
  return template;
}

function handleSubmitEvaluation(user, payload) {
  // Implementation for saving evaluation
  logAudit(user.id, 'SUBMIT_EVAL', `Submitted for ${payload.year} Q${payload.quarter}`);
  return { message: "Saved successfully" };
}

function handleGetUsers() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('users');
  const data = sheet.getDataRange().getValues();
  const users = [];
  for (let i = 1; i < data.length; i++) {
    users.push({
      id: data[i][0],
      username: data[i][1],
      role: data[i][3],
      name: data[i][4],
      teamId: data[i][5]
    });
  }
  return users;
}

// --- Utilities ---

function logAudit(userId, action, details) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('AuditLog');
    if (sheet) {
      sheet.appendRow([Utilities.getUuid(), new Date(), userId, action, details]);
    }
  } catch(e) {
    // Ignore logging errors
  }
}

// --- Simple JWT Implementation for GAS ---

function createJWT(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  payload.exp = Math.floor(Date.now() / 1000) + (60 * 60 * 8); // 8 hours expiration
  
  const encodedHeader = base64EncodeUrl(JSON.stringify(header));
  const encodedPayload = base64EncodeUrl(JSON.stringify(payload));
  
  const signatureInput = encodedHeader + '.' + encodedPayload;
  const signature = computeHmacSha256(signatureInput, JWT_SECRET);
  
  return signatureInput + '.' + signature;
}

function verifyJWT(token) {
  if (!token) return null;
  
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  
  const signatureInput = parts[0] + '.' + parts[1];
  const expectedSignature = computeHmacSha256(signatureInput, JWT_SECRET);
  
  if (parts[2] !== expectedSignature) return null;
  
  const payload = JSON.parse(base64DecodeUrl(parts[1]));
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    return null; // Expired
  }
  
  return payload;
}

function base64EncodeUrl(str) {
  const encoded = Utilities.base64EncodeWebSafe(Utilities.newBlob(str).getBytes());
  return encoded.replace(/=+$/, '');
}

function base64DecodeUrl(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  const decoded = Utilities.base64Decode(str);
  return Utilities.newBlob(decoded).getDataAsString();
}

function computeHmacSha256(message, secret) {
  const signature = Utilities.computeHmacSha256Signature(message, secret);
  return Utilities.base64EncodeWebSafe(signature).replace(/=+$/, '');
}
