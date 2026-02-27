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
  const [filterTeam, setFilterTeam] = useState("");
  const [filterName, setFilterName] = useState("");
  const [filterQuarter, setFilterQuarter] = useState("");

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

  const renderTable = (type: string, title: string) => {
    if (!data.details) return null;
    
    const filtered = data.details.filter((d: any) => {
      if (d.type !== type) return false;
      if (filterTeam && d.teamId !== filterTeam) return false;
      if (filterName && !d.name.toLowerCase().includes(filterName.toLowerCase())) return false;
      if (filterQuarter && d.quarter.toString() !== filterQuarter) return false;
      return true;
    });

    if (filtered.length === 0) return null;

    // Extract all unique criteria IDs except TOTAL
    const criteriaSet = new Set<string>();
    filtered.forEach((d: any) => {
      Object.keys(d.scores).forEach(k => {
        if (k !== 'TOTAL') criteriaSet.add(k);
      });
    });
    const criteriaList = Array.from(criteriaSet).sort();

    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mt-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">{title}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-3 font-semibold text-sm text-slate-900">Họ và tên</th>
                <th className="p-3 font-semibold text-sm text-slate-900">Tổ/Nhóm</th>
                <th className="p-3 font-semibold text-sm text-slate-900">Quý</th>
                {criteriaList.map(c => (
                  <th key={c} className="p-3 font-semibold text-sm text-slate-900 text-center">{c}</th>
                ))}
                <th className="p-3 font-semibold text-sm text-slate-900 text-center">Tổng điểm</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row: any, idx: number) => (
                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-3 text-sm text-slate-700">{row.name}</td>
                  <td className="p-3 text-sm text-slate-700">{row.teamId}</td>
                  <td className="p-3 text-sm text-slate-700">{row.quarter}</td>
                  {criteriaList.map(c => (
                    <td key={c} className="p-3 text-sm text-slate-700 text-center">
                      {row.scores[c]?.tl !== '' && row.scores[c]?.tl !== undefined ? row.scores[c].tl : row.scores[c]?.self || '-'}
                    </td>
                  ))}
                  <td className="p-3 text-sm font-bold text-indigo-600 text-center">
                    {row.scores['TOTAL']?.tl !== '' && row.scores['TOTAL']?.tl !== undefined ? row.scores['TOTAL'].tl : row.scores['TOTAL']?.self || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

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

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center">
        <input 
          type="text" 
          placeholder="Lọc theo tên..." 
          value={filterName}
          onChange={e => setFilterName(e.target.value)}
          className="p-2 border border-slate-300 rounded-lg text-sm"
        />
        <input 
          type="text" 
          placeholder="Lọc theo tổ..." 
          value={filterTeam}
          onChange={e => setFilterTeam(e.target.value)}
          className="p-2 border border-slate-300 rounded-lg text-sm"
        />
        <select 
          value={filterQuarter}
          onChange={e => setFilterQuarter(e.target.value)}
          className="p-2 border border-slate-300 rounded-lg text-sm"
        >
          <option value="">Tất cả các Quý</option>
          <option value="1">Quý 1</option>
          <option value="2">Quý 2</option>
          <option value="3">Quý 3</option>
          <option value="4">Quý 4</option>
        </select>
      </div>

      {renderTable('GV', 'Danh sách đánh giá Giáo viên')}
      {renderTable('NV', 'Danh sách đánh giá Nhân viên')}
    </div>
  );
};
