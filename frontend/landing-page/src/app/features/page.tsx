import Link from 'next/link';

export const metadata = {
  title: 'Tính Năng - SmartERP',
  description: 'Khám phá các tính năng mạnh mẽ của Plaster ERP: Quản lý kho, bán hàng, sản xuất, nhân sự và nhiều hơn nữa.',
};

export default function FeaturesPage() {
  const features = [
    {
      icon: '📦',
      title: 'Quản Lý Kho',
      description: 'Theo dõi tồn kho real-time, cảnh báo hết hàng, quản lý nhiều kho',
      details: [
        'Nhập/xuất kho tự động',
        'Kiểm kê định kỳ',
        'Cảnh báo tồn kho tối thiểu',
        'Quản lý vị trí kho',
        'Barcode/QR code',
        'Lịch sử xuất nhập',
      ],
    },
    {
      icon: '🛒',
      title: 'Bán Hàng',
      description: 'Quản lý đơn hàng, báo giá, hóa đơn và thanh toán',
      details: [
        'Tạo đơn hàng nhanh',
        'Báo giá chuyên nghiệp',
        'Hóa đơn điện tử',
        'Quản lý công nợ',
        'Chiết khấu linh hoạt',
        'Theo dõi giao hàng',
      ],
    },
    {
      icon: '🏭',
      title: 'Sản Xuất',
      description: 'Quản lý quy trình sản xuất, nguyên vật liệu, thành phẩm',
      details: [
        'Lệnh sản xuất',
        'Công thức sản xuất',
        'Theo dõi tiến độ',
        'Quản lý NVL',
        'Kiểm soát chất lượng',
        'Báo cáo hiệu suất',
      ],
    },
    {
      icon: '👥',
      title: 'Khách Hàng',
      description: 'CRM đầy đủ, lịch sử mua hàng, phân tích hành vi',
      details: [
        'Hồ sơ khách hàng',
        'Lịch sử giao dịch',
        'Phân loại khách hàng',
        'Chương trình khuyến mãi',
        'Điểm thưởng',
        'Phân tích RFM',
      ],
    },
    {
      icon: '🚚',
      title: 'Nhà Cung Cấp',
      description: 'Quản lý nhà cung cấp, đơn mua hàng, thanh toán',
      details: [
        'Danh sách NCC',
        'Đơn mua hàng',
        'So sánh giá',
        'Đánh giá NCC',
        'Quản lý công nợ',
        'Lịch sử giao dịch',
      ],
    },
    {
      icon: '👔',
      title: 'Nhân Sự',
      description: 'Quản lý nhân viên, chấm công, tính lương',
      details: [
        'Hồ sơ nhân viên',
        'Chấm công',
        'Tính lương tự động',
        'Quản lý phép',
        'Đánh giá KPI',
        'Hợp đồng lao động',
      ],
    },
    {
      icon: '📊',
      title: 'Báo Cáo',
      description: 'Báo cáo chi tiết, dashboard trực quan, xuất Excel',
      details: [
        'Dashboard real-time',
        'Báo cáo doanh thu',
        'Báo cáo tồn kho',
        'Báo cáo công nợ',
        'Phân tích xu hướng',
        'Xuất Excel/PDF',
      ],
    },
    {
      icon: '📱',
      title: 'Mobile App',
      description: 'Ứng dụng di động cho iOS và Android',
      details: [
        'Quản lý mọi lúc mọi nơi',
        'Quét barcode',
        'Chụp ảnh sản phẩm',
        'Thông báo real-time',
        'Offline mode',
        'Đồng bộ tự động',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <nav className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              Plaster ERP
            </Link>
            <div className="hidden md:flex space-x-8">
              <Link href="/" className="text-gray-600 hover:text-blue-600">Trang Chủ</Link>
              <Link href="/features" className="text-blue-600 font-semibold">Tính Năng</Link>
              <Link href="/pricing" className="text-gray-600 hover:text-blue-600">Bảng Giá</Link>
              <Link href="/about" className="text-gray-600 hover:text-blue-600">Về Chúng Tôi</Link>
              <Link href="/contact" className="text-gray-600 hover:text-blue-600">Liên Hệ</Link>
            </div>
            <Link
              href="/register"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Dùng Thử Miễn Phí
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="py-20 bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Tính Năng Mạnh Mẽ
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Plaster ERP cung cấp đầy đủ tính năng để quản lý toàn bộ hoạt động kinh doanh của bạn
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition">
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 mb-6">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.details.map((detail, i) => (
                    <li key={i} className="flex items-center text-gray-700">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-blue-600">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Trải Nghiệm Ngay Hôm Nay
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Dùng thử miễn phí 14 ngày, không cần thẻ tín dụng
          </p>
          <Link
            href="/register"
            className="inline-block bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100"
          >
            Đăng Ký Ngay
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Plaster ERP</h3>
              <p className="text-gray-400">Giải pháp quản lý toàn diện cho doanh nghiệp</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Sản Phẩm</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/features">Tính Năng</Link></li>
                <li><Link href="/pricing">Bảng Giá</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Công Ty</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about">Về Chúng Tôi</Link></li>
                <li><Link href="/contact">Liên Hệ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Pháp Lý</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/terms">Điều Khoản</Link></li>
                <li><Link href="/privacy">Bảo Mật</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2026 Plaster ERP. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
