/**
 * UI Constants
 * Chuẩn hóa colors, labels, messages cho toàn bộ hệ thống
 */

import dayjs from 'dayjs';

// ============================================
// COLORS
// ============================================

export const STATUS_COLORS = {
  active: 'green',
  inactive: 'red',
  pending: 'orange',
  completed: 'blue',
  cancelled: 'gray',
  draft: 'default',
  approved: 'green',
  rejected: 'red',
} as const;

export const TYPE_COLORS = {
  individual: 'blue',
  business: 'green',
  reseller: 'orange',
  vip: 'gold',
} as const;

export const SPECIALTY_COLORS = {
  casting: 'blue',
  painting: 'green',
  finishing: 'orange',
  packaging: 'purple',
  general: 'default',
} as const;

export const PRIORITY_COLORS = {
  low: 'default',
  medium: 'blue',
  high: 'orange',
  urgent: 'red',
} as const;

// ============================================
// LABELS
// ============================================

export const BUTTON_LABELS = {
  create: 'Thêm Mới',
  edit: 'Sửa',
  delete: 'Xóa',
  save: 'Lưu',
  cancel: 'Hủy',
  search: 'Tìm kiếm',
  filter: 'Lọc',
  export: 'Xuất Excel',
  import: 'Nhập Excel',
  print: 'In',
  view: 'Xem',
  approve: 'Duyệt',
  reject: 'Từ chối',
  submit: 'Gửi',
  back: 'Quay lại',
  next: 'Tiếp theo',
  finish: 'Hoàn thành',
} as const;

export const STATUS_LABELS = {
  active: 'Hoạt động',
  inactive: 'Ngừng',
  pending: 'Chờ xử lý',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
  draft: 'Nháp',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
  in_progress: 'Đang xử lý',
  paused: 'Tạm dừng',
} as const;

export const TYPE_LABELS = {
  individual: 'Cá Nhân',
  business: 'Doanh Nghiệp',
  reseller: 'Đại Lý',
  vip: 'VIP',
} as const;

export const SPECIALTY_LABELS = {
  casting: 'Đúc tượng',
  painting: 'Sơn màu',
  finishing: 'Hoàn thiện',
  packaging: 'Đóng gói',
  general: 'Tổng hợp',
} as const;

export const SKILL_LEVEL_LABELS = {
  apprentice: 'Thợ phụ',
  skilled: 'Thợ chính',
  master: 'Thợ bậc cao',
  junior: 'Sơ cấp',
  intermediate: 'Trung cấp',
  senior: 'Cao cấp',
} as const;

export const PRIORITY_LABELS = {
  low: 'Thấp',
  medium: 'Trung bình',
  high: 'Cao',
  urgent: 'Khẩn cấp',
} as const;

// ============================================
// MESSAGES
// ============================================

export const CONFIRM_MESSAGES = {
  delete: 'Bạn có chắc muốn xóa?',
  deleteMultiple: (count: number) => `Bạn có chắc muốn xóa ${count} bản ghi đã chọn?`,
  cancel: 'Bạn có chắc muốn hủy?',
  submit: 'Bạn có chắc muốn lưu?',
  approve: 'Bạn có chắc muốn duyệt?',
  reject: 'Bạn có chắc muốn từ chối?',
} as const;

export const SUCCESS_MESSAGES = {
  create: 'Thêm mới thành công!',
  update: 'Cập nhật thành công!',
  delete: 'Xóa thành công!',
  deleteMultiple: (count: number) => `Đã xóa ${count} bản ghi thành công!`,
  save: 'Lưu thành công!',
  approve: 'Duyệt thành công!',
  reject: 'Từ chối thành công!',
  import: 'Nhập dữ liệu thành công!',
  export: 'Xuất dữ liệu thành công!',
} as const;

export const ERROR_MESSAGES = {
  create: 'Thêm mới thất bại!',
  update: 'Cập nhật thất bại!',
  delete: 'Xóa thất bại!',
  save: 'Lưu thất bại!',
  approve: 'Duyệt thất bại!',
  reject: 'Từ chối thất bại!',
  network: 'Lỗi kết nối mạng!',
  notFound: 'Không tìm thấy dữ liệu!',
  unauthorized: 'Bạn không có quyền thực hiện thao tác này!',
  validation: 'Dữ liệu không hợp lệ!',
  import: 'Nhập dữ liệu thất bại!',
  export: 'Xuất dữ liệu thất bại!',
} as const;

export const WARNING_MESSAGES = {
  unsavedChanges: 'Bạn có thay đổi chưa lưu. Bạn có chắc muốn rời khỏi trang?',
  selectItems: 'Vui lòng chọn ít nhất một bản ghi!',
  fillRequired: 'Vui lòng điền đầy đủ thông tin bắt buộc!',
} as const;

// ============================================
// DIMENSIONS
// ============================================

export const COLUMN_WIDTHS = {
  code: 100,
  name: 200,
  phone: 120,
  email: 180,
  price: 120,
  quantity: 100,
  status: 100,
  date: 120,
  datetime: 160,
  actions: 150,
  checkbox: 50,
} as const;

export const INPUT_WIDTHS = {
  search: 300,
  filter: 150,
  select: 150,
  date: 200,
  number: 120,
} as const;

export const CARD_PADDING = {
  header: '0 24px',
  body: '0',
  searchArea: '16px 24px',
} as const;

export const SPACING = {
  small: 8,
  medium: 16,
  large: 24,
  xlarge: 32,
} as const;

// ============================================
// PAGINATION
// ============================================

export const PAGINATION_CONFIG = {
  defaultPageSize: 10,
  pageSizeOptions: ['10', '20', '50', '100'],
  showSizeChanger: true,
  showTotal: (total: number) => `Tổng ${total} bản ghi`,
} as const;

// ============================================
// FORMATS
// ============================================

export const DATE_FORMATS = {
  date: 'DD/MM/YYYY',
  datetime: 'DD/MM/YYYY HH:mm',
  time: 'HH:mm',
  month: 'MM/YYYY',
  year: 'YYYY',
} as const;

export const NUMBER_FORMATS = {
  currency: (value: number) => Math.round(value).toLocaleString('vi-VN') + ' đ',
  number: (value: number) => value.toLocaleString('vi-VN'),
  percent: (value: number) => value.toFixed(2) + '%',
} as const;

// ============================================
// VALIDATION
// ============================================

export const VALIDATION_MESSAGES = {
  required: 'Trường này là bắt buộc!',
  email: 'Email không hợp lệ!',
  phone: 'Số điện thoại không hợp lệ!',
  minLength: (min: number) => `Tối thiểu ${min} ký tự!`,
  maxLength: (max: number) => `Tối đa ${max} ký tự!`,
  min: (min: number) => `Giá trị tối thiểu là ${min}!`,
  max: (max: number) => `Giá trị tối đa là ${max}!`,
  pattern: 'Định dạng không hợp lệ!',
  unique: 'Giá trị đã tồn tại!',
} as const;

// ============================================
// HELPER FUNCTIONS
// ============================================

export const getStatusColor = (status: string): string => {
  return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || 'default';
};

export const getStatusLabel = (status: string): string => {
  return STATUS_LABELS[status as keyof typeof STATUS_LABELS] || status;
};

export const getTypeColor = (type: string): string => {
  return TYPE_COLORS[type as keyof typeof TYPE_COLORS] || 'default';
};

export const getTypeLabel = (type: string): string => {
  return TYPE_LABELS[type as keyof typeof TYPE_LABELS] || type;
};

export const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '0 đ';
  return NUMBER_FORMATS.currency(value);
};

export const formatNumber = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '0';
  return NUMBER_FORMATS.number(value);
};

export const formatDate = (
  date: Date | string | null | undefined,
  format: keyof typeof DATE_FORMATS = 'date',
): string => {
  if (!date) return '-';
  return dayjs(date).format(DATE_FORMATS[format]);
};
