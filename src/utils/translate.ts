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
