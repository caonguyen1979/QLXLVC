import React, { useEffect, useState } from "react";
import { useAuthStore } from "../store/authStore";
import { apiCall } from "../services/api";
import Swal from "sweetalert2";
import { Save, Edit } from "lucide-react";

import { translateRole } from "../utils/translate";

export const TeamEvaluation: React.FC = () => {
  const { user } = useAuthStore();
  const [teamData, setTeamData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState({ year: "2023-2024", quarter: "1" });
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [template, setTemplate] = useState<any[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const conf = await apiCall("getConfig");
        const currentConfig = {
          year: conf.ACTIVE_YEAR || "2023-2024",
          quarter: conf.ACTIVE_QUARTER || "1",
        };
        setConfig(currentConfig);

        const data = await apiCall("getTeamData", currentConfig);
        setTeamData(data);
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu tổ", error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [user]);

  const handleSelectUser = async (member: any) => {
    setLoading(true);
    try {
      const isNV = member.role.toLowerCase() === "staff" || member.teamId === "VP";
      const type = isNV ? "NV" : "GV";
      const res = await apiCall("getEvaluationTemplate", { type });
      setTemplate(res);
      setSelectedUser(member);

      // Pre-fill scores
      const userEvals = teamData.evaluations[member.id] || {};
      const initialScores: Record<string, number> = {};
      res.forEach((item: any) => {
        if (userEvals[item.id] && userEvals[item.id].tlScore !== "") {
          initialScores[item.id] = Number(userEvals[item.id].tlScore);
        } else if (userEvals[item.id] && userEvals[item.id].selfScore !== "") {
          initialScores[item.id] = Number(userEvals[item.id].selfScore); // Default to self score
        }
      });
      setScores(initialScores);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (id: string, value: string, maxScore: number) => {
    const num = parseInt(value, 10);
    if (!isNaN(num)) {
      if (num > maxScore) {
        Swal.fire({
          icon: 'warning',
          title: 'Vượt quá điểm tối đa',
          text: `Điểm tối đa cho tiêu chí này là ${maxScore}`,
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000
        });
        // Set to max score instead of returning
        setScores((prev) => ({ ...prev, [id]: maxScore }));
        return;
      }
      setScores((prev) => ({ ...prev, [id]: num }));
    } else if (value === "") {
      const newScores = { ...scores };
      delete newScores[id];
      setScores(newScores);
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      let totalScore = 0;
      const scoresArray = template.map((item) => {
        const score = scores[item.id] || 0;
        totalScore += score;
        return {
          criteriaId: item.id,
          score: score,
          type: "teamLeaderScore",
        };
      });

      // Add total score
      scoresArray.push({
        criteriaId: "TOTAL",
        score: totalScore,
        type: "teamLeaderScore",
      });

      const isNV = selectedUser.role.toLowerCase() === "staff" || selectedUser.teamId === "VP";
      await apiCall("submitEvaluation", {
        userId: selectedUser.id,
        year: config.year,
        quarter: config.quarter,
        scores: scoresArray,
        type: isNV ? "NV" : "GV",
      });

      Swal.fire({
        icon: "success",
        title: "Đã lưu",
        text: "Đánh giá của tổ trưởng đã được lưu.",
        confirmButtonColor: "#4f46e5",
      });
      
      // Refresh team data
      const data = await apiCall("getTeamData", config);
      setTeamData(data);
      setSelectedUser(null);
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: error.message || "Lưu đánh giá thất bại",
        confirmButtonColor: "#4f46e5",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading && !teamData) return <div>Đang tải dữ liệu...</div>;

  if (selectedUser) {
    const groupedTemplate = template.reduce((acc: any, item: any) => {
      if (!acc[item.section]) acc[item.section] = [];
      acc[item.section].push(item);
      return acc;
    }, {});

    const currentTotal = template.reduce((sum, item) => sum + (scores[item.id] || 0), 0);
    const maxTotal = template.reduce((sum, item) => {
      let maxScoreVal = Number(item.maxScore);
      if (!maxScoreVal && !isNaN(Number(item.description)) && item.description !== "") {
        maxScoreVal = Number(item.description);
      }
      return sum + (maxScoreVal || 0);
    }, 0);
    const userEvals = teamData.evaluations[selectedUser.id] || {};

    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <button 
              onClick={() => setSelectedUser(null)}
              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium mb-2 inline-block"
            >
              &larr; Quay lại danh sách
            </button>
            <h1 className="text-2xl font-bold text-slate-900">Đánh giá: {selectedUser.name}</h1>
            <p className="text-slate-500">Quý {config.quarter}, {config.year}</p>
          </div>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors font-medium text-sm"
          >
            <Save size={16} />
            {saving ? "Đang lưu..." : "Lưu đánh giá"}
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 font-semibold text-sm text-slate-900 w-1/2">Nội dung đánh giá</th>
                  <th className="px-6 py-4 font-semibold text-sm text-slate-900 w-24 text-center">Điểm chuẩn</th>
                  <th className="px-6 py-4 font-semibold text-sm text-slate-900 w-24 text-center">Tự chấm</th>
                  <th className="px-6 py-4 font-semibold text-sm text-slate-900 w-32 text-center">Tổ trưởng chấm</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(groupedTemplate).map(([section, items]: [string, any]) => (
                  <React.Fragment key={section}>
                    <tr className="bg-slate-100/50 border-b border-slate-200">
                      <td colSpan={4} className="px-6 py-4 font-bold text-sm text-slate-800">{section}</td>
                    </tr>
                    {items.map((item: any) => {
                      let maxScoreVal = Number(item.maxScore);
                      let displayDesc = item.description;
                      if (!maxScoreVal && !isNaN(Number(item.description)) && item.description !== "") {
                        maxScoreVal = Number(item.description);
                        displayDesc = "";
                      }

                      return (
                        <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 align-top">
                            <div className="text-sm font-medium text-slate-800 whitespace-pre-wrap leading-relaxed">
                              {item.criteria}
                            </div>
                            {displayDesc && (
                              <div className="text-sm text-slate-500 mt-2 whitespace-pre-wrap leading-relaxed">
                                {displayDesc}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-slate-600 text-center align-top">
                            {maxScoreVal}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-slate-600 text-center align-top">
                            {userEvals[item.id]?.selfScore || '-'}
                          </td>
                          <td className="px-6 py-4 align-top">
                            <div className="flex justify-center">
                              <input
                                type="number"
                                min="0"
                                max={maxScoreVal}
                                value={scores[item.id] !== undefined ? scores[item.id] : ""}
                                onChange={(e) => handleScoreChange(item.id, e.target.value, maxScoreVal)}
                                className="w-24 text-center px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 text-sm font-medium text-slate-900 transition-shadow"
                                placeholder="0"
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
                <tr className="bg-indigo-50/50 border-t-2 border-indigo-100">
                  <td className="px-6 py-5 font-bold text-sm text-indigo-900 text-right">Tổng điểm:</td>
                  <td className="px-6 py-5 font-bold text-sm text-indigo-900 text-center">{maxTotal}</td>
                  <td className="px-6 py-5 font-bold text-sm text-indigo-900 text-center">
                    {userEvals['TOTAL']?.selfScore || '-'}
                  </td>
                  <td className="px-6 py-5 font-bold text-lg text-indigo-700 text-center">{currentTotal}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Đánh giá tổ/nhóm</h1>
        <p className="text-slate-500">
          Quản lý đánh giá của các thành viên trong tổ. Quý {config.quarter}, {config.year}
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 font-semibold text-sm text-slate-900">Họ và tên</th>
                <th className="p-4 font-semibold text-sm text-slate-900">Vai trò</th>
                <th className="p-4 font-semibold text-sm text-slate-900 text-center">Trạng thái</th>
                <th className="p-4 font-semibold text-sm text-slate-900 text-center">Điểm tự chấm</th>
                <th className="p-4 font-semibold text-sm text-slate-900 text-center">Điểm tổ trưởng</th>
                <th className="p-4 font-semibold text-sm text-slate-900 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {teamData?.teamMembers.map((member: any) => {
                const evals = teamData.evaluations[member.id] || {};
                const hasSelfScore = evals['TOTAL'] && evals['TOTAL'].selfScore !== "";
                const hasTlScore = evals['TOTAL'] && evals['TOTAL'].tlScore !== "";
                
                return (
                  <tr key={member.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-4 text-sm text-slate-700 font-medium">{member.name}</td>
                    <td className="p-4 text-sm text-slate-700">{translateRole(member.role)}</td>
                    <td className="p-4 text-sm text-center">
                      {hasTlScore ? (
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">Đã duyệt</span>
                      ) : hasSelfScore ? (
                        <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">Chờ duyệt</span>
                      ) : (
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">Chưa nộp</span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-slate-700 text-center font-medium">
                      {evals['TOTAL']?.selfScore || '-'}
                    </td>
                    <td className="p-4 text-sm text-indigo-600 text-center font-bold">
                      {evals['TOTAL']?.tlScore || '-'}
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => handleSelectUser(member)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-sm font-medium transition-colors"
                      >
                        <Edit size={14} />
                        Đánh giá
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
