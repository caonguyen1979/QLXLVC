# Evaluation Management System

A production-ready evaluation management web application built with Vite, React, Tailwind CSS, and Google Apps Script.

## Architecture

- **Frontend**: React (Vite), Tailwind CSS, Zustand, React Router, Recharts.
- **Backend**: Google Apps Script (Standalone project serving as a REST API).
- **Database**: Google Sheets.

## Features

- **Role-based Access Control**: Admin, Principal, TeamLeader, Teacher, Staff.
- **Dynamic Evaluation Forms**: Read directly from Google Sheets (`GV` and `NV` tabs).
- **Workflow**: Self-evaluation -> TeamLeader scoring -> Principal override.
- **Public Dashboard**: View team averages and completion rates without logging in.
- **Admin Panel**: Manage system configuration and lock/unlock quarters.

## Getting Started

### 1. Backend Setup (Google Apps Script)
See `DEPLOYMENT.md` for detailed instructions on setting up the Google Apps Script backend and Google Sheets database.

### 2. Frontend Setup
1. Clone the repository.
2. Run `npm install`.
3. Copy `.env.example` to `.env` and configure your `VITE_GAS_API_URL`.
4. Run `npm run dev` to start the development server.

## Documentation
- `API_CONTRACT.md`: Details the REST API endpoints and payload structures.
- `ERD.md`: Entity-Relationship Diagram explaining the Google Sheets structure.
- `DEPLOYMENT.md`: Step-by-step deployment guide for Vercel and Google Apps Script.
