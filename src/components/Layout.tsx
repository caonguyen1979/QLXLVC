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
  Award,
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
      name: "Trang cá nhân",
      path: "/evaluation",
      icon: FileText,
      roles: ["Teacher", "Staff", "TeamLeader", "Principal"],
    },
    {
      name: "Thi đua Khen thưởng",
      path: "/emulation",
      icon: Award,
      roles: ["Teacher", "Staff", "TeamLeader", "Principal", "Admin"],
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
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Mobile Hamburger Button */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed top-3 left-3 z-[2000] lg:hidden p-2 rounded-md bg-white shadow-sm border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <Menu size={24} />
        </button>
      )}

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[1998] lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          "fixed top-0 h-screen w-[280px] overflow-hidden flex flex-col justify-between bg-slate-900 text-white transition-[left] duration-300 ease-in-out z-[1999] print:hidden",
          sidebarOpen ? "left-0" : "left-[-100%]",
          "lg:left-0" // Always visible on Desktop
        )}
      >
        {/* Sidebar Header/Logo */}
        <div className="flex-shrink-0 flex items-center justify-between h-16 px-6 bg-slate-950">
          <div className="flex items-center gap-3">
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="w-8 h-8 object-contain" 
              onError={(e) => { e.currentTarget.style.display = 'none'; }} 
            />
            <span className="text-lg font-bold tracking-tight">
              Hệ thống Đánh giá
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Sidebar Menu */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
          {isAuthenticated && user && (
            <div className="flex items-center gap-3 px-2 mb-8">
              <UserCircle size={36} className="text-slate-400" />
              <div>
                <p className="font-medium text-sm">{user.name}</p>
                <p className="text-xs text-slate-400">{translateRole(user.role)}</p>
              </div>
            </div>
          )}

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

        {/* Sidebar Footer */}
        <div className="flex-shrink-0 p-4 border-t border-slate-800">
          {isAuthenticated ? (
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <LogOut size={18} />
              Đăng xuất
            </button>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <UserCircle size={18} />
              Đăng nhập
            </Link>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-[280px] h-screen overflow-y-auto min-w-0 bg-slate-50 pb-8">
        <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 w-full max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

