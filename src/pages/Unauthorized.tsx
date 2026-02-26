import React from "react";

export const Unauthorized: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-[80vh]">
      <h1 className="text-4xl font-bold text-slate-900 mb-4">403</h1>
      <p className="text-lg text-slate-600">
        You do not have permission to access this page.
      </p>
    </div>
  );
};
