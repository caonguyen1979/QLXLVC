import React, { useEffect, useState } from "react";
import { apiCall } from "../services/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Users, CheckCircle, TrendingUp } from "lucide-react";

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await apiCall("getDashboardData");
        setData(res);
      } catch (error) {
        console.error("Không thể tải bảng điều khiển", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        Đang tải bảng điều khiển...
      </div>
    );
  }

  if (!data) return <div>Không thể tải dữ liệu</div>;

  const colors = ["#4f46e5", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444"];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Bảng điều khiển chung
        </h1>
        <p className="text-slate-500">
          Tổng quan về các chỉ số đánh giá của tất cả các tổ/nhóm.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">
              Tổng số thành viên
            </p>
            <p className="text-2xl font-bold text-slate-900">
              {data.totalMembers}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">
              Tỷ lệ hoàn thành
            </p>
            <p className="text-2xl font-bold text-slate-900">
              {data.completionRate}%
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">
              Điểm trung bình cao nhất
            </p>
            <p className="text-2xl font-bold text-slate-900">
              {Math.max(...data.teamAverages.map((t: any) => t.average))}
            </p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 mb-6">
          Điểm trung bình các tổ
        </h2>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.teamAverages}
              margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e2e8f0"
              />
              <XAxis
                dataKey="team"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748b" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748b" }}
                domain={[0, 100]}
              />
              <Tooltip
                cursor={{ fill: "#f8fafc" }}
                contentStyle={{
                  borderRadius: "8px",
                  border: "none",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
              />
              <Bar dataKey="average" radius={[4, 4, 0, 0]}>
                {data.teamAverages.map((entry: any, index: number) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={colors[index % colors.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
