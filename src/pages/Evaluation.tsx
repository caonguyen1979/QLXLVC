import React, { useEffect, useState } from "react";
import { useAuthStore } from "../store/authStore";
import { apiCall } from "../services/api";
import Swal from "sweetalert2";
import { Save } from "lucide-react";

export const Evaluation: React.FC = () => {
  const { user } = useAuthStore();
  const [template, setTemplate] = useState<any[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [config, setConfig] = useState({ year: "2023-2024", quarter: "1" });

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const conf = await apiCall("getConfig");
        setConfig({
          year: conf.ACTIVE_YEAR || "2023-2024",
          quarter: conf.ACTIVE_QUARTER || "1",
        });

        const isNV = user?.role.toLowerCase() === "staff" || user?.teamId === "VP";
        const type = isNV ? "NV" : "GV";
        const res = await apiCall("getEvaluationTemplate", { type });
        setTemplate(res);
      } catch (error) {
        console.error("Lỗi khi tải biểu mẫu", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplate();
  }, [user]);

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
          type: "selfScore",
        };
      });

      // Add total score
      scoresArray.push({
        criteriaId: "TOTAL",
        score: totalScore,
        type: "selfScore",
      });

      const isNV = user?.role.toLowerCase() === "staff" || user?.teamId === "VP";
      await apiCall("submitEvaluation", {
        userId: user?.id || user?.username,
        year: config.year,
        quarter: config.quarter,
        scores: scoresArray,
        type: isNV ? "NV" : "GV",
      });

      Swal.fire({
        icon: "success",
        title: "Đã lưu",
        text: "Đánh giá của bạn đã được nộp thành công.",
        confirmButtonColor: "#4f46e5",
      });
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

  if (loading) return <div>Đang tải biểu mẫu đánh giá...</div>;

  // Group by section
  const groupedTemplate = template.reduce((acc: any, item: any) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {});

  // Calculate current total
  const currentTotal = template.reduce((sum, item) => sum + (scores[item.id] || 0), 0);
  const maxTotal = template.reduce((sum, item) => sum + (Number(item.maxScore) || 0), 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tự đánh giá</h1>
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
                <th className="p-4 font-semibold text-sm text-slate-900 w-1/3">
                  Tiêu chí
                </th>
                <th className="p-4 font-semibold text-sm text-slate-900 w-1/3">
                  Mô tả
                </th>
                <th className="p-4 font-semibold text-sm text-slate-900 w-24 text-center">
                  Điểm tối đa
                </th>
                <th className="p-4 font-semibold text-sm text-slate-900 w-32 text-center">
                  Tự chấm
                </th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(groupedTemplate).map(
                ([section, items]: [string, any]) => (
                  <React.Fragment key={section}>
                    <tr className="bg-slate-100 border-b border-slate-200">
                      <td
                        colSpan={4}
                        className="p-3 font-bold text-sm text-slate-800"
                      >
                        {section}
                      </td>
                    </tr>
                    {items.map((item: any) => (
                      <tr
                        key={item.id}
                        className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                      >
                        <td className="p-4 text-sm text-slate-700 font-medium align-top">
                          {item.criteria}
                        </td>
                        <td className="p-4 text-xs text-slate-600 align-top">
                          {item.description}
                        </td>
                        <td className="p-4 text-sm text-slate-500 text-center align-top">
                          {item.maxScore}
                        </td>
                        <td className="p-4 align-top">
                          <input
                            type="number"
                            min="0"
                            max={item.maxScore}
                            value={scores[item.id] || ""}
                            onChange={(e) =>
                              handleScoreChange(item.id, e.target.value, Number(item.maxScore))
                            }
                            className="w-full text-center p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 sm:text-sm"
                          />
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ),
              )}
              <tr className="bg-indigo-50 border-t-2 border-indigo-100">
                <td colSpan={2} className="p-4 font-bold text-sm text-indigo-900 text-right">
                  Tổng điểm:
                </td>
                <td className="p-4 font-bold text-sm text-indigo-900 text-center">
                  {maxTotal}
                </td>
                <td className="p-4 font-bold text-lg text-indigo-700 text-center">
                  {currentTotal}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
