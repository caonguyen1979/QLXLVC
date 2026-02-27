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
        result = handleGetDashboardData(payload);
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
        if (user.role.toLowerCase() !== 'admin') throw new Error("Forbidden");
        result = handleGetUsers();
        break;
      case 'addUser':
        if (user.role.toLowerCase() !== 'admin') throw new Error("Forbidden");
        result = handleAddUser(payload);
        break;
      case 'importUsers':
        if (user.role.toLowerCase() !== 'admin') throw new Error("Forbidden");
        result = handleImportUsers(payload);
        break;
      case 'updateUser':
        if (user.role.toLowerCase() !== 'admin') throw new Error("Forbidden");
        result = handleUpdateUser(payload);
        break;
      case 'deleteUser':
        if (user.role.toLowerCase() !== 'admin') throw new Error("Forbidden");
        result = handleDeleteUser(payload);
        break;
      case 'updateConfig':
        if (user.role.toLowerCase() !== 'admin') throw new Error("Forbidden");
        result = handleUpdateConfig(payload);
        break;
      case 'getTeamData':
        result = handleGetTeamData(user, payload);
        break;
      case 'getUserEvaluation':
        result = handleGetUserEvaluation(user, payload);
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
        id: row[0] || row[1], // Fallback to username if id is empty
        username: row[1],
        role: row[3],
        name: row[4],
        teamId: row[5]
      };
      
      const token = createJWT(user);
      logAudit(user.id, 'LOGIN', 'Đăng nhập thành công');
      
      return { token, user };
    }
  }
  throw new Error("Thông tin đăng nhập không hợp lệ");
}

function handleGetDashboardData(payload) {
  const filterYear = payload?.year;
  const filterQuarter = payload?.quarter;

  const usersSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('users');
  const usersData = usersSheet ? usersSheet.getDataRange().getValues() : [];
  
  const totalMembers = usersData.length > 1 ? usersData.length - 1 : 0;
  
  const userMap = {};
  for (let i = 1; i < usersData.length; i++) {
    const uid = usersData[i][0] || usersData[i][1];
    userMap[uid] = {
      name: usersData[i][4],
      teamId: usersData[i][5],
      role: usersData[i][3]
    };
  }

  const details = {};
  const submittedUsers = new Set();
  const teamScores = {};

  const processRow = (row, type) => {
    const userId = row[1];
    const year = row[2];
    const quarter = row[3];
    const criteriaId = row[4];
    const selfScore = row[5];
    const tlScore = row[6];
    const prScore = row[7];
    
    if (filterYear && year != filterYear) return;
    if (filterQuarter && quarter != filterQuarter) return;
    
    submittedUsers.add(userId);
    
    const key = `${userId}_${year}_${quarter}`;
    if (!details[key]) {
      const u = userMap[userId] || {};
      details[key] = {
        userId,
        name: u.name || userId,
        teamId: u.teamId || 'Unknown',
        role: u.role || '',
        year,
        quarter,
        type,
        scores: {}
      };
    }
    
    details[key].scores[criteriaId] = {
      self: selfScore,
      tl: tlScore,
      pr: prScore
    };

    if (criteriaId === 'TOTAL') {
      const teamId = userMap[userId]?.teamId || 'Unknown';
      if (!teamScores[teamId]) teamScores[teamId] = [];
      const finalScore = prScore !== '' ? prScore : (tlScore !== '' ? tlScore : selfScore);
      teamScores[teamId].push(Number(finalScore) || 0);
    }
  };

  const dataGVSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('DataGV');
  if (dataGVSheet) {
    dataGVSheet.getDataRange().getValues().slice(1).forEach(r => processRow(r, 'GV'));
  }
  
  const dataNVSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('DataNV');
  if (dataNVSheet) {
    dataNVSheet.getDataRange().getValues().slice(1).forEach(r => processRow(r, 'NV'));
  }
  
  const completionRate = totalMembers > 0 ? Math.round((submittedUsers.size / totalMembers) * 100) : 0;
  
  const teamAverages = Object.keys(teamScores).map(team => {
    const scores = teamScores[team];
    const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    return { team: team, average: Math.round(avg * 10) / 10 };
  });
  
  return {
    totalMembers,
    completionRate,
    teamAverages,
    details: Object.values(details)
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
  const year = payload.year;
  const quarter = payload.quarter;

  const config = handleGetConfig();
  if (config[`LOCKED_Q${quarter}`] === 'true' && user.role.toLowerCase() !== 'admin') {
    throw new Error(`Quý ${quarter} đã bị khóa, không thể nộp đánh giá.`);
  }

  const sheetName = payload.type === 'NV' ? 'DataNV' : 'DataGV';
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(sheetName);
  
  if (!sheet) throw new Error("Không tìm thấy sheet dữ liệu (DataGV/DataNV)");

  const userId = payload.userId || user.id || user.username;
  const scores = payload.scores;

  const data = sheet.getDataRange().getValues();
  
  const existingRows = {};
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const key = `${row[1]}_${row[2]}_${row[3]}_${row[4]}`;
    existingRows[key] = i + 1;
  }

  scores.forEach(scoreItem => {
    const key = `${userId}_${year}_${quarter}_${scoreItem.criteriaId}`;
    const rowIndex = existingRows[key];
    
    if (rowIndex) {
      let colToUpdate = -1;
      if (scoreItem.type === 'selfScore') colToUpdate = 6;
      else if (scoreItem.type === 'teamLeaderScore') colToUpdate = 7;
      else if (scoreItem.type === 'principalScore') colToUpdate = 8;
      
      if (colToUpdate !== -1) {
        sheet.getRange(rowIndex, colToUpdate).setValue(scoreItem.score);
        if (scoreItem.type === 'selfScore') sheet.getRange(rowIndex, 9).setValue('SelfSubmitted');
      }
    } else {
      const newRow = [
        Utilities.getUuid(),
        userId,
        year,
        quarter,
        scoreItem.criteriaId,
        scoreItem.type === 'selfScore' ? scoreItem.score : '',
        scoreItem.type === 'teamLeaderScore' ? scoreItem.score : '',
        scoreItem.type === 'principalScore' ? scoreItem.score : '',
        scoreItem.type === 'selfScore' ? 'SelfSubmitted' : 'Draft'
      ];
      sheet.appendRow(newRow);
    }
  });

  logAudit(userId, 'SUBMIT_EVAL', `Đã nộp đánh giá cho ${year} Q${quarter}`);
  return { message: "Lưu thành công" };
}

function handleGetUsers() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('users');
  const data = sheet.getDataRange().getValues();
  const users = [];
  for (let i = 1; i < data.length; i++) {
    users.push({
      id: data[i][0] || data[i][1],
      username: data[i][1],
      role: data[i][3],
      name: data[i][4],
      teamId: data[i][5]
    });
  }
  return users;
}

function handleAddUser(payload) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('users');
  const newRow = [
    Utilities.getUuid(),
    payload.username,
    payload.password,
    payload.role,
    payload.name,
    payload.teamId
  ];
  sheet.appendRow(newRow);
  return { message: "Thêm người dùng thành công" };
}

function handleImportUsers(payload) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('users');
  const users = payload.users;
  
  if (!users || !Array.isArray(users) || users.length === 0) {
    throw new Error("Dữ liệu không hợp lệ");
  }
  
  const newRows = users.map(u => [
    Utilities.getUuid(),
    u.username,
    u.password,
    u.role,
    u.name,
    u.teamId || ''
  ]);
  
  // Append rows in batch for better performance
  sheet.getRange(sheet.getLastRow() + 1, 1, newRows.length, newRows[0].length).setValues(newRows);
  
  return { message: `Đã nhập ${newRows.length} người dùng thành công` };
}

function handleUpdateUser(payload) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('users');
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === payload.id || data[i][1] === payload.username) {
      sheet.getRange(i + 1, 2).setValue(payload.username);
      if (payload.password) sheet.getRange(i + 1, 3).setValue(payload.password);
      sheet.getRange(i + 1, 4).setValue(payload.role);
      sheet.getRange(i + 1, 5).setValue(payload.name);
      sheet.getRange(i + 1, 6).setValue(payload.teamId);
      return { message: "Cập nhật thành công" };
    }
  }
  throw new Error("Không tìm thấy người dùng");
}

function handleDeleteUser(payload) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('users');
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === payload.id || data[i][1] === payload.username) {
      sheet.deleteRow(i + 1);
      return { message: "Xóa thành công" };
    }
  }
  throw new Error("Không tìm thấy người dùng");
}

function handleUpdateConfig(payload) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Config');
  if (!sheet) throw new Error("Không tìm thấy sheet Config");
  const data = sheet.getDataRange().getValues();
  
  const configMap = {};
  for (let i = 0; i < data.length; i++) {
    configMap[data[i][0]] = i + 1;
  }
  
  const updateOrAdd = (key, value) => {
    if (configMap[key]) {
      sheet.getRange(configMap[key], 2).setValue(value);
    } else {
      sheet.appendRow([key, value]);
      configMap[key] = sheet.getLastRow();
    }
  };
  
  updateOrAdd('ACTIVE_YEAR', payload.year);
  updateOrAdd('ACTIVE_QUARTER', payload.quarter);
  updateOrAdd('LOCKED_Q1', payload.lockedQuarters.includes(1) ? 'true' : 'false');
  updateOrAdd('LOCKED_Q2', payload.lockedQuarters.includes(2) ? 'true' : 'false');
  updateOrAdd('LOCKED_Q3', payload.lockedQuarters.includes(3) ? 'true' : 'false');
  updateOrAdd('LOCKED_Q4', payload.lockedQuarters.includes(4) ? 'true' : 'false');
  
  return { message: "Cập nhật cấu hình thành công" };
}

function handleGetUserEvaluation(user, payload) {
  const sheetName = payload.type === 'NV' ? 'DataNV' : 'DataGV';
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(sheetName);
  if (!sheet) return {};
  
  const userId = payload.userId || user.id || user.username;
  const year = payload.year;
  const quarter = payload.quarter;
  
  const data = sheet.getDataRange().getValues();
  const scores = {};
  let tlEvaluated = false;
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[1] == userId && row[2] == year && row[3] == quarter) {
      scores[row[4]] = row[5]; // selfScore
      if (row[6] !== '') {
        tlEvaluated = true;
      }
    }
  }
  
  return { scores, tlEvaluated };
}

function handleGetTeamData(user, payload) {
  const year = payload.year;
  const quarter = payload.quarter;
  
  const usersSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('users');
  const usersData = usersSheet.getDataRange().getValues();
  
  const teamMembers = [];
  const memberIds = new Set();
  
  for (let i = 1; i < usersData.length; i++) {
    const role = usersData[i][3];
    if (role.toLowerCase() === 'admin') continue;
    
    if (user.role.toLowerCase() === 'principal' || usersData[i][5] === user.teamId) {
      const uid = usersData[i][0] || usersData[i][1];
      teamMembers.push({
        id: uid,
        username: usersData[i][1],
        role: role,
        name: usersData[i][4],
        teamId: usersData[i][5]
      });
      memberIds.add(uid);
    }
  }
  
  const evaluations = {};
  
  const processSheet = (sheetName) => {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(sheetName);
    if (!sheet) return;
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const uid = row[1];
      const rYear = row[2];
      const rQuarter = row[3];
      
      if (memberIds.has(uid) && rYear == year && rQuarter == quarter) {
        if (!evaluations[uid]) evaluations[uid] = {};
        evaluations[uid][row[4]] = {
          selfScore: row[5],
          tlScore: row[6],
          prScore: row[7],
          status: row[8]
        };
      }
    }
  };
  
  processSheet('DataGV');
  processSheet('DataNV');
  
  return { teamMembers, evaluations };
}

// --- Utilities ---

function logAudit(userId, action, details) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('AuditLog');
    if (sheet) {
      sheet.appendRow([Utilities.getUuid(), new Date(), userId || 'UNKNOWN', action, details]);
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
