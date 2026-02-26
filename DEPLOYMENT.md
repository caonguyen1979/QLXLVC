# Deployment Guide

## 1. Google Apps Script (Backend)

1. Go to [Google Apps Script](https://script.google.com/) and create a new project.
2. Name the project "Evaluation Management Backend".
3. Copy the contents of `backend/Code.gs` from this repository into the `Code.gs` file in the Apps Script editor.
4. Create a new Google Sheet and name it "Evaluation System Data".
5. Create the following sheets (tabs) exactly as named:
   - `users` (Columns: id, username, password, role, name, teamId)
   - `GV` (Columns: id, section, criteria, description, maxScore)
   - `NV` (Columns: id, section, criteria, description, maxScore)
   - `DataGV` (Columns: id, userId, year, quarter, criteriaId, selfScore, teamLeaderScore, principalScore, status)
   - `DataNV` (Columns: id, userId, year, quarter, criteriaId, selfScore, teamLeaderScore, principalScore, status)
   - `Config` (Columns: key, value)
   - `AuditLog` (Columns: id, timestamp, userId, action, details)
6. Copy the Google Sheet ID from the URL (the long string between `/d/` and `/edit`).
7. In `Code.gs`, replace `YOUR_SPREADSHEET_ID_HERE` with your actual Sheet ID.
8. Click **Deploy** -> **New deployment**.
9. Select type: **Web app**.
10. Execute as: **Me**.
11. Who has access: **Anyone**.
12. Click **Deploy** and authorize the script.
13. Copy the **Web app URL**.

## 2. Vercel (Frontend)

1. Push this repository to GitHub.
2. Go to [Vercel](https://vercel.com/) and click **Add New** -> **Project**.
3. Import your GitHub repository.
4. In the **Environment Variables** section, add:
   - `VITE_GAS_API_URL`: Paste the Web app URL you copied from Google Apps Script.
5. Click **Deploy**.
6. Your application will be live!
