import React, { useEffect, useState } from "react";
import { apiCall } from "../services/api";
import { Search, Filter, Award, CheckSquare, MessageSquare } from "lucide-react";
import { translateRole } from "../utils/translate";

interface AchievementItem {
  id: number;
  userId: number;
  userName: string;
  userTeam: string;
  year: string;
  quarter: number;
  classification: string;
  userInput: string;
  leaderInput: string;
  timestamp: string;
}

export const AchievementsSummary: React.FC = () => {
  const [achievements, setAchievements] = useState<AchievementItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchName, setSearchName] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("");
  const [selectedQuarter, setSelectedQuarter] = useState("");

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const data = await apiCall("getAchievementsSummary");
        if (data && Array.isArray(data)) {
          setAchievements(data);
        }
      } catch (error) {
        console.error("Lỗi khi tải tổng hợp thành tích:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  // Get unique teams for dropdown filter
  const teamsList = Array.from(new Set(achievements.map((item) => item.userTeam))).filter(Boolean);

  // Filter logic
  const filteredAchievements = achievements.filter((item) => {
    const matchName = item.userName.toLowerCase().includes(searchName.toLowerCase());
    const matchTeam = selectedTeam === "" || item.userTeam === selectedTeam;
    const matchQuarter = selectedQuarter === "" || String(item.quarter) === selectedQuarter;
    return matchName && matchTeam && matchQuarter;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-slate-600 font-medium">Đang tải báo cáo tổng hợp thành tích...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Tổng hợp thành tích viên chức</h1>
        <p className="text-slate-500">
          Xem và kết xuất báo cáo thành tích nổi bật của viên chức theo từng Quý
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
          <Filter size={16} className="text-indigo-600" />
          <span>Bộ lọc dữ liệu:</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full md:w-auto md:flex-1 max-w-4xl">
          {/* Filter by name */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo họ tên..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-medium"
            />
          </div>

          {/* Filter by Team */}
          <div>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-medium"
            >
              <option value="">-- Tất cả Tổ chuyên môn --</option>
              {teamsList.map((team) => (
                <option key={team} value={team}>
                  Tổ {team}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Quarter */}
          <div>
            <select
              value={selectedQuarter}
              onChange={(e) => setSelectedQuarter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-medium"
            >
              <option value="">-- Tất cả các Quý --</option>
              <option value="1">Quý 1</option>
              <option value="2">Quý 2</option>
              <option value="3">Quý 3</option>
              <option value="4">Quý 4</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 font-semibold text-sm text-slate-900">Họ và tên</th>
                <th className="px-6 py-4 font-semibold text-sm text-slate-900 text-center">Tổ chuyên môn</th>
                <th className="px-6 py-4 font-semibold text-sm text-slate-900 text-center">Quý / Năm</th>
                <th className="px-6 py-4 font-semibold text-sm text-slate-900 text-center">Xếp loại</th>
                <th className="px-6 py-4 font-semibold text-sm text-slate-900 w-1/4">Thành tích tự khai</th>
                <th className="px-6 py-4 font-semibold text-sm text-slate-900 w-1/4">Tổ trưởng nhận xét/sửa đổi</th>
              </tr>
            </thead>
            <tbody>
              {filteredAchievements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-500 font-medium">
                    Không tìm thấy thành tích nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredAchievements.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-semibold text-sm text-slate-800">
                      {item.userName}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 text-center font-medium">
                      Tổ {item.userTeam}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 text-center font-bold">
                      Quý {item.quarter} / {item.year}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {item.classification ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          <Award size={12} />
                          {item.classification}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {item.userInput ? (
                        <div className="flex gap-2">
                          <CheckSquare size={14} className="text-slate-400 shrink-0 mt-0.5" />
                          <p className="whitespace-pre-wrap leading-relaxed">{item.userInput}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Không kê khai</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {item.leaderInput ? (
                        <div className="flex gap-2">
                          <MessageSquare size={14} className="text-indigo-400 shrink-0 mt-0.5" />
                          <p className="whitespace-pre-wrap leading-relaxed text-indigo-900 bg-indigo-50/30 p-2 rounded-lg border border-indigo-100/30">
                            {item.leaderInput}
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Chưa nhận xét</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
