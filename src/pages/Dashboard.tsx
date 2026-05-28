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
import { Users, CheckCircle, TrendingUp, Printer, Download, Award, ShieldCheck, ShieldAlert, Sparkles } from "lucide-react";
import * as XLSX from 'xlsx';
import { useAuthStore } from "../store/authStore";
import { clsx } from "clsx";

export const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filterTeam, setFilterTeam] = useState("");
  const [filterName, setFilterName] = useState("");
  const [filterQuarter, setFilterQuarter] = useState("");
  const [filterClassification, setFilterClassification] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await apiCall("getDashboardData", {});
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

  // Calculate filtered data for charts and stats
  const filteredDetails = data.details ? data.details.filter((d: any) => {
    if (filterTeam && d.teamId !== filterTeam) return false;
    if (filterName && !d.name.toLowerCase().includes(filterName.toLowerCase())) return false;
    if (filterQuarter && d.quarter.toString() !== filterQuarter) return false;
    
    if (filterClassification) {
      const cls = d.scores['CLASSIFICATION'];
      const finalCls = cls?.pr || cls?.tl || cls?.self || '';
      if (finalCls !== filterClassification) return false;
    }
    
    return true;
  }) : [];

  const teamScores: Record<string, number[]> = {};
  filteredDetails.forEach((d: any) => {
    const teamId = d.teamId || 'Unknown';
    if (!teamScores[teamId]) teamScores[teamId] = [];
    const totalScore = d.scores['TOTAL'];
    if (totalScore) {
      const finalScore = totalScore.pr !== '' && totalScore.pr !== undefined ? totalScore.pr : (totalScore.tl !== '' && totalScore.tl !== undefined ? totalScore.tl : totalScore.self);
      teamScores[teamId].push(Number(finalScore) || 0);
    }
  });

  const teamAverages = Object.keys(teamScores).map(team => {
    const scores = teamScores[team];
    const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    return { team, average: Math.round(avg * 10) / 10 };
  });

  const maxAverage = teamAverages.length > 0 ? Math.max(...teamAverages.map(t => t.average)) : 0;

  const classificationStats = {
    'HTXS NV': 0,
    'HTT NV': 0,
    'HT NV': 0,
    'KHT NV': 0,
  };

  filteredDetails.forEach((d: any) => {
    const cls = d.scores['CLASSIFICATION'];
    const finalCls = cls?.pr || cls?.tl || cls?.self || '';
    if (finalCls === 'HTXS NV') classificationStats['HTXS NV']++;
    else if (finalCls === 'HTT NV') classificationStats['HTT NV']++;
    else if (finalCls === 'HT NV') classificationStats['HT NV']++;
    else if (finalCls === 'KHT NV') classificationStats['KHT NV']++;
  });

  const handleExportXLSX = () => {
    if (!filteredDetails || filteredDetails.length === 0) {
      alert("Không có dữ liệu để xuất");
      return;
    }

    const exportData = filteredDetails.map((row: any) => {
      const exportRow: any = {
        "Họ và tên": row.name,
        "Tổ/Nhóm": row.teamId,
        "Quý": row.quarter,
        "Vai trò": row.type === 'GV' ? 'Giáo viên' : 'Nhân viên',
      };

      // Add criteria scores
      Object.keys(row.scores).forEach(c => {
        if (c !== 'TOTAL' && c !== 'CLASSIFICATION') {
          const score = row.scores[c];
          exportRow[c] = score?.pr !== '' && score?.pr !== undefined ? score.pr : (score?.tl !== '' && score?.tl !== undefined ? score.tl : score?.self || '-');
        }
      });

      // Add total score
      const totalScore = row.scores['TOTAL'];
      exportRow['Tổng điểm'] = totalScore?.pr !== '' && totalScore?.pr !== undefined ? totalScore.pr : (totalScore?.tl !== '' && totalScore?.tl !== undefined ? totalScore.tl : totalScore?.self || '-');

      const classification = row.scores['CLASSIFICATION'];
      exportRow['Xếp loại'] = classification?.pr || classification?.tl || classification?.self || '-';

      return exportRow;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "BaoCaoDanhGia");
    
    // Generate file name based on filters
    let fileName = "BaoCaoDanhGia";
    if (filterQuarter) fileName += `_Q${filterQuarter}`;
    if (filterTeam) fileName += `_${filterTeam}`;
    fileName += ".xlsx";

    XLSX.writeFile(workbook, fileName);
  };

  const renderTable = (type: string, title: string) => {
    const filtered = filteredDetails.filter((d: any) => d.type === type);

    if (filtered.length === 0) return null;

    // Extract all unique criteria IDs except TOTAL and CLASSIFICATION
    const criteriaSet = new Set<string>();
    filtered.forEach((d: any) => {
      Object.keys(d.scores).forEach(k => {
        if (k !== 'TOTAL' && k !== 'CLASSIFICATION') criteriaSet.add(k);
      });
    });
    const criteriaList = Array.from(criteriaSet).sort();

    const getCellScore = (scores: any, c: string) => {
      if (!scores || !scores[c]) return '-';
      const val = scores[c].pr !== '' && scores[c].pr !== undefined 
        ? scores[c].pr 
        : (scores[c].tl !== '' && scores[c].tl !== undefined 
           ? scores[c].tl 
           : scores[c].self);
      return val !== '' && val !== undefined ? val : '-';
    };

    const getClassification = (scores: any) => {
      if (!scores || !scores['CLASSIFICATION']) return '-';
      const cls = scores['CLASSIFICATION'];
      return cls.pr || cls.tl || cls.self || '-';
    };

    return (
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200 mt-6 print:shadow-none print:border-none print:p-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-900">{title}</h2>
            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full border border-indigo-100">
              {filtered.length} thành viên
            </span>
          </div>
        </div>

        {/* Outer scroll container with fixed max height so the scrollbar is always visible under the content */}
        <div className="overflow-auto max-h-[550px] border border-slate-200 rounded-xl shadow-sm relative print:overflow-visible print:max-h-none print:border-none scrollbar-thin">
          <table className="w-full text-left border-collapse table-fixed divide-y divide-slate-200 print:whitespace-normal">
            <colgroup>
              <col style={{ width: '48px' }} />
              <col style={{ width: '180px' }} />
              <col style={{ width: '120px' }} />
              <col style={{ width: '64px' }} />
              {criteriaList.map(c => (
                <col key={c} style={{ width: '76px' }} />
              ))}
              <col style={{ width: '96px' }} />
              <col style={{ width: '110px' }} />
            </colgroup>
            
            <thead className="sticky top-0 z-40 border-b border-slate-200 print:static">
              {/* First Tier: Categorized Groups */}
              <tr className="bg-slate-100 font-semibold text-slate-700 text-xs border-b border-slate-200 h-10">
                <th 
                  colSpan={4} 
                  className="static md:sticky md:left-0 z-30 bg-[#f1f5f9] px-3 py-2 text-center font-bold text-slate-700 uppercase tracking-wider border-r border-slate-200 md:shadow-[3px_0_6px_rgba(0,0,0,0.06)]"
                >
                  Thông tin chung
                </th>
                <th 
                  colSpan={criteriaList.length} 
                  className="px-3 py-2 text-center font-bold text-slate-600 uppercase tracking-wider border-r border-slate-200 bg-[#f8fafc] z-20"
                >
                  Tiêu chí đánh giá
                </th>
                <th 
                  colSpan={2} 
                  className="static md:sticky md:right-0 z-30 bg-[#f1f5f9] px-3 py-2 text-center font-bold text-slate-700 uppercase tracking-wider border-l border-slate-200 md:shadow-[-3px_0_6px_rgba(0,0,0,0.06)]"
                >
                  Kết quả tổng hợp
                </th>
              </tr>

              {/* Second Tier: Real Headers */}
              <tr className="bg-[#f8fafc] text-slate-600 text-xs font-semibold border-b border-slate-200 h-10">
                <th className="static md:sticky md:left-0 z-30 bg-[#f1f5f9] p-2 text-center font-bold text-slate-700 border-r border-slate-200">STT</th>
                <th className="static md:sticky md:left-[48px] z-30 bg-[#f1f5f9] p-2 text-left font-bold text-slate-700 border-r border-slate-200 truncate">Họ và tên</th>
                <th className="static md:sticky md:left-[228px] z-30 bg-[#f1f5f9] p-2 text-left font-bold text-slate-700 border-r border-slate-200 truncate">Tổ/Nhóm</th>
                <th className="static md:sticky md:left-[348px] z-30 bg-[#f1f5f9] p-2 text-center font-bold text-slate-700 border-r border-slate-200 md:shadow-[3px_0_6px_rgba(0,0,0,0.06)]">Quý</th>
                {criteriaList.map(c => (
                  <th key={c} className="p-2 text-center font-bold text-slate-600 border-r border-slate-200 bg-[#f8fafc] z-20">{c}</th>
                ))}
                <th className="static md:sticky md:right-[110px] z-30 bg-[#f1f5f9] p-2 text-center font-bold text-slate-700 border-l border-slate-200 md:shadow-[-3px_0_6px_rgba(0,0,0,0.06)]">Tổng điểm</th>
                <th className="static md:sticky md:right-0 z-30 bg-[#f1f5f9] p-2 text-center font-bold text-slate-700 border-l border-slate-200">Phân loại</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-100 bg-white">
              {filtered.map((row: any, idx: number) => {
                const finalClassification = getClassification(row.scores);
                const isEven = idx % 2 === 0;
                const rowBg = isEven ? "bg-white" : "bg-[#f8fafc]";
                const rowHoverBg = "group-hover:bg-[#ebf4ff]";

                return (
                  <tr 
                    key={idx} 
                    className="group transition-colors border-b border-slate-100"
                  >
                    {/* STT */}
                    <td className={`static md:sticky md:left-0 z-10 ${rowBg} ${rowHoverBg} text-center text-slate-500 font-semibold text-xs p-3 border-r border-slate-200 transition-colors`}>
                      {idx + 1}
                    </td>

                    {/* Họ và tên */}
                    <td className={`static md:sticky md:left-[48px] z-10 ${rowBg} ${rowHoverBg} text-sm font-bold text-slate-900 p-3 border-r border-slate-200 truncate transition-colors`} title={row.name}>
                      {row.name}
                    </td>

                    {/* Tổ/Nhóm */}
                    <td className={`static md:sticky md:left-[228px] z-10 ${rowBg} ${rowHoverBg} text-sm text-slate-600 p-3 border-r border-slate-200 truncate transition-colors`} title={row.teamId}>
                      {row.teamId}
                    </td>

                    {/* Quý */}
                    <td className={`static md:sticky md:left-[348px] z-10 ${rowBg} ${rowHoverBg} text-sm text-center font-bold text-slate-500 p-3 border-r border-slate-200 md:shadow-[3px_0_6px_rgba(0,0,0,0.06)] transition-colors`}>
                      {row.quarter}
                    </td>

                    {/* Dynamic Criteria */}
                    {criteriaList.map(c => {
                      const scoreRaw = getCellScore(row.scores, c);
                      return (
                        <td 
                          key={c} 
                          className="p-3 text-center border-r border-slate-100 text-slate-700 font-bold min-w-[76px]"
                          style={{ fontSize: 'clamp(10px, 1.25vw, 13px)' }}
                        >
                          {scoreRaw}
                        </td>
                      );
                    })}

                    {/* Tổng điểm */}
                    <td 
                      className={`static md:sticky md:right-[110px] z-10 ${rowBg} ${rowHoverBg} text-center p-3 border-l border-slate-200 md:shadow-[-3px_0_6px_rgba(0,0,0,0.06)] transition-colors font-extrabold text-indigo-700`}
                      style={{ fontSize: 'clamp(11px, 1.25vw, 14px)' }}
                    >
                      {getCellScore(row.scores, 'TOTAL')}
                    </td>

                    {/* Phân loại badge */}
                    <td className={`static md:sticky md:right-0 z-10 ${rowBg} ${rowHoverBg} text-center p-3 border-l border-slate-200 transition-colors`}>
                      <span className={clsx(
                        "px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide inline-block border shadow-sm",
                        finalClassification === 'HTXS NV'
                          ? "bg-amber-50 text-amber-700 border-amber-200 animate-pulse"
                          : finalClassification === 'HTT NV'
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : finalClassification === 'HT NV'
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : finalClassification === 'KHT NV'
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : "bg-slate-50 text-slate-600 border-slate-200"
                      )}>
                        {finalClassification}
                      </span>
                    </td>
                  </tr>
                );
              })}
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

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center justify-between print:hidden">
        <div className="flex flex-wrap gap-4 items-center">
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
          <select
            id="filter-classification-select"
            value={filterClassification}
            onChange={e => setFilterClassification(e.target.value)}
            className="p-2 border border-slate-300 rounded-lg text-sm"
          >
            <option value="">Tất cả mức xếp loại</option>
            <option value="HTXS NV">Hoàn thành xuất sắc nhiệm vụ (HTXS NV)</option>
            <option value="HTT NV">Hoàn thành tốt nhiệm vụ (HTT NV)</option>
            <option value="HT NV">Hoàn thành nhiệm vụ (HT NV)</option>
            <option value="KHT NV">Không hoàn thành nhiệm vụ (KHT NV)</option>
          </select>
        </div>
        <div className="flex gap-2">
          {(user?.role.toLowerCase() === 'principal' || user?.role.toLowerCase() === 'team_leader') && (
            <button 
              onClick={handleExportXLSX}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors text-sm font-medium"
            >
              <Download size={16} />
              Xuất Excel
            </button>
          )}
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium"
          >
            <Printer size={16} />
            In danh sách
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:hidden">
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
              {maxAverage}
            </p>
          </div>
        </div>
      </div>

      {/* Classification Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 print:hidden mt-6">
        <div id="stat-htxs" className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <Sparkles size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Hoàn thành xuất sắc nhiệm vụ</p>
            <p className="text-2xl font-bold text-slate-900">{classificationStats['HTXS NV']}</p>
          </div>
        </div>

        <div id="stat-htt" className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <Award size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Hoàn thành tốt nhiệm vụ</p>
            <p className="text-2xl font-bold text-slate-900">{classificationStats['HTT NV']}</p>
          </div>
        </div>

        <div id="stat-ht" className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Hoàn thành nhiệm vụ</p>
            <p className="text-2xl font-bold text-slate-900">{classificationStats['HT NV']}</p>
          </div>
        </div>

        <div id="stat-kht" className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-lg">
            <ShieldAlert size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Không hoàn thành nhiệm vụ</p>
            <p className="text-2xl font-bold text-slate-900">{classificationStats['KHT NV']}</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 print:hidden">
        <h2 className="text-lg font-semibold text-slate-900 mb-6">
          Điểm trung bình các tổ
        </h2>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={teamAverages}
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
                {teamAverages.map((entry: any, index: number) => (
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

      {renderTable('GV', 'Danh sách đánh giá Giáo viên')}
      {renderTable('NV', 'Danh sách đánh giá Nhân viên')}
    </div>
  );
};
