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

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const type = user?.role === "Staff" ? "NV" : "GV";
        const res = await apiCall("getEvaluationTemplate", { type });
        setTemplate(res);
      } catch (error) {
        console.error("Failed to load template", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplate();
  }, [user]);

  const handleScoreChange = (id: string, value: string) => {
    const num = parseInt(value, 10);
    if (!isNaN(num)) {
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
      const scoresArray = Object.entries(scores).map(([criteriaId, score]) => ({
        criteriaId,
        score,
        type: "selfScore",
      }));

      await apiCall("submitEvaluation", {
        userId: user?.id,
        year: "2023-2024", // Should come from config
        quarter: 1, // Should come from config
        scores: scoresArray,
      });

      Swal.fire({
        icon: "success",
        title: "Saved",
        text: "Your evaluation has been submitted successfully.",
        confirmButtonColor: "#4f46e5",
      });
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "Failed to save evaluation",
        confirmButtonColor: "#4f46e5",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading evaluation form...</div>;

  // Group by section
  const groupedTemplate = template.reduce((acc: any, item: any) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {});

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Self Evaluation</h1>
          <p className="text-slate-500">Quarter 1, 2023-2024</p>
        </div>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors font-medium text-sm"
        >
          <Save size={16} />
          {saving ? "Saving..." : "Save Evaluation"}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 font-semibold text-sm text-slate-900 w-1/4">
                  Criteria
                </th>
                <th className="p-4 font-semibold text-sm text-slate-900 w-1/2">
                  Description
                </th>
                <th className="p-4 font-semibold text-sm text-slate-900 w-24 text-center">
                  Max
                </th>
                <th className="p-4 font-semibold text-sm text-slate-900 w-32 text-center">
                  Self Score
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
                        <td className="p-4 text-sm text-slate-600 align-top">
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
                              handleScoreChange(item.id, e.target.value)
                            }
                            className="w-full text-center p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 sm:text-sm"
                          />
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ),
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
