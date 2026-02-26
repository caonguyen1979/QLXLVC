import { create } from "zustand";
import { jwtDecode } from "jwt-decode";

interface User {
  id: string;
  username: string;
  role: "Admin" | "Principal" | "TeamLeader" | "Teacher" | "Staff";
  name: string;
  teamId: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  login: (token, user) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    set({ user: null, token: null, isAuthenticated: false });
  },
  checkAuth: () => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (token && userStr) {
      try {
        const decoded: any = jwtDecode(token);
        if (decoded.exp * 1000 < Date.now()) {
          // Token expired
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          set({ user: null, token: null, isAuthenticated: false });
        } else {
          set({ user: JSON.parse(userStr), token, isAuthenticated: true });
        }
      } catch (e) {
        set({ user: null, token: null, isAuthenticated: false });
      }
    }
  },
}));
