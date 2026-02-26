import React from "react";

export const Admin: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Quản trị hệ thống</h1>
        <p className="text-slate-500">
          Quản lý cấu hình hệ thống và người dùng.
        </p>
      </div>

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
              <select className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600">
                <option>2023-2024</option>
                <option>2024-2025</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Quý hiện tại
              </label>
              <select className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600">
                <option value="1">Quý 1</option>
                <option value="2">Quý 2</option>
                <option value="3">Quý 3</option>
                <option value="4">Quý 4</option>
              </select>
            </div>
            <div className="pt-4 border-t border-slate-100">
              <button
                type="button"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
              >
                Lưu cấu hình
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
                    value=""
                    className="sr-only peer"
                    defaultChecked={q === 1}
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
    </div>
  );
};
