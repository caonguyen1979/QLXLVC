import React, { useState } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { translateRole } from "../utils/translate";
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  UserCircle,
} from "lucide-react";
import { clsx } from "clsx";

export const Layout: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { name: "Bảng điều khiển", path: "/", icon: LayoutDashboard, public: true },
    {
      name: "Đánh giá cá nhân",
      path: "/evaluation",
      icon: FileText,
      roles: ["Teacher", "Staff", "TeamLeader", "Principal"],
    },
    {
      name: "Đánh giá tổ/nhóm",
      path: "/team",
      icon: Users,
      roles: ["TeamLeader", "Principal"],
    },
    {
      name: "Quản trị hệ thống",
      path: "/admin",
      icon: Settings,
      roles: ["Admin"],
    },
  ];

  const filteredNavItems = navItems.filter(
    (item) =>
      item.public ||
      (isAuthenticated &&
        user &&
        item.roles?.map((r) => r.toLowerCase()).includes(user.role.toLowerCase())),
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between h-16 px-6 bg-slate-950">
          <span className="text-lg font-bold tracking-tight">
            Hệ thống Đánh giá
          </span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-4 py-6">
          {isAuthenticated && user && (
            <div className="flex items-center gap-3 px-2 mb-8">
              <UserCircle size={36} className="text-slate-400" />
              <div>
                <p className="font-medium text-sm">{user.name}</p>
                <p className="text-xs text-slate-400">{translateRole(user.role)}</p>
              </div>
            </div>
          )}

          <nav className="space-y-1">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={clsx(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-indigo-600 text-white"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white",
                  )}
                >
                  <Icon size={18} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {isAuthenticated && (
          <div className="absolute bottom-0 w-full p-4 border-t border-slate-800">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <LogOut size={18} />
              Đăng xuất
            </button>
          </div>
        )}
        {!isAuthenticated && (
          <div className="absolute bottom-0 w-full p-4 border-t border-slate-800">
            <Link
              to="/login"
              className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <UserCircle size={18} />
              Đăng nhập
            </Link>
          </div>
        )}
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 bg-white border-b border-slate-200">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-slate-500 hover:text-slate-700"
          >
            <Menu size={24} />
          </button>
          <div className="flex-1"></div>
        </header>

        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
