# Evaluation Management System - ERD

## Entities and Relationships

### 1. `users` Sheet
Stores user credentials and roles.
- `id` (String, Primary Key)
- `username` (String, Unique)
- `password` (String, Plain text as requested)
- `role` (Enum: Admin, Principal, TeamLeader, Teacher, Staff)
- `name` (String)
- `teamId` (String, Foreign Key to Teams)

### 2. `GV` Sheet (Teacher Evaluation Template)
Stores the template for Teacher evaluations.
- `id` (String, Primary Key)
- `section` (String) - e.g., "I. Teaching Quality"
- `criteria` (String) - e.g., "Punctuality"
- `description` (String)
- `maxScore` (Number)

### 3. `NV` Sheet (Staff Evaluation Template)
Stores the template for Staff evaluations.
- `id` (String, Primary Key)
- `section` (String)
- `criteria` (String)
- `description` (String)
- `maxScore` (Number)

### 4. `DataGV` Sheet (Teacher Evaluation Data)
Stores submitted evaluations for Teachers.
- `id` (String, Primary Key)
- `userId` (String, Foreign Key to users)
- `year` (String)
- `quarter` (Number: 1, 2, 3, 4)
- `criteriaId` (String, Foreign Key to GV)
- `selfScore` (Number)
- `teamLeaderScore` (Number)
- `principalScore` (Number)
- `status` (Enum: Draft, SelfSubmitted, TLSubmitted, PrincipalOverridden)

### 5. `DataNV` Sheet (Staff Evaluation Data)
Stores submitted evaluations for Staff.
- `id` (String, Primary Key)
- `userId` (String, Foreign Key to users)
- `year` (String)
- `quarter` (Number: 1, 2, 3, 4)
- `criteriaId` (String, Foreign Key to NV)
- `selfScore` (Number)
- `teamLeaderScore` (Number)
- `principalScore` (Number)
- `status` (Enum: Draft, SelfSubmitted, TLSubmitted, PrincipalOverridden)

### 6. `Config` Sheet
Stores system configuration.
- `key` (String, Primary Key) - e.g., "ACTIVE_YEAR", "ACTIVE_QUARTER", "Q1_LOCKED"
- `value` (String)

### 7. `AuditLog` Sheet
Stores system logs for security and tracking.
- `id` (String, Primary Key)
- `timestamp` (DateTime)
- `userId` (String, Foreign Key to users)
- `action` (String)
- `details` (String)
