# API Contract Documentation

Base URL: `[GOOGLE_APPS_SCRIPT_WEB_APP_URL]`

All requests must be `POST` requests because Google Apps Script `doGet` does not support request bodies, and CORS preflight is easier to handle with a single `doPost` entry point using a custom payload structure.

## Request Format
```json
{
  "action": "ACTION_NAME",
  "token": "JWT_TOKEN", // Optional for public endpoints
  "payload": {
    // Action specific data
  }
}
```

## Response Format
```json
{
  "success": true | false,
  "data": { ... }, // On success
  "error": "Error message" // On failure
}
```

---

## Endpoints (Actions)

### 1. `login`
- **Auth Required**: No
- **Payload**:
  ```json
  {
    "username": "user1",
    "password": "password123"
  }
  ```
- **Response**:
  ```json
  {
    "token": "jwt.token.here",
    "user": {
      "id": "u1",
      "username": "user1",
      "role": "Teacher",
      "name": "John Doe"
    }
  }
  ```

### 2. `getDashboardData`
- **Auth Required**: No
- **Payload**: `{}`
- **Response**:
  ```json
  {
    "totalMembers": 150,
    "teamAverages": [{ "team": "Math", "average": 85.5 }],
    "completionRate": 95.5
  }
  ```

### 3. `getEvaluationTemplate`
- **Auth Required**: Yes
- **Payload**:
  ```json
  {
    "type": "GV" // or "NV"
  }
  ```
- **Response**:
  ```json
  {
    "template": [
      {
        "id": "c1",
        "section": "I. Teaching",
        "criteria": "Punctuality",
        "description": "Arrives on time",
        "maxScore": 10
      }
    ]
  }
  ```

### 4. `submitEvaluation`
- **Auth Required**: Yes
- **Payload**:
  ```json
  {
    "userId": "u1",
    "year": "2023-2024",
    "quarter": 1,
    "scores": [
      { "criteriaId": "c1", "score": 9, "type": "selfScore" } // type: selfScore, teamLeaderScore, principalScore
    ]
  }
  ```

### 5. `getConfig`
- **Auth Required**: No
- **Payload**: `{}`
- **Response**:
  ```json
  {
    "ACTIVE_YEAR": "2023-2024",
    "ACTIVE_QUARTER": "1",
    "Q1_LOCKED": "false"
  }
  ```
