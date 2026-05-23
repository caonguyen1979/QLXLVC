import React, { useState } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { translateRole } from "../utils/translate";
import { apiCall } from "../services/api";
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
  Key,
} from "lucide-react";
import { clsx } from "clsx";

export const Layout: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Change Password States
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!newPassword) {
      setErrorMsg("Vui lòng nhập mật khẩu mới");
      return;
    }
    if (newPassword.length < 4) {
      setErrorMsg("Mật khẩu phải từ 4 ký tự trở lên");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg("Mật khẩu xác nhận không khớp");
      return;
    }

    setLoading(true);
    try {
      await apiCall("changePassword", { newPassword });
      setSuccessMsg("Đổi mật khẩu thành công!");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        setShowPwdModal(false);
        setSuccessMsg("");
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || "Có lỗi xảy ra khi đổi mật khẩu");
    } finally {
      setLoading(false);
    }
  };

  const sections = [
    {
      title: "Đánh giá viên chức",
      items: [
        { name: "Dashboard DG", path: "/", icon: LayoutDashboard, public: true },
        {
          name: "Tự đánh giá",
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
      ],
    },
    {
      title: "Thi đua Khen thưởng",
      items: [
        {
          name: "Dashboard TĐKT",
          path: "/emulation?tab=dashboard",
          icon: LayoutDashboard,
          roles: ["Teacher", "Staff", "TeamLeader", "Principal", "Admin"],
        },
        {
          name: "Đăng ký TĐKT",
          path: "/emulation?tab=register",
          icon: Award,
          roles: ["Teacher", "Staff", "TeamLeader", "Principal", "Admin"],
        },
      ],
    },
    {
      title: "Hệ thống",
      items: [
        {
          name: "Quản trị hệ thống",
          path: "/admin",
          icon: Settings,
          roles: ["Admin"],
        },
      ],
    },
  ];

  const getFilteredItems = (items: any[]) => {
    return items.filter(
      (item) =>
        item.public ||
        (isAuthenticated &&
          user &&
          item.roles?.map((r: string) => r.toLowerCase()).includes(user.role.toLowerCase())),
    );
  };

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
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {isAuthenticated && user && (
            <div className="flex items-center gap-3 px-2 mb-4">
              <UserCircle size={36} className="text-slate-400" />
              <div>
                <p className="font-medium text-sm">{user.name}</p>
                <p className="text-xs text-slate-400">{translateRole(user.role)}</p>
              </div>
            </div>
          )}

          {sections.map((section) => {
            const filteredItems = getFilteredItems(section.items);
            if (filteredItems.length === 0) return null;

            return (
              <div key={section.title} className="space-y-1.5 pt-2">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-3 mb-2">
                  {section.title}
                </p>
                {filteredItems.map((item) => {
                  const Icon = item.icon;
                  const itemPathname = item.path.split("?")[0];
                  const itemSearch = item.path.split("?")[1] || "";
                  
                  const isPathMatch = location.pathname === itemPathname;
                  const isSearchMatch = itemSearch 
                    ? location.search.includes(itemSearch) 
                    : !location.search || (!location.search.includes("tab=dashboard") && !location.search.includes("tab=register"));
                  
                  const isActive = isPathMatch && isSearchMatch;

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={clsx(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-colors",
                        isActive
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white",
                      )}
                    >
                      <Icon size={16} />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="flex-shrink-0 p-4 border-t border-slate-800 space-y-1">
          {isAuthenticated && (
            <button
              onClick={() => {
                setErrorMsg("");
                setSuccessMsg("");
                setNewPassword("");
                setConfirmPassword("");
                setShowPwdModal(true);
                setSidebarOpen(false); // Close mobile sidebar if open
              }}
              className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <Key size={18} />
              Đổi mật khẩu
            </button>
          )}

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

      {/* Change Password Modal */}
      {showPwdModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-[3000] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-100 w-full max-w-md overflow-hidden animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-slate-50 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Key className="text-indigo-600 w-5 h-5" />
                <h3 className="font-bold text-slate-950 text-base">Đổi mật khẩu</h3>
              </div>
              <button
                onClick={() => setShowPwdModal(false)}
                className="text-slate-400 hover:text-slate-500 rounded p-1 hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleChangePasswordSubmit} className="p-5 space-y-4">
              {errorMsg && (
                <div className="p-3 text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-100 rounded-lg">
                  ⚠️ {errorMsg}
                </div>
              )}
              {successMsg && (
                <div className="p-3 text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg">
                  🎉 {successMsg}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Mật khẩu mới
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới"
                  disabled={loading}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all font-medium text-slate-800"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Xác nhận mật khẩu mới
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu để xác nhận"
                  disabled={loading}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all font-medium text-slate-800"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPwdModal(false)}
                  disabled={loading}
                  className="px-4 py-2 text-xs font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg hover:shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {loading ? "Đang xử lý..." : "Xác nhận"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

