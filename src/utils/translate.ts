export const translateRole = (role: string) => {
  switch (role?.toLowerCase()) {
    case 'admin': return 'Quản trị viên';
    case 'principal': return 'Hiệu trưởng';
    case 'teamleader': return 'Tổ trưởng';
    case 'teacher': return 'Giáo viên';
    case 'staff': return 'Nhân viên';
    default: return role;
  }
};

export const checkIsNV = (role?: string, teamId?: string): boolean => {
  const normRole = (role || "").trim().toLowerCase();
  const normTeam = (teamId || "").trim().toLowerCase();
  
  const isStaffRole = normRole === "staff" || normRole === "nhân viên" || normRole === "nhan vien" || normRole === "nv";
  const isOfficeTeam = normTeam === "vp" || 
                       normTeam === "văn phòng" || 
                       normTeam === "van phong" || 
                       normTeam.includes("văn phòng") || 
                       normTeam.includes("van phong");
                       
  return isStaffRole || isOfficeTeam;
};
