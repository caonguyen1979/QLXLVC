import React, { useEffect, useState } from "react";
import { useAuthStore } from "../store/authStore";
import { apiCall } from "../services/api";
import { clsx } from "clsx";
import Swal from "sweetalert2";
import { 
  Award, 
  Calendar, 
  CheckCircle, 
  Clock, 
  FileText, 
  HelpCircle, 
  History, 
  Lock, 
  FileCheck, 
  ShieldAlert, 
  User, 
  Users, 
  AlertTriangle,
  XCircle,
  ThumbsUp,
  ThumbsDown,
  Search,
  Filter
} from "lucide-react";

interface HistoryRecord {
  id: string | number;
  userId: string;
  year: number;
  job_rating: string;
  title_achieved: string;
  award_achieved: string;
}

interface Registration {
  registrationId?: string;
  userId: string;
  userName?: string;
  userTeam?: string;
  year: number;
  work_months: number;
  is_disciplined: boolean;
  leave_months: number;
  current_job_rating: string;
  has_initiative: boolean;
  has_topic: boolean;
  has_province_initiative: boolean;
  has_province_topic: boolean;
  selected_title: string;
  selected_award: string;
  status: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";
}

export const Emulation: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"register" | "history" | "approve">("register");
  
  // Configuration
  const [activeYear, setActiveYear] = useState(2026); // mapped from active school year e.g. 2025-2026 -> 2026

  // User State
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [registration, setRegistration] = useState<Registration>({
    userId: user?.id || "",
    year: 2026,
    work_months: 12,
    is_disciplined: false,
    leave_months: 0,
    current_job_rating: "Tốt",
    has_initiative: false,
    has_topic: false,
    has_province_initiative: false,
    has_province_topic: false,
    selected_title: "Không đăng ký",
    selected_award: "Không đăng ký",
    status: "DRAFT"
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Administrative view state
  const [allRegistrations, setAllRegistrations] = useState<Registration[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [hasConsecutiveCstdcs3, setHasConsecutiveCstdcs3] = useState(false);
  const [hasConsecutiveCstdcs2, setHasConsecutiveCstdcs2] = useState(false);

  // Load user data
  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Get Config
      const configRes = await apiCall("getConfig");
      const currentSchoolYear = configRes?.ACTIVE_YEAR !== undefined ? String(configRes.ACTIVE_YEAR) : "2025-2026";
      // Extract numeric year (e.g. 2025-2026 -> 2026, or 2026 -> 2026)
      let numericYear = 2026;
      if (currentSchoolYear.includes("-")) {
        const parts = currentSchoolYear.split("-");
        numericYear = parseInt(parts[1]) || parseInt(parts[0]) || 2026;
      } else {
        numericYear = parseInt(currentSchoolYear) || 2026;
      }
      setActiveYear(numericYear);

      // Save user ID to local storage as requested
      localStorage.setItem("userId", user.id);

      // 2. Load History
      const histRes = await apiCall("GET_THI_DUA_HISTORY", { userId: user.id });
      setHistory(histRes || []);

      // 3. Check for consecutive streak in history
      analyzeHistoryStreaks(histRes || []);

      // 4. Load Current Registration
      const regRes = await apiCall("GET_THI_DUA_REGISTRATION", { userId: user.id, year: numericYear });
      if (regRes) {
        setRegistration(regRes);
      } else {
        // Initial defaults
        setRegistration({
          userId: user.id,
          year: numericYear,
          work_months: 12,
          is_disciplined: false,
          leave_months: 0,
          current_job_rating: "Tốt",
          has_initiative: false,
          has_topic: false,
          has_province_initiative: false,
          has_province_topic: false,
          selected_title: "Không đăng ký",
          selected_award: "Không đăng ký",
          status: "DRAFT"
        });
      }

      // 5. If Admin, Principal or TeamLeader, load administrative registrations
      const isAdminOrLeader = ["admin", "principal", "teamleader"].includes(user.role.toLowerCase());
      if (isAdminOrLeader) {
        loadAdminRegistrations();
      }
    } catch (err: any) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Lỗi tải dữ liệu",
        text: err.message || "Không thể kết nối danh sách thi đua",
        confirmButtonColor: "#4f46e5"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAdminRegistrations = async () => {
    setAdminLoading(true);
    try {
      const allRegs = await apiCall("GET_ALL_THI_DUA_REGISTRATIONS");
      setAllRegistrations(allRegs || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setAdminLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Analyze streaks of "Chiến sĩ thi đua cơ sở" in user history
  const analyzeHistoryStreaks = (histList: HistoryRecord[]) => {
    if (!histList || histList.length === 0) {
      setHasConsecutiveCstdcs3(false);
      setHasConsecutiveCstdcs2(false);
      return;
    }

    // Filter year numbers where title_achieved was "Chiến sĩ thi đua cơ sở"
    const cstdYears = histList
      .filter(record => record.title_achieved === "Chiến sĩ thi đua cơ sở")
      .map(record => Number(record.year))
      .sort((a, b) => a - b);

    // Remove duplicates
    const uniqueYears = Array.from(new Set(cstdYears));

    // Find consecutive sequences
    let maxStreak = 0;
    let currentStreak = 0;
    
    for (let i = 0; i < uniqueYears.length; i++) {
      if (i === 0) {
        currentStreak = 1;
      } else if (uniqueYears[i] === uniqueYears[i - 1] + 1) {
        currentStreak += 1;
      } else if (uniqueYears[i] !== uniqueYears[i - 1]) {
        currentStreak = 1;
      }
      if (currentStreak > maxStreak) {
        maxStreak = currentStreak;
      }
    }

    setHasConsecutiveCstdcs3(maxStreak >= 3);
    setHasConsecutiveCstdcs2(maxStreak >= 2);
  };

  // Rule Engine Formulas
  const isMinimumRequirementMet = 
    registration.work_months >= 6 && 
    !registration.is_disciplined && 
    registration.leave_months < 3;

  const canLaoDongTienTien = 
    isMinimumRequirementMet && 
    ["Tốt", "Xuất sắc"].includes(registration.current_job_rating);

  const canChienSiThiDuaCoSo = 
    canLaoDongTienTien && 
    (registration.current_job_rating === "Xuất sắc" || registration.has_initiative || registration.has_topic);

  const canChienSiThiDuaCapTinh = 
    cstdStreakMet(3) && 
    (registration.has_province_initiative || registration.has_province_topic);

  const canGiayKhen = 
    isMinimumRequirementMet && 
    ["Tốt", "Xuất sắc"].includes(registration.current_job_rating);

  const canBangKhen = 
    ["Tốt", "Xuất sắc"].includes(registration.current_job_rating) && 
    cstdStreakMet(2);

  function cstdStreakMet(years: number): boolean {
    if (years === 3) return hasConsecutiveCstdcs3;
    if (years === 2) return hasConsecutiveCstdcs2;
    return false;
  }

  // Adjust choices based on eligibility change
  useEffect(() => {
    // If not matching eligibility, reset current selection
    let updatedTitle = registration.selected_title;
    let updatedAward = registration.selected_award;

    if (!isMinimumRequirementMet) {
      updatedTitle = "Không đăng ký";
      updatedAward = "Không đăng ký";
    } else {
      if (updatedTitle === "Chiến sĩ thi đua cấp Bộ, ban, ngành, tỉnh" && !canChienSiThiDuaCapTinh) {
        updatedTitle = canChienSiThiDuaCoSo ? "Chiến sĩ thi đua cơ sở" : (canLaoDongTienTien ? "Lao động tiên tiến" : "Không đăng ký");
      }
      if (updatedTitle === "Chiến sĩ thi đua cơ sở" && !canChienSiThiDuaCoSo) {
        updatedTitle = canLaoDongTienTien ? "Lao động tiên tiến" : "Không đăng ký";
      }
      if (updatedTitle === "Lao động tiên tiến" && !canLaoDongTienTien) {
        updatedTitle = "Không đăng ký";
      }

      if (updatedAward === "Bằng khen của Bộ, ban, ngành, tỉnh" && !canBangKhen) {
        updatedAward = canGiayKhen ? "Giấy khen" : "Không đăng ký";
      }
      if (updatedAward === "Giấy khen" && !canGiayKhen) {
        updatedAward = "Không đăng ký";
      }
    }

    if (updatedTitle !== registration.selected_title || updatedAward !== registration.selected_award) {
      setRegistration(prev => ({
        ...prev,
        selected_title: updatedTitle,
        selected_award: updatedAward
      }));
    }
  }, [
    registration.work_months,
    registration.is_disciplined,
    registration.leave_months,
    registration.current_job_rating,
    registration.has_initiative,
    registration.has_topic,
    registration.has_province_initiative,
    registration.has_province_topic,
    hasConsecutiveCstdcs2,
    hasConsecutiveCstdcs3
  ]);

  const handleInputChange = (field: keyof Registration, value: any) => {
    if (registration.status === "PENDING" || registration.status === "APPROVED") return;
    setRegistration(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async (status: "DRAFT" | "PENDING") => {
    setSubmitting(true);
    try {
      const payload = {
        ...registration,
        userId: user?.id,
        year: activeYear,
        status: status
      };

      await apiCall("SAVE_THI_DUA_REGISTRATION", payload);

      setRegistration(prev => ({ ...prev, status }));

      Swal.fire({
        icon: "success",
        title: status === "PENDING" ? "Nộp đăng ký thành công" : "Lưu bản nháp thành công",
        text: status === "PENDING" 
          ? "Hồ sơ đăng ký của bạn đã được chuyển sang trạng thái chờ duyệt và khóa chỉnh sửa."
          : "Bản nháp đã được lưu. Bạn vẫn có thể tiếp tục chỉnh sửa trước khi nộp.",
        confirmButtonColor: "#4f46e5"
      });

      // Reload admin view to sync
      loadAdminRegistrations();
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Lưu thất bại",
        text: err.message || "Không thể lưu thông tin đăng ký",
        confirmButtonColor: "#4f46e5"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const confirmSubmit = () => {
    Swal.fire({
      title: "Xác nhận nộp đăng ký?",
      text: "Sau khi nộp, bạn sẽ KHÔNG THỂ thay đổi thông tin bản đăng ký này nữa. Hệ thống sẽ khóa tương tác hồ sơ.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Nộp ngay",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#4f46e5",
      cancelButtonColor: "#64748b"
    }).then((result) => {
      if (result.isConfirmed) {
        handleSave("PENDING");
      }
    });
  };

  const handleApproveAction = async (registrationId: string, status: "APPROVED" | "REJECTED") => {
    const actionText = status === "APPROVED" ? "Duyệt" : "Từ chối";
    Swal.fire({
      title: `Xác nhận ${actionText}?`,
      text: `Bạn có chắc chắn muốn ${actionText.toLowerCase()} hồ sơ đăng ký này?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: `Đồng ý`,
      cancelButtonText: "Hủy",
      confirmButtonColor: status === "APPROVED" ? "#10b981" : "#ef4444",
      cancelButtonColor: "#64748b"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await apiCall("APPROVE_THI_DUA_REGISTRATION", { registrationId, status });
          
          Swal.fire({
            icon: "success",
            title: `Đã ${actionText}`,
            text: `Đã cập nhật trạng thái hồ sơ thành ${status === "APPROVED" ? "Đã duyệt" : "Từ chối"}.`,
            confirmButtonColor: "#4f46e5"
          });
          
          // Refresh list
          loadAdminRegistrations();
        } catch (err: any) {
          Swal.fire({
            icon: "error",
            title: "Lỗi thực hiện",
            text: err.message || "Không thể cập nhật trạng thái hồ sơ",
            confirmButtonColor: "#4f46e5"
          });
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-600 font-medium">Đang tải phân hệ Thi đua Khen thưởng...</p>
      </div>
    );
  }

  const isFormLocked = registration.status === "PENDING" || registration.status === "APPROVED";
  const userRoleLower = user?.role.toLowerCase() || "";
  const isAdminOrLeader = ["admin", "principal", "teamleader"].includes(userRoleLower);

  // Administrative filtered data
  const filteredRegs = allRegistrations.filter(r => {
    const uMatch = r.userName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                   r.userId?.toLowerCase().includes(searchTerm.toLowerCase());
    const sMatch = statusFilter === "ALL" || r.status === statusFilter;
    return uMatch && sMatch;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Thi đua Khen thưởng viên chức
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Đăng ký và xét duyệt danh hiệu thi đua, hình thức khen thưởng năm học {activeYear - 1}-{activeYear}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-indigo-50/50 border border-indigo-100 rounded-lg px-4 py-2 text-indigo-700 text-xs font-bold">
          <Calendar size={14} />
          <span>Năm học hiện tại: {activeYear - 1}-{activeYear}</span>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="border-b border-slate-200">
        <div className="flex gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab("register")}
            className={clsx(
              "px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2.5 whitespace-nowrap",
              activeTab === "register"
                ? "border-indigo-600 text-indigo-600 font-extrabold bg-indigo-50/20"
                : "border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/50"
            )}
          >
            <FileText size={16} />
            Đăng ký thi đua cá nhân
          </button>
          
          <button
            onClick={() => setActiveTab("history")}
            className={clsx(
              "px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2.5 whitespace-nowrap",
              activeTab === "history"
                ? "border-indigo-600 text-indigo-600 font-extrabold bg-indigo-50/20"
                : "border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/50"
            )}
          >
            <History size={16} />
            Lịch sử danh hiệu ({history.length})
          </button>

          {isAdminOrLeader && (
            <button
              onClick={() => setActiveTab("approve")}
              className={clsx(
                "px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2.5 whitespace-nowrap relative",
                activeTab === "approve"
                  ? "border-indigo-600 text-indigo-600 font-extrabold bg-indigo-50/20"
                  : "border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/50"
              )}
            >
              <Users size={16} />
              Xét duyệt thi đua
              {allRegistrations.filter(r => r.status === "PENDING").length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-[10px] font-black bg-red-500 text-white rounded-full animate-pulse">
                  {allRegistrations.filter(r => r.status === "PENDING").length}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Tab 1: Registration Form */}
      {activeTab === "register" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left/Middle Column: Form Controls */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Status Alert Banner */}
            {registration.status === "PENDING" && (
              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl flex items-start gap-3">
                <Clock className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <h3 className="font-extrabold text-amber-900 text-sm">Hồ sơ chờ phê duyệt</h3>
                  <p className="text-amber-700 text-xs mt-1">
                    Bản đăng ký thi đua đã được gửi đi duyệt. Hiện hồ sơ ở trạng thái khóa tương tác. Vui lòng đợi Hội đồng thi đua ban giám hiệu thông qua.
                  </p>
                </div>
              </div>
            )}
            {registration.status === "APPROVED" && (
              <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-xl flex items-start gap-3">
                <FileCheck className="text-emerald-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <h3 className="font-extrabold text-emerald-900 text-sm">Đăng ký được phê duyệt thành công!</h3>
                  <p className="text-emerald-700 text-xs mt-1">
                    Hội đồng Thi đua đã duyệt thông qua danh hiệu đăng ký của bạn. Thành tích đã được tự động ghi nhận vào Lịch sử thi đua cá nhân.
                  </p>
                </div>
              </div>
            )}
            {registration.status === "REJECTED" && (
              <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-xl flex items-start gap-3">
                <XCircle className="text-rose-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <h3 className="font-extrabold text-rose-900 text-sm">Hồ sơ bị từ chối phê duyệt</h3>
                  <p className="text-rose-700 text-xs mt-1">
                    Bản đăng ký của bạn không được ban thi đua phê duyệt. Bạn vẫn có thể cập nhật các nội dung điều kiện và lưu bản nháp/gửi lại.
                  </p>
                </div>
              </div>
            )}

            {/* Box 1: General Work Settings */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Award size={18} className="text-indigo-600" />
                Thông tin công tác & Đánh giá công việc
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Số tháng làm việc thực tế</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    disabled={isFormLocked}
                    value={registration.work_months}
                    onChange={(e) => handleInputChange("work_months", parseInt(e.target.value) || 0)}
                    className="block w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-50 disabled:text-slate-400 font-semibold"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Thời gian làm việc tối thiểu xét thi đua là 6 tháng</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Số tháng nghỉ việc</label>
                  <input
                    type="number"
                    min={0}
                    max={12}
                    disabled={isFormLocked}
                    value={registration.leave_months}
                    onChange={(e) => handleInputChange("leave_months", parseInt(e.target.value) || 0)}
                    className="block w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-50 disabled:text-slate-400 font-semibold"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Không xét danh hiệu thi đua nếu nghỉ từ 3 tháng trở lên</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Đánh giá viên chức hiện tại</label>
                  <select
                    disabled={isFormLocked}
                    value={registration.current_job_rating}
                    onChange={(e) => handleInputChange("current_job_rating", e.target.value)}
                    className="block w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-50 disabled:text-slate-400 font-bold text-indigo-700"
                  >
                    <option value="Xuất sắc">Hoàn thành xuất sắc nhiệm vụ</option>
                    <option value="Tốt">Hoàn thành tốt nhiệm vụ</option>
                    <option value="Khá">Hoàn thành nhiệm vụ (Khá)</option>
                    <option value="Trung bình">Không hoàn thành nhiệm vụ</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-slate-50 rounded-lg w-full select-none transition-colors">
                    <input
                      type="checkbox"
                      disabled={isFormLocked}
                      checked={registration.is_disciplined}
                      onChange={(e) => handleInputChange("is_disciplined", e.target.checked)}
                      className="w-5 h-5 border-slate-300 rounded text-rose-600 focus:ring-rose-500 disabled:opacity-50"
                    />
                    <div>
                      <span className="block text-xs font-bold text-slate-800">Bị kỷ luật trong năm học</span>
                      <span className="text-[10px] text-rose-500 font-semibold">Tích chọn nếu có kỷ luật từ khiển trách trở lên</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Box 2: Initiatives Topics Info */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <FileText size={18} className="text-teal-600" />
                Đề tài khoa học & Sáng kiến kinh nghiệm
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 border border-slate-100 rounded-xl bg-slate-50/45 space-y-3">
                  <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Cấp cơ sở (Trường/Quận/Huyện)</h3>
                  
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={isFormLocked}
                      checked={registration.has_initiative}
                      onChange={(e) => handleInputChange("has_initiative", e.target.checked)}
                      className="mt-0.5 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <div>
                      <span className="block text-xs font-bold text-slate-800">Có sáng kiến cơ sở</span>
                      <span className="text-[10px] text-slate-400">Được hội đồng khoa học nhà trường ghi nhận</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={isFormLocked}
                      checked={registration.has_topic}
                      onChange={(e) => handleInputChange("has_topic", e.target.checked)}
                      className="mt-0.5 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <div>
                      <span className="block text-xs font-bold text-slate-800">Có đề tài khoa học cơ sở</span>
                      <span className="text-[10px] text-slate-400">Đã nghiệm thu đạt yêu cầu</span>
                    </div>
                  </label>
                </div>

                <div className="p-3 border border-slate-100 rounded-xl bg-slate-50/45 space-y-3">
                  <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Cấp Bộ / Tỉnh / Thành phố</h3>
                  
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={isFormLocked}
                      checked={registration.has_province_initiative}
                      onChange={(e) => handleInputChange("has_province_initiative", e.target.checked)}
                      className="mt-0.5 w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                    />
                    <div>
                      <span className="block text-xs font-bold text-slate-800">Có sáng kiến cấp Bộ/Tỉnh</span>
                      <span className="text-[10px] text-slate-400">Được hội đồng cấp tỉnh/thành phố quyết định</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={isFormLocked}
                      checked={registration.has_province_topic}
                      onChange={(e) => handleInputChange("has_province_topic", e.target.checked)}
                      className="mt-0.5 w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                    />
                    <div>
                      <span className="block text-xs font-bold text-slate-800">Có đề tài nghiên cứu cấp Bộ/Tỉnh</span>
                      <span className="text-[10px] text-slate-400">Sản phẩm khoa học có quyết định nghiệm thu</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Box 3: Final Register Target */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-5">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                Mục tiêu đăng ký cá nhân
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Emulation Title Selected */}
                <div className="space-y-3">
                  <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <span>1. Danh hiệu Thi đua</span>
                    <span className="text-[10px] text-slate-400 font-normal normal-case">(Chọn 1 mục hợp lệ)</span>
                  </h3>
                  
                  <div className="space-y-2">
                    <label className="flex items-center gap-2.5 p-2 px-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer text-xs font-bold text-slate-700">
                      <input
                        type="radio"
                        disabled={isFormLocked}
                        name="selected_title"
                        checked={registration.selected_title === "Không đăng ký"}
                        onChange={() => handleInputChange("selected_title", "Không đăng ký")}
                        className="w-4 h-4 text-indigo-600"
                      />
                      <span>Không đăng ký danh hiệu</span>
                    </label>

                    <label className={clsx(
                      "flex items-center gap-2.5 p-2 px-3 border rounded-lg transition-colors text-xs font-bold",
                      !canLaoDongTienTien 
                        ? "opacity-50 cursor-not-allowed bg-slate-50 border-slate-200 text-slate-400"
                        : "hover:bg-slate-50 border-slate-200 text-slate-700 cursor-pointer"
                    )}>
                      <input
                        type="radio"
                        disabled={isFormLocked || !canLaoDongTienTien}
                        name="selected_title"
                        checked={registration.selected_title === "Lao động tiên tiến"}
                        onChange={() => handleInputChange("selected_title", "Lao động tiên tiến")}
                        className="w-4 h-4 text-indigo-600"
                      />
                      <span className="flex-1">Lao động tiên tiến</span>
                    </label>

                    <label className={clsx(
                      "flex items-center gap-2.5 p-2 px-3 border rounded-lg transition-colors text-xs font-bold",
                      !canChienSiThiDuaCoSo
                        ? "opacity-50 cursor-not-allowed bg-slate-50 border-slate-200 text-slate-400"
                        : "hover:bg-slate-50 border-slate-200 text-slate-700 cursor-pointer"
                    )}>
                      <input
                        type="radio"
                        disabled={isFormLocked || !canChienSiThiDuaCoSo}
                        name="selected_title"
                        checked={registration.selected_title === "Chiến sĩ thi đua cơ sở"}
                        onChange={() => handleInputChange("selected_title", "Chiến sĩ thi đua cơ sở")}
                        className="w-4 h-4 text-indigo-600"
                      />
                      <span className="flex-1">Chiến sĩ thi đua cơ sở</span>
                    </label>

                    <label className={clsx(
                      "flex items-center gap-2.5 p-2 px-3 border rounded-lg transition-colors text-xs font-bold",
                      !canChienSiThiDuaCapTinh
                        ? "opacity-50 cursor-not-allowed bg-slate-50 border-slate-200 text-slate-400"
                        : "hover:bg-slate-50 border-slate-200 text-slate-700 cursor-pointer"
                    )}>
                      <input
                        type="radio"
                        disabled={isFormLocked || !canChienSiThiDuaCapTinh}
                        name="selected_title"
                        checked={registration.selected_title === "Chiến sĩ thi đua cấp Bộ, ban, ngành, tỉnh"}
                        onChange={() => handleInputChange("selected_title", "Chiến sĩ thi đua cấp Bộ, ban, ngành, tỉnh")}
                        className="w-4 h-4 text-indigo-600"
                      />
                      <span className="flex-1">CSTĐ cấp Bộ, ban, ngành, tỉnh</span>
                    </label>
                  </div>
                </div>

                {/* Awards Selected */}
                <div className="space-y-3">
                  <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <span>2. Hình thức Khen thưởng</span>
                    <span className="text-[10px] text-slate-400 font-normal normal-case">(Chọn 1 mục hợp lệ)</span>
                  </h3>
                  
                  <div className="space-y-2">
                    <label className="flex items-center gap-2.5 p-2 px-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer text-xs font-bold text-slate-700">
                      <input
                        type="radio"
                        disabled={isFormLocked}
                        name="selected_award"
                        checked={registration.selected_award === "Không đăng ký"}
                        onChange={() => handleInputChange("selected_award", "Không đăng ký")}
                        className="w-4 h-4 text-indigo-600"
                      />
                      <span>Không đăng ký khen thưởng</span>
                    </label>

                    <label className={clsx(
                      "flex items-center gap-2.5 p-2 px-3 border rounded-lg transition-colors text-xs font-bold",
                      !canGiayKhen
                        ? "opacity-50 cursor-not-allowed bg-slate-50 border-slate-200 text-slate-400"
                        : "hover:bg-slate-50 border-slate-200 text-slate-700 cursor-pointer"
                    )}>
                      <input
                        type="radio"
                        disabled={isFormLocked || !canGiayKhen}
                        name="selected_award"
                        checked={registration.selected_award === "Giấy khen"}
                        onChange={() => handleInputChange("selected_award", "Giấy khen")}
                        className="w-4 h-4 text-indigo-600"
                      />
                      <span className="flex-1">Giấy khen</span>
                    </label>

                    <label className={clsx(
                      "flex items-center gap-2.5 p-2 px-3 border rounded-lg transition-colors text-xs font-bold",
                      !canBangKhen
                        ? "opacity-50 cursor-not-allowed bg-slate-50 border-slate-200 text-slate-400"
                        : "hover:bg-slate-50 border-slate-200 text-slate-700 cursor-pointer"
                    )}>
                      <input
                        type="radio"
                        disabled={isFormLocked || !canBangKhen}
                        name="selected_award"
                        checked={registration.selected_award === "Bằng khen của Bộ, ban, ngành, tỉnh"}
                        onChange={() => handleInputChange("selected_award", "Bằng khen của Bộ, ban, ngành, tỉnh")}
                        className="w-4 h-4 text-indigo-600"
                      />
                      <span className="flex-1">Bằng khen của Bộ, ban, ngành, tỉnh</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex flex-wrap justify-end gap-3 pt-4 border-t border-slate-100">
                {registration.status === "REJECTED" && (
                  <p className="mr-auto text-xs text-rose-500 font-extrabold flex items-center gap-1">
                    <ShieldAlert size={14} /> Trạng thái: Hồ sơ Đã bị Từ chối. Quý thầy cô có thể điều chỉnh và Đăng ký lại.
                  </p>
                )}
                
                {registration.status === "DRAFT" && (
                  <p className="mr-auto text-xs text-amber-500 font-bold flex items-center gap-1">
                    <AlertTriangle size={14} /> Bản đăng ký đang ở dạng bản nháp và chưa nộp. Thầy cô có thể chủ động chỉnh sửa.
                  </p>
                )}

                {!isFormLocked ? (
                  <>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handleSave("DRAFT")}
                      className="px-5 py-2 rounded-lg border border-slate-350 text-slate-750 hover:bg-slate-50 text-sm font-bold transition-all disabled:opacity-50"
                    >
                      {submitting ? "Đang xử lý..." : "Lưu nháp"}
                    </button>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={confirmSubmit}
                      className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-all shadow-sm disabled:opacity-50"
                    >
                      {submitting ? "Đang nộp..." : "Nộp đăng ký"}
                    </button>
                  </>
                ) : (
                  <div className="flex items-center gap-1 px-3 py-2 bg-slate-100 text-slate-500 rounded-lg text-sm font-bold">
                    <Lock size={16} />
                    <span>Hồ sơ đã khóa (Không thể chỉnh sửa)</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Rules Engine Checklist (Side Panel) */}
          <div className="space-y-6">
            
            {/* Box: Rules status */}
            <div className="bg-slate-900 text-white rounded-xl shadow-md p-5 space-y-4">
              <h2 className="text-sm font-black text-slate-100 uppercase tracking-wider pb-2 border-b border-white/10 flex items-center gap-2">
                <FileCheck size={16} className="text-indigo-400" />
                Cơ chế kiểm soát điều kiện (Rule Engine)
              </h2>

              <div className="space-y-3.5">
                
                {/* 1. Condition minimal */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>Điều kiện cứng tối thiểu</span>
                    {isMinimumRequirementMet ? (
                      <span className="text-emerald-400 px-1.5 py-0.5 bg-emerald-500/10 rounded font-black text-[10px]">ĐẠT</span>
                    ) : (
                      <span className="text-red-400 px-1.5 py-0.5 bg-red-500/10 rounded font-black text-[10px]">KHÔNG ĐẠT</span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 space-y-1 pl-1">
                    <div className="flex items-center gap-1.5">
                      <span className={clsx("w-1.5 h-1.5 rounded-full", registration.work_months >= 6 ? "bg-emerald-500" : "bg-red-500")} />
                      <span>Số tháng làm việc ≥ 6 tháng ({registration.work_months} thg)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={clsx("w-1.5 h-1.5 rounded-full", !registration.is_disciplined ? "bg-emerald-500" : "bg-red-500")} />
                      <span>Không bị kỷ luật ({registration.is_disciplined ? "Bị kỷ luật" : "Không"})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={clsx("w-1.5 h-1.5 rounded-full", registration.leave_months < 3 ? "bg-emerald-500" : "bg-red-500")} />
                      <span>Số tháng nghỉ việc &lt; 3 tháng ({registration.leave_months} thg)</span>
                    </div>
                  </div>
                </div>

                {/* 2. Streak checks */}
                <div className="space-y-1 pb-2 border-b border-white/10">
                  <div className="text-xs font-bold text-slate-300">Quá khứ đạt CSTĐCS liên tiếp</div>
                  <div className="text-[11px] text-slate-400 space-y-0.5 pl-1">
                    <div className="flex items-center justify-between">
                      <span>Đạt 3 năm liên tiếp:</span>
                      <span className={clsx("font-extrabold", hasConsecutiveCstdcs3 ? "text-emerald-400" : "text-slate-400")}>
                        {hasConsecutiveCstdcs3 ? "Đủ tinh hoa" : "Chưa đủ"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Đạt 2 năm liên tiếp:</span>
                      <span className={clsx("font-extrabold", hasConsecutiveCstdcs2 ? "text-emerald-400" : "text-slate-400")}>
                        {hasConsecutiveCstdcs2 ? "Đủ điều kiện" : "Chưa đủ"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Titles eligibility summary */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-widest text-[10px]">Gợi ý danh hiệu đề xuất:</div>
                  <div className="space-y-1.5">
                    
                    <div className="flex items-center justify-between text-xs p-2 rounded bg-white/5 border border-white/10">
                      <span className="font-semibold text-slate-200">Lao động tiên tiến</span>
                      <span className={clsx("text-[10px] font-extrabold px-2 py-0.5 rounded shadow-sm", 
                        canLaoDongTienTien ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400")}>
                        {canLaoDongTienTien ? "ĐỦ ĐIỀU KIỆN" : "KHÔNG ĐỦ"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs p-2 rounded bg-white/5 border border-white/10">
                      <span className="font-semibold text-slate-200">Chiến sĩ thi đua CS</span>
                      <span className={clsx("text-[10px] font-extrabold px-2 py-0.5 rounded shadow-sm", 
                        canChienSiThiDuaCoSo ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400")}>
                        {canChienSiThiDuaCoSo ? "ĐỦ ĐIỀU KIỆN" : "KHÔNG ĐỦ"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs p-2 rounded bg-white/5 border border-white/10">
                      <span className="font-semibold text-slate-200">CSTĐ cấp Bộ/Tỉnh</span>
                      <span className={clsx("text-[10px] font-extrabold px-2 py-0.5 rounded shadow-sm", 
                        canChienSiThiDuaCapTinh ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400")}>
                        {canChienSiThiDuaCapTinh ? "ĐỦ ĐIỀU KIỆN" : "KHÔNG ĐỦ"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs p-2 rounded bg-white/5 border border-white/10">
                      <span className="font-semibold text-slate-200">Giấy khen</span>
                      <span className={clsx("text-[10px] font-extrabold px-2 py-0.5 rounded shadow-sm", 
                        canGiayKhen ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400")}>
                        {canGiayKhen ? "ĐỦ ĐIỀU KIỆN" : "KHÔNG ĐỦ"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs p-2 rounded bg-white/5 border border-white/10">
                      <span className="font-semibold text-slate-200">Bằng khen của Bộ/Tỉnh</span>
                      <span className={clsx("text-[10px] font-extrabold px-2 py-0.5 rounded shadow-sm", 
                        canBangKhen ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400")}>
                        {canBangKhen ? "ĐỦ ĐIỀU KIỆN" : "KHÔNG ĐỦ"}
                      </span>
                    </div>

                  </div>
                </div>

              </div>
            </div>

            {/* Practical Guide Box */}
            <div className="bg-white rounded-xl border border-slate-250 p-5 space-y-3.5">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                <HelpCircle size={16} className="text-indigo-600" />
                Hướng dẫn tiêu chuẩn xét duyệt
              </h3>
              <div className="text-xs text-slate-600 space-y-2.5">
                <p>
                  🎖️ <strong>Lao động tiên tiến:</strong> Điều kiện cứng đạt + Đánh giá công việc đạt "Tốt" hoặc "Xuất sắc".
                </p>
                <p>
                  🚀 <strong>Chiến sĩ thi đua cơ sở:</strong> Đạt Lao động tiên tiến + (Đánh giá Xuất sắc HOẶC có Sáng kiến cơ sở / Đề tài cơ sở).
                </p>
                <p>
                  🏆 <strong>CSTĐ cấp Bộ/Tỉnh:</strong> 3 năm liên tục đạt Chiến sĩ thi đua cơ sở + (Có sáng kiến/đề tài cấp Bộ/Tỉnh).
                </p>
                <p>
                  🌟 <strong>Bằng khen cấp Bộ/Tỉnh:</strong> Đánh giá Tốt/Xuất sắc + 2 năm liên tiếp đạt Chiến sĩ thi đua cơ sở.
                </p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Tab 2: Emulation History */}
      {activeTab === "history" && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Lịch sử tích lũy danh thi báu viên chức</h2>
              <p className="text-xs text-slate-500 mt-1">Sản phẩm danh hiệu đạt được qua các năm tự động tích hợp từ hồ sơ đã duyệt</p>
            </div>
            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-extrabold text-xs rounded-full border border-indigo-100">
              Tổng số đạt được: {history.length}
            </span>
          </div>

          {history.length === 0 ? (
            <div className="text-center py-10 text-slate-400 space-y-2">
              <History size={40} className="mx-auto text-slate-300" />
              <p className="font-semibold text-slate-500">Chưa ghi nhận lịch sử thi đua nào.</p>
              <p className="text-xs max-w-sm mx-auto text-slate-400">
                Sau khi đăng ký thi đua năm nay được phê duyệt hoặc Admin thực hiện nạp hồ sơ, thông tin sẽ hiển thị đầy đủ tại đây.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-[450px]">
              <table className="w-full text-left border-collapse table-fixed">
                <colgroup>
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '25%' }} />
                  <col style={{ width: '25%' }} />
                  <col style={{ width: '25%' }} />
                </colgroup>
                <thead className="bg-[#f8fafc] text-slate-700 text-xs font-bold border-b border-slate-200 sticky top-0 z-10">
                  <tr>
                    <th className="p-3 text-center">STT</th>
                    <th className="p-3 text-center">Năm học</th>
                    <th className="p-3 text-left">Đánh giá công việc</th>
                    <th className="p-3 text-left">Danh hiệu đạt được</th>
                    <th className="p-3 text-left">Khen thưởng đạt được</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
                  {history.map((record, index) => (
                    <tr key={record.id || index} className="hover:bg-slate-50/55 transition-colors">
                      <td className="p-3 text-center font-bold text-slate-500">{index + 1}</td>
                      <td className="p-3 text-center font-extrabold text-slate-900 bg-slate-50/20">{record.year - 1}-{record.year}</td>
                      <td className="p-3 text-left font-semibold text-indigo-600">{record.job_rating}</td>
                      <td className="p-3 text-left">
                        <span className="px-2.5 py-1 text-xs font-extrabold bg-[#ebf4ff] border border-blue-100 text-indigo-800 rounded">
                          {record.title_achieved}
                        </span>
                      </td>
                      <td className="p-3 text-left">
                        <span className="px-2.5 py-1 text-xs font-extrabold bg-[#f0fdf4] border border-emerald-100 text-emerald-800 rounded">
                          {record.award_achieved}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Administrative Approvals View */}
      {activeTab === "approve" && isAdminOrLeader && (
        <div className="space-y-4">
          
          {/* Controls Bar */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative w-full md:max-w-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Tìm GV bằng tên hoặc ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-9 pr-3 py-1.8 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 font-semibold"
              />
            </div>

            {/* Filter Toggle Buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setStatusFilter("ALL")}
                className={clsx(
                  "px-3 py-1 rounded text-xs font-bold transition-all border",
                  statusFilter === "ALL" 
                    ? "bg-slate-900 border-slate-900 text-white" 
                    : "border-slate-300 text-slate-600 hover:bg-slate-50"
                )}
              >
                Tất cả ({allRegistrations.length})
              </button>
              
              <button
                onClick={() => setStatusFilter("PENDING")}
                className={clsx(
                  "px-3 py-1 rounded text-xs font-bold transition-all border",
                  statusFilter === "PENDING" 
                    ? "bg-amber-600 border-amber-600 text-white" 
                    : "border-slate-300 text-slate-600 hover:bg-slate-50"
                )}
              >
                Chờ duyệt ({allRegistrations.filter(r => r.status === "PENDING").length})
              </button>

              <button
                onClick={() => setStatusFilter("APPROVED")}
                className={clsx(
                  "px-3 py-1 rounded text-xs font-bold transition-all border",
                  statusFilter === "APPROVED" 
                    ? "bg-emerald-600 border-emerald-600 text-white" 
                    : "border-slate-300 text-slate-600 hover:bg-slate-50"
                )}
              >
                Đã duyệt ({allRegistrations.filter(r => r.status === "APPROVED").length})
              </button>

              <button
                onClick={() => setStatusFilter("REJECTED")}
                className={clsx(
                  "px-3 py-1 rounded text-xs font-bold transition-all border",
                  statusFilter === "REJECTED" 
                    ? "bg-rose-600 border-rose-600 text-white" 
                    : "border-slate-300 text-slate-600 hover:bg-slate-50"
                )}
              >
                Từ chối ({allRegistrations.filter(r => r.status === "REJECTED").length})
              </button>

              <button
                onClick={() => setStatusFilter("DRAFT")}
                className={clsx(
                  "px-3 py-1 rounded text-xs font-bold transition-all border",
                  statusFilter === "DRAFT" 
                    ? "bg-slate-600 border-slate-600 text-white" 
                    : "border-slate-300 text-slate-600 hover:bg-slate-50"
                )}
              >
                Bản nháp ({allRegistrations.filter(r => r.status === "DRAFT").length})
              </button>
            </div>
          </div>

          {/* List/Table of submissions */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {adminLoading ? (
              <div className="text-center py-10 text-slate-500 font-bold">Đang truy vấn hồ sơ...</div>
            ) : filteredRegs.length === 0 ? (
              <div className="text-center py-10 text-slate-400">Không tìm thấy bản đăng ký thi đua nào phù hợp bộ lọc.</div>
            ) : (
              <div className="overflow-x-auto relative max-h-[500px]">
                <table className="w-full text-left border-collapse table-fixed">
                  <colgroup>
                    <col style={{ width: '180px' }} />
                    <col style={{ width: '110px' }} />
                    <col style={{ width: '150px' }} />
                    <col style={{ width: '220px' }} />
                    <col style={{ width: '220px' }} />
                    <col style={{ width: '120px' }} />
                    <col style={{ width: '200px' }} />
                  </colgroup>
                  <thead className="bg-[#f8fafc] text-slate-700 text-xs font-bold border-b border-slate-200 sticky top-0 z-20">
                    <tr>
                      <th className="p-3 sticky left-0 bg-[#f8fafc] z-30">Giáo viên</th>
                      <th className="p-3">Tổ/Nhóm</th>
                      <th className="p-3">Đánh giá chung</th>
                      <th className="p-3">Danh hiệu đăng ký</th>
                      <th className="p-3">Hình thức khen thưởng</th>
                      <th className="p-3 text-center">Trạng thái</th>
                      <th className="p-3 text-center sticky right-0 bg-[#f8fafc] z-30">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                    {filteredRegs.map((reg) => {
                      const isUnreviewed = reg.status === "PENDING";
                      return (
                        <tr key={reg.registrationId} className="hover:bg-[#ebf4ff]/20 transition-colors">
                          {/* Left sticky column */}
                          <td className="p-3 font-semibold text-slate-900 sticky left-0 bg-white group-hover:bg-slate-55 shadow-[1px_0_4px_rgba(0,0,0,0.03)] truncate">
                            {reg.userName || "Mã GV: " + reg.userId}
                          </td>
                          <td className="p-3 font-medium text-slate-500">{reg.userTeam || "MATH"}</td>
                          <td className="p-3 font-bold text-slate-800">{reg.current_job_rating}</td>
                          <td className="p-3">
                            <span className="text-slate-800 font-semibold">{reg.selected_title}</span>
                          </td>
                          <td className="p-3">
                            <span className="text-slate-800 font-semibold">{reg.selected_award}</span>
                          </td>
                          <td className="p-3 text-center">
                            <span className={clsx(
                              "px-2 py-0.5 text-[10px] font-black rounded-full border",
                              reg.status === "APPROVED"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : reg.status === "PENDING"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : reg.status === "REJECTED"
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : "bg-slate-50 text-slate-600 border-slate-200"
                            )}>
                              {reg.status}
                            </span>
                          </td>
                          {/* Right sticky column */}
                          <td className="p-3 text-center sticky right-0 bg-white group-hover:bg-slate-55 shadow-[-1px_0_4px_rgba(0,0,0,0.03)]">
                            {isUnreviewed ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleApproveAction(reg.registrationId!, "APPROVED")}
                                  className="p-1 px-2.5 bg-emerald-600 text-white font-extrabold text-xs rounded shadow-sm hover:bg-emerald-700 transition-colors flex items-center gap-0.5"
                                >
                                  <ThumbsUp size={11} /> Duyệt
                                </button>
                                <button
                                  onClick={() => handleApproveAction(reg.registrationId!, "REJECTED")}
                                  className="p-1 px-2.5 bg-rose-600 text-white font-extrabold text-xs rounded shadow-sm hover:bg-rose-700 transition-colors flex items-center gap-0.5"
                                >
                                  <ThumbsDown size={11} /> Từ chối
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] font-semibold text-slate-400">Đã chốt duyệt</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
