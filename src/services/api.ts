import { useAuthStore } from "../store/authStore";

const GAS_URL =
  import.meta.env.VITE_GAS_API_URL ||
  "https://script.google.com/macros/s/MOCK_URL/exec";

// Mock data for development when GAS URL is not provided
const MOCK_MODE = GAS_URL.includes("MOCK_URL");

export const apiCall = async (action: string, payload: any = {}) => {
  const token = useAuthStore.getState().token;

  if (MOCK_MODE) {
    return mockApiCall(action, payload);
  }

  try {
    const response = await fetch(GAS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8", // GAS requires text/plain for CORS
      },
      body: JSON.stringify({
        action,
        token,
        payload,
      }),
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "API Error");
    }
    return data.data;
  } catch (error: any) {
    console.error(`API Error (${action}):`, error);
    throw error;
  }
};

// --- Mock Implementation for Development ---
const mockApiCall = async (action: string, payload: any) => {
  await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate network delay

  switch (action) {
    case "login":
      if (payload.username === "admin" && payload.password === "admin") {
        return {
          token: "mock.jwt.token",
          user: {
            id: "1",
            username: "admin",
            role: "Admin",
            name: "System Admin",
            teamId: "SYS",
          },
        };
      }
      if (payload.username === "teacher" && payload.password === "teacher") {
        return {
          token: "mock.jwt.token",
          user: {
            id: "2",
            username: "teacher",
            role: "Teacher",
            name: "John Doe",
            teamId: "MATH",
          },
        };
      }
      throw new Error(
        "Invalid credentials (use admin/admin or teacher/teacher)",
      );

    case "getDashboardData":
      return {
        totalMembers: 150,
        completionRate: 85,
        teamAverages: [
          { team: "Math", average: 92 },
          { team: "Science", average: 88 },
          { team: "Literature", average: 90 },
          { team: "History", average: 85 },
        ],
      };

    case "getEvaluationTemplate":
      return [
        {
          id: "c1",
          section: "I. Teaching Quality",
          criteria: "Punctuality",
          description: "Arrives on time to classes",
          maxScore: 10,
        },
        {
          id: "c2",
          section: "I. Teaching Quality",
          criteria: "Preparation",
          description: "Lesson plans are well prepared",
          maxScore: 20,
        },
        {
          id: "c3",
          section: "II. Professionalism",
          criteria: "Teamwork",
          description: "Collaborates with peers",
          maxScore: 10,
        },
      ];

    case "getConfig":
      return {
        ACTIVE_YEAR: "2023-2024",
        ACTIVE_QUARTER: "1",
        Q1_LOCKED: "false",
      };

    default:
      return { message: "Mock success" };
  }
};
