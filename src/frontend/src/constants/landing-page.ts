/**
 * Landing Page Constants
 *
 * Centralized constants for the landing page component
 * including testimonials, FAQ items, and contact information
 */

export interface Testimonial {
  name: string;
  company: string;
  role: string;
  content: string;
}

export interface FAQItem {
  key: string;
  label: string;
  children: string;
}

/**
 * Testimonials data
 */
export const TESTIMONIALS: Testimonial[] = [
  {
    name: 'Nguyễn Văn A',
    company: 'Công ty TNHH ABC',
    role: 'Giám đốc điều hành',
    content:
      'SmartERP giúp chúng tôi quản lý kho hàng hiệu quả hơn 80%. Không còn tình trạng thiếu hụt hoặc tồn kho dư thừa.',
  },
  {
    name: 'Trần Thị B',
    company: 'Nhà máy XYZ',
    role: 'Trưởng phòng sản xuất',
    content:
      'Phần mềm dễ sử dụng, đội ngũ hỗ trợ nhiệt tình. Chúng tôi đã tăng năng suất sản xuất 30% sau 3 tháng sử dụng.',
  },
  {
    name: 'Lê Văn C',
    company: 'Xưởng DEF',
    role: 'Chủ doanh nghiệp',
    content:
      'Giá cả hợp lý, tính năng đầy đủ. Đặc biệt là báo cáo thống kê rất trực quan, giúp tôi ra quyết định nhanh chóng.',
  },
];

/**
 * FAQ items
 */
export const FAQ_ITEMS: FAQItem[] = [
  {
    key: '1',
    label: 'SmartERP có phù hợp với doanh nghiệp nhỏ không?',
    children:
      'Có, SmartERP được thiết kế linh hoạt cho mọi quy mô từ xưởng nhỏ đến nhà máy lớn. Bạn có thể bắt đầu với gói cơ bản và nâng cấp khi doanh nghiệp phát triển.',
  },
  {
    key: '2',
    label: 'Tôi có cần kiến thức kỹ thuật để sử dụng không?',
    children:
      'Không cần. SmartERP có giao diện thân thiện, dễ sử dụng. Chúng tôi cũng cung cấp đào tạo miễn phí và hỗ trợ 24/7.',
  },
  {
    key: '3',
    label: 'Dữ liệu của tôi có an toàn không?',
    children:
      'Tuyệt đối an toàn. Chúng tôi sử dụng mã hóa SSL, backup tự động hàng ngày, và tuân thủ các tiêu chuẩn bảo mật quốc tế.',
  },
  {
    key: '4',
    label: 'Tôi có thể hủy đăng ký bất cứ lúc nào không?',
    children:
      'Có, bạn có thể hủy đăng ký bất cứ lúc nào mà không mất phí. Chúng tôi không ràng buộc hợp đồng dài hạn.',
  },
];

/**
 * Contact information
 */
export const CONTACT_INFO = {
  phone: '1900-xxxx',
  email: 'contact@smarterp.vn',
  address: 'Hà Nội, Việt Nam',
};

/**
 * Layout constants
 */
export const LAYOUT_CONSTANTS = {
  SECTION_PADDING: '80px 24px',
  MAX_WIDTH: 1200,
  GRID_GUTTER: [32, 32] as [number, number],
  HEADER_HEIGHT: 64,
  FOOTER_PADDING: '40px 24px 24px',
};

/**
 * Color constants
 */
export const COLORS = {
  PRIMARY: '#1890ff',
  DARK_BG: '#001529',
  LIGHT_BG: '#f5f5f5',
  WHITE: '#fff',
  TEXT_SECONDARY: 'rgba(255,255,255,0.65)',
  BORDER_LIGHT: 'rgba(255,255,255,0.1)',
  STAR_COLOR: '#fadb14',
};

/**
 * Typography constants
 */
export const TYPOGRAPHY = {
  HEADING_LEVEL_2: 2,
  HEADING_LEVEL_4: 4,
  FONT_SIZE_LARGE: 20,
  FONT_SIZE_MEDIUM: 18,
  FONT_SIZE_SMALL: 16,
};

/**
 * GA Configuration
 */
export const GA_CONFIG = {
  MEASUREMENT_ID: process.env.VITE_GA_MEASUREMENT_ID || 'G-XXXXXXXXXX',
  PLACEHOLDER_ID: 'G-XXXXXXXXXX',
};
