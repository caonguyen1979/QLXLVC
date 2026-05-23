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
        ACTIVE_YEAR: "2026",
        ACTIVE_QUARTER: "2",
        Q1_LOCKED: "false",
      };

    case "GET_THI_DUA_HISTORY": {
      const historyStr = localStorage.getItem("mock_thi_dua_history") || "[]";
      const history = JSON.parse(historyStr);
      const userHistory = history.filter((h: any) => String(h.userId) === String(payload.userId));
      return userHistory;
    }

    case "SAVE_THI_DUA_HISTORY": {
      const historyStr = localStorage.getItem("mock_thi_dua_history") || "[]";
      const history = JSON.parse(historyStr);
      
      const recordId = payload.id || "HIST_" + Math.floor(Math.random() * 100000);
      const existingIdx = history.findIndex((h: any) => String(h.id) === String(recordId));

      const newRecord = {
        id: recordId,
        userId: payload.userId,
        year: Number(payload.year),
        job_rating: payload.job_rating,
        title_achieved: payload.title_achieved,
        award_achieved: payload.award_achieved
      };

      if (existingIdx > -1) {
        history[existingIdx] = newRecord;
      } else {
        // Also prevent duplicated years
        const yearDupIdx = history.findIndex((h: any) => String(h.userId) === String(payload.userId) && Number(h.year) === Number(payload.year));
        if (yearDupIdx > -1) {
          history[yearDupIdx] = newRecord;
        } else {
          history.push(newRecord);
        }
      }

      localStorage.setItem("mock_thi_dua_history", JSON.stringify(history));
      return { message: "Lưu thành công", id: recordId };
    }

    case "DELETE_THI_DUA_HISTORY": {
      const historyStr = localStorage.getItem("mock_thi_dua_history") || "[]";
      const history = JSON.parse(historyStr);
      
      const filtered = history.filter((h: any) => String(h.id) !== String(payload.id));
      localStorage.setItem("mock_thi_dua_history", JSON.stringify(filtered));
      return { message: "Xóa thành công" };
    }

    case "GET_THI_DUA_REGISTRATION": {
      const regStr = localStorage.getItem("mock_thi_dua_registration") || "[]";
      const registrations = JSON.parse(regStr);
      const userReg = registrations.find(
        (r: any) => String(r.userId) === String(payload.userId) && Number(r.year) === Number(payload.year)
      );
      return userReg || null;
    }

    case "SAVE_THI_DUA_REGISTRATION": {
      const regStr = localStorage.getItem("mock_thi_dua_registration") || "[]";
      const registrations = JSON.parse(regStr);
      
      const existingIdx = registrations.findIndex(
        (r: any) => String(r.userId) === String(payload.userId) && Number(r.year) === Number(payload.year)
      );

      if (existingIdx > -1) {
        const existing = registrations[existingIdx];
        if (existing.status === "PENDING" || existing.status === "APPROVED") {
          throw new Error("Hồ sơ đã gửi hoặc đã duyệt, không thể thay đổi");
        }
        registrations[existingIdx] = { ...existing, ...payload };
      } else {
        const newRegId = "REG_" + Math.floor(Math.random() * 100000);
        registrations.push({
          registrationId: newRegId,
          ...payload
        });
      }

      localStorage.setItem("mock_thi_dua_registration", JSON.stringify(registrations));
      return { message: "Lưu thành công", success: true };
    }

    case "GET_ALL_THI_DUA_REGISTRATIONS": {
      const regStr = localStorage.getItem("mock_thi_dua_registration") || "[]";
      const registrations = JSON.parse(regStr);
      // Let's attach user names for convenient display
      const usersStr = localStorage.getItem("user");
      let teachersList = [
        { id: "1", name: "System Admin", role: "Admin", teamId: "SYS" },
        { id: "2", name: "John Doe", role: "Teacher", teamId: "MATH" },
        { id: "3", name: "Trần Thị Mai", role: "Teacher", teamId: "PHYS" },
        { id: "4", name: "Nguyễn Văn Hùng", role: "Staff", teamId: "VP" },
      ];
      
      const allRegs = registrations.map((r: any) => {
        const u = teachersList.find(t => String(t.id) === String(r.userId));
        return {
          ...r,
          userName: u ? u.name : "Giáo viên " + r.userId,
          userTeam: u ? u.teamId : "Tổ Khác",
        };
      });
      return allRegs;
    }

    case "APPROVE_THI_DUA_REGISTRATION": {
      const regStr = localStorage.getItem("mock_thi_dua_registration") || "[]";
      const registrations = JSON.parse(regStr);
      const existingIdx = registrations.findIndex(
        (r: any) => String(r.registrationId) === String(payload.registrationId)
      );

      if (existingIdx > -1) {
        registrations[existingIdx].status = payload.status; // APPROVED or REJECTED
        localStorage.setItem("mock_thi_dua_registration", JSON.stringify(registrations));
        return { message: "Cập nhật trạng thái duyệt thành công" };
      }
      throw new Error("Không tìm thấy đơn đăng ký để duyệt");
    }

    case "changePassword": {
      if (!payload.newPassword) {
        throw new Error("Mật khẩu mới không được để trống");
      }
      return { message: "Đổi mật khẩu thành công" };
    }

    default:
      return { message: "Mock success" };
  }
};

// Initialize default mock data
if (typeof window !== "undefined") {
  if (!localStorage.getItem("mock_thi_dua_history")) {
    const defaultHistory = [
      { id: 1, userId: "2", year: 2022, job_rating: "Xuất sắc", title_achieved: "Chiến sĩ thi đua cơ sở", award_achieved: "Giấy khen" },
      { id: 2, userId: "2", year: 2023, job_rating: "Xuất sắc", title_achieved: "Chiến sĩ thi đua cơ sở", award_achieved: "Giấy khen" },
      { id: 3, userId: "2", year: 2024, job_rating: "Xuất sắc", title_achieved: "Chiến sĩ thi đua cơ sở", award_achieved: "Bằng khen của Bộ, ban, ngành, tỉnh" },
      { id: 4, userId: "3", year: 2023, job_rating: "Tốt", title_achieved: "Lao động tiên tiến", award_achieved: "Giấy khen" },
      { id: 5, userId: "3", year: 2024, job_rating: "Xuất sắc", title_achieved: "Chiến sĩ thi đua cơ sở", award_achieved: "Giấy khen" },
    ];
    localStorage.setItem("mock_thi_dua_history", JSON.stringify(defaultHistory));
  }

  if (!localStorage.getItem("mock_thi_dua_registration")) {
    const defaultRegistrations = [
      {
        registrationId: "REG_001",
        userId: "2",
        year: 2025,
        work_months: 12,
        is_disciplined: false,
        leave_months: 0,
        current_job_rating: "Xuất sắc",
        has_initiative: true,
        has_topic: false,
        has_province_initiative: true,
        has_province_topic: false,
        selected_title: "Chiến sĩ thi đua cơ sở",
        selected_award: "Giấy khen",
        status: "PENDING"
      },
      {
        registrationId: "REG_002",
        userId: "3",
        year: 2025,
        work_months: 11,
        is_disciplined: false,
        leave_months: 0,
        current_job_rating: "Tốt",
        has_initiative: false,
        has_topic: false,
        has_province_initiative: false,
        has_province_topic: false,
        selected_title: "Lao động tiên tiến",
        selected_award: "Giấy khen",
        status: "DRAFT"
      }
    ];
    localStorage.setItem("mock_thi_dua_registration", JSON.stringify(defaultRegistrations));
  }
}
