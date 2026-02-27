import React, { useState, useEffect } from "react";
import { apiCall } from "../services/api";
import Swal from "sweetalert2";
import { Plus, Edit, Trash2, Upload, Download } from "lucide-react";
import { translateRole } from "../utils/translate";
import * as XLSX from "xlsx";

export const Admin: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [config, setConfig] = useState({ year: "2023-2024", quarter: "1", lockedQuarters: [] as number[] });
  const [savingConfig, setSavingConfig] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await apiCall("getUsers");
      setUsers(res);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchConfig = async () => {
    try {
      const res = await apiCall("getConfig");
      const locked = [];
      if (res.LOCKED_Q1 === 'true') locked.push(1);
      if (res.LOCKED_Q2 === 'true') locked.push(2);
      if (res.LOCKED_Q3 === 'true') locked.push(3);
      if (res.LOCKED_Q4 === 'true') locked.push(4);

      setConfig({
        year: res.ACTIVE_YEAR || "2023-2024",
        quarter: res.ACTIVE_QUARTER || "1",
        lockedQuarters: locked
      });
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchConfig();
  }, []);

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    try {
      await apiCall("updateConfig", config);
      Swal.fire("Thành công", "Đã lưu cấu hình", "success");
    } catch (e: any) {
      Swal.fire("Lỗi", e.message, "error");
    } finally {
      setSavingConfig(false);
    }
  };

  const toggleLock = (q: number) => {
    setConfig(prev => ({
      ...prev,
      lockedQuarters: prev.lockedQuarters.includes(q) 
        ? prev.lockedQuarters.filter(x => x !== q)
        : [...prev.lockedQuarters, q]
    }));
  };

  const handleImportUsers = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          Swal.fire("Lỗi", "File không có dữ liệu", "error");
          return;
        }

        // Show loading
        Swal.fire({
          title: 'Đang xử lý...',
          text: 'Vui lòng chờ trong khi import dữ liệu',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        // Map data to expected format
        const usersToImport = data.map((row: any) => ({
          username: row['Tên đăng nhập'] || row['username'],
          password: row['Mật khẩu'] || row['password'],
          name: row['Họ và tên'] || row['name'],
          role: row['Vai trò (Teacher/Staff/TeamLeader/Principal/Admin)'] || row['role'],
          teamId: row['Tổ/Nhóm'] || row['teamId'] || ''
        })).filter(u => u.username && u.password && u.name && u.role);

        if (usersToImport.length === 0) {
          Swal.fire("Lỗi", "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại file mẫu.", "error");
          return;
        }

        await apiCall("importUsers", { users: usersToImport });
        
        Swal.fire("Thành công", `Đã import ${usersToImport.length} người dùng`, "success");
        fetchUsers();
      } catch (error: any) {
        Swal.fire("Lỗi", error.message || "Không thể import dữ liệu", "error");
      }
      
      // Reset input
      e.target.value = '';
    };
    reader.readAsBinaryString(file);
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Tên đăng nhập': 'nguyenvana',
        'Mật khẩu': '123456',
        'Họ và tên': 'Nguyễn Văn A',
        'Vai trò (Teacher/Staff/TeamLeader/Principal/Admin)': 'Teacher',
        'Tổ/Nhóm': 'Toan'
      },
      {
        'Tên đăng nhập': 'tranvanb',
        'Mật khẩu': '123456',
        'Họ và tên': 'Trần Văn B',
        'Vai trò (Teacher/Staff/TeamLeader/Principal/Admin)': 'Staff',
        'Tổ/Nhóm': 'VP'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Template_Import_NguoiDung.xlsx");
  };

  const handleAddUser = async () => {
    const { value: formValues } = await Swal.fire({
      title: "Thêm người dùng",
      html: `
        <input id="swal-input1" class="swal2-input" placeholder="Tên đăng nhập">
        <input id="swal-input2" class="swal2-input" placeholder="Mật khẩu" type="password">
        <input id="swal-input3" class="swal2-input" placeholder="Họ và tên">
        <select id="swal-input4" class="swal2-input" style="display: flex; width: 274px; margin: 1em auto;">
          <option value="Teacher">Giáo viên</option>
          <option value="Staff">Nhân viên</option>
          <option value="TeamLeader">Tổ trưởng</option>
          <option value="Principal">Hiệu trưởng</option>
          <option value="Admin">Admin</option>
        </select>
        <input id="swal-input5" class="swal2-input" placeholder="Mã Tổ/Nhóm">
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Thêm",
      cancelButtonText: "Hủy",
      preConfirm: () => {
        return {
          username: (document.getElementById("swal-input1") as HTMLInputElement).value,
          password: (document.getElementById("swal-input2") as HTMLInputElement).value,
          name: (document.getElementById("swal-input3") as HTMLInputElement).value,
          role: (document.getElementById("swal-input4") as HTMLSelectElement).value,
          teamId: (document.getElementById("swal-input5") as HTMLInputElement).value,
        };
      },
    });

    if (formValues) {
      if (!formValues.username || !formValues.password) {
        Swal.fire("Lỗi", "Tên đăng nhập và mật khẩu là bắt buộc", "error");
        return;
      }
      try {
        await apiCall("addUser", formValues);
        Swal.fire("Thành công", "Đã thêm người dùng", "success");
        fetchUsers();
      } catch (e: any) {
        Swal.fire("Lỗi", e.message, "error");
      }
    }
  };

  const handleEditUser = async (user: any) => {
    const { value: formValues } = await Swal.fire({
      title: "Sửa người dùng",
      html: `
        <input id="swal-input1" class="swal2-input" placeholder="Tên đăng nhập" value="${user.username}">
        <input id="swal-input2" class="swal2-input" placeholder="Mật khẩu mới (để trống nếu không đổi)" type="password">
        <input id="swal-input3" class="swal2-input" placeholder="Họ và tên" value="${user.name}">
        <select id="swal-input4" class="swal2-input" style="display: flex; width: 274px; margin: 1em auto;">
          <option value="Teacher" ${user.role === 'Teacher' ? 'selected' : ''}>Giáo viên</option>
          <option value="Staff" ${user.role === 'Staff' ? 'selected' : ''}>Nhân viên</option>
          <option value="TeamLeader" ${user.role === 'TeamLeader' ? 'selected' : ''}>Tổ trưởng</option>
          <option value="Principal" ${user.role === 'Principal' ? 'selected' : ''}>Hiệu trưởng</option>
          <option value="Admin" ${user.role.toLowerCase() === 'admin' ? 'selected' : ''}>Admin</option>
        </select>
        <input id="swal-input5" class="swal2-input" placeholder="Mã Tổ/Nhóm" value="${user.teamId}">
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Lưu",
      cancelButtonText: "Hủy",
      preConfirm: () => {
        return {
          id: user.id,
          username: (document.getElementById("swal-input1") as HTMLInputElement).value,
          password: (document.getElementById("swal-input2") as HTMLInputElement).value,
          name: (document.getElementById("swal-input3") as HTMLInputElement).value,
          role: (document.getElementById("swal-input4") as HTMLSelectElement).value,
          teamId: (document.getElementById("swal-input5") as HTMLInputElement).value,
        };
      },
    });

    if (formValues) {
      try {
        await apiCall("updateUser", formValues);
        Swal.fire("Thành công", "Đã cập nhật người dùng", "success");
        fetchUsers();
      } catch (e: any) {
        Swal.fire("Lỗi", e.message, "error");
      }
    }
  };

  const handleDeleteUser = async (user: any) => {
    const result = await Swal.fire({
      title: "Xóa người dùng?",
      text: `Bạn có chắc muốn xóa ${user.username}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
    });

    if (result.isConfirmed) {
      try {
        await apiCall("deleteUser", { id: user.id, username: user.username });
        Swal.fire("Đã xóa", "", "success");
        fetchUsers();
      } catch (e: any) {
        Swal.fire("Lỗi", e.message, "error");
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Quản trị hệ thống</h1>
        <p className="text-slate-500">
          Quản lý cấu hình hệ thống và người dùng.
        </p>
      </div>

      {/* Configuration Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Cấu hình hệ thống
          </h2>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Năm học hiện tại
              </label>
              <input
                type="text"
                value={config.year}
                onChange={(e) => setConfig({ ...config, year: e.target.value })}
                placeholder="Ví dụ: 2026"
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Quý hiện tại
              </label>
              <select
                value={config.quarter}
                onChange={(e) => setConfig({ ...config, quarter: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600"
              >
                <option value="1">Quý 1</option>
                <option value="2">Quý 2</option>
                <option value="3">Quý 3</option>
                <option value="4">Quý 4</option>
              </select>
            </div>
            <div className="pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleSaveConfig}
                disabled={savingConfig}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium disabled:opacity-50"
              >
                {savingConfig ? "Đang lưu..." : "Lưu cấu hình"}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Khóa/Mở khóa Quý
          </h2>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((q) => (
              <div
                key={q}
                className="flex items-center justify-between p-3 border border-slate-200 rounded-lg"
              >
                <span className="font-medium text-slate-700">Quý {q}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={config.lockedQuarters.includes(q)}
                    onChange={() => toggleLock(q)}
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  <span className="ml-3 text-sm font-medium text-slate-600">
                    Đã khóa
                  </span>
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* User Management Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Quản lý người dùng
          </h2>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm font-medium transition-colors"
              title="Tải file mẫu"
            >
              <Download size={16} />
              <span className="hidden sm:inline">File mẫu</span>
            </button>
            
            <label className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 text-sm font-medium transition-colors cursor-pointer">
              <Upload size={16} />
              <span className="hidden sm:inline">Import Excel</span>
              <input 
                type="file" 
                accept=".xlsx, .xls" 
                className="hidden" 
                onChange={handleImportUsers}
              />
            </label>

            <button
              onClick={handleAddUser}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Thêm người dùng</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 font-semibold text-sm text-slate-900">Tên đăng nhập</th>
                <th className="p-4 font-semibold text-sm text-slate-900">Họ và tên</th>
                <th className="p-4 font-semibold text-sm text-slate-900">Vai trò</th>
                <th className="p-4 font-semibold text-sm text-slate-900">Tổ/Nhóm</th>
                <th className="p-4 font-semibold text-sm text-slate-900 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loadingUsers ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-slate-500">Đang tải...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-slate-500">Không có dữ liệu</td>
                </tr>
              ) : (
                users.map((u, idx) => (
                  <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-4 text-sm text-slate-700">{u.username}</td>
                    <td className="p-4 text-sm text-slate-700">{u.name}</td>
                    <td className="p-4 text-sm text-slate-700">
                      <span className="px-2 py-1 bg-slate-100 rounded-md text-xs font-medium text-slate-600">
                        {translateRole(u.role)}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-700">{u.teamId}</td>
                    <td className="p-4 text-right space-x-2">
                      <button onClick={() => handleEditUser(u)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDeleteUser(u)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={16} />
                      </button>
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
