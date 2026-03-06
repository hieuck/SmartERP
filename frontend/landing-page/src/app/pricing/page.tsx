import Link from 'next/link';

export const metadata = {
  title: 'Bảng Giá - SmartERP',
  description: 'So sánh chi tiết các gói dịch vụ SmartERP. Chọn gói phù hợp với quy mô doanh nghiệp của bạn.',
};

export default function PricingPage() {
  const plans = [
    {
      name: 'Miễn Phí',
      price: '0đ',
      period: 'mãi mãi',
      description: 'Dùng thử các tính năng cơ bản',
      features: [
        '1 người dùng',
        '1 kho hàng',
        '100 sản phẩm',
        '50 đơn hàng/tháng',
        'Hỗ trợ qua email',
        'Báo cáo cơ bản',
      ],
      limitations: [
        'Không có tính năng sản xuất',
        'Không có API',
        'Không có xuất dữ liệu',
      ],
      cta: 'Bắt Đầu Miễn Phí',
      popular: false,
    },
    {
      name: 'Basic',
      price: '299,000đ',
      period: '/tháng',
      description: 'Cho doanh nghiệp nhỏ',
      features: [
        '3 người dùng',
        '2 kho hàng',
        '1,000 sản phẩm',
        '500 đơn hàng/tháng',
        'Hỗ trợ qua email',
        'Báo cáo chi tiết',
        'Quản lý khách hàng',
        'Quản lý nhà cung cấp',
        'Xuất dữ liệu Excel',
      ],
      limitations: [
        'Không có tính năng sản xuất',
        'API giới hạn 1,000 calls/ngày',
      ],
      cta: 'Dùng Thử 14 Ngày',
      popular: false,
    },
    {
      name: 'Pro',
      price: '599,000đ',
      period: '/tháng',
      description: 'Cho doanh nghiệp vừa',
      features: [
        '10 người dùng',
        '5 kho hàng',
        '10,000 sản phẩm',
        'Không giới hạn đơn hàng',
        'Hỗ trợ ưu tiên',
        'Báo cáo nâng cao',
        'Quản lý sản xuất',
        'Quản lý nhân sự',
        'Tính lương',
        'API không giới hạn',
        'Tích hợp bên thứ 3',
        'Sao lưu tự động',
      ],
      limitations: [],
      cta: 'Dùng Thử 14 Ngày',
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 'Liên hệ',
      period: '',
      description: 'Cho doanh nghiệp lớn',
      features: [
        'Không giới hạn người dùng',
        'Không giới hạn kho hàng',
        'Không giới hạn sản phẩm',
        'Không giới hạn đơn hàng',
        'Hỗ trợ 24/7',
        'Tất cả tính năng Pro',
        'Tùy chỉnh theo yêu cầu',
        'Đào tạo onsite',
        'Dedicated server',
        'SLA 99.9%',
        'Tích hợp ERP khác',
        'White-label',
      ],
      limitations: [],
      cta: 'Liên Hệ Tư Vấn',
      popular: false,
    },
  ];

  const faqs = [
    {
      q: 'Tôi có thể thay đổi gói dịch vụ không?',
      a: 'Có, bạn có thể nâng cấp hoặc hạ cấp gói bất cứ lúc nào. Phí sẽ được tính theo tỷ lệ thời gian sử dụng.',
    },
    {
      q: 'Có phí setup ban đầu không?',
      a: 'Không, tất cả các gói đều không có phí setup. Bạn chỉ trả phí hàng tháng.',
    },
    {
      q: 'Dùng thử 14 ngày có mất phí không?',
      a: 'Không, bạn dùng thử hoàn toàn miễn phí trong 14 ngày. Không cần thẻ tín dụng.',
    },
    {
      q: 'Tôi có thể hủy bất cứ lúc nào không?',
      a: 'Có, bạn có thể hủy bất cứ lúc nào. Không có hợp đồng ràng buộc dài hạn.',
    },
    {
      q: 'Dữ liệu của tôi có được bảo mật không?',
      a: 'Có, chúng tôi sử dụng mã hóa SSL/TLS và tuân thủ các tiêu chuẩn bảo mật quốc tế.',
    },
    {
      q: 'Tôi có thể xuất dữ liệu không?',
      a: 'Có, tất cả các gói từ Basic trở lên đều có thể xuất dữ liệu ra Excel, CSV.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <nav className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              SmartERP
            </Link>
            <div className="hidden md:flex space-x-8">
              <Link href="/" className="text-gray-600 hover:text-blue-600">Trang Chủ</Link>
              <Link href="/features" className="text-gray-600 hover:text-blue-600">Tính Năng</Link>
              <Link href="/pricing" className="text-blue-600 font-semibold">Bảng Giá</Link>
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

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Bảng Giá Minh Bạch
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Chọn gói phù hợp với quy mô doanh nghiệp của bạn. Dùng thử miễn phí 14 ngày, không cần thẻ tín dụng.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`bg-white rounded-2xl shadow-lg p-8 ${
                  plan.popular ? 'ring-4 ring-blue-600 relative' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Phổ Biến Nhất
                    </span>
                  </div>
                )}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 mb-6">{plan.description}</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-600">{plan.period}</span>
                </div>
                <button
                  className={`w-full py-3 rounded-lg font-semibold mb-6 ${
                    plan.popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {plan.cta}
                </button>
                <div className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start">
                      <svg
                        className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                  {plan.limitations.map((limitation, i) => (
                    <div key={i} className="flex items-start">
                      <svg
                        className="w-5 h-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                      <span className="text-gray-500">{limitation}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">So Sánh Chi Tiết</h2>
          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-lg shadow-lg">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left">Tính Năng</th>
                  <th className="px-6 py-4 text-center">Miễn Phí</th>
                  <th className="px-6 py-4 text-center">Basic</th>
                  <th className="px-6 py-4 text-center bg-blue-50">Pro</th>
                  <th className="px-6 py-4 text-center">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="px-6 py-4 font-semibold">Người dùng</td>
                  <td className="px-6 py-4 text-center">1</td>
                  <td className="px-6 py-4 text-center">3</td>
                  <td className="px-6 py-4 text-center bg-blue-50">10</td>
                  <td className="px-6 py-4 text-center">Không giới hạn</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-semibold">Kho hàng</td>
                  <td className="px-6 py-4 text-center">1</td>
                  <td className="px-6 py-4 text-center">2</td>
                  <td className="px-6 py-4 text-center bg-blue-50">5</td>
                  <td className="px-6 py-4 text-center">Không giới hạn</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-semibold">Sản phẩm</td>
                  <td className="px-6 py-4 text-center">100</td>
                  <td className="px-6 py-4 text-center">1,000</td>
                  <td className="px-6 py-4 text-center bg-blue-50">10,000</td>
                  <td className="px-6 py-4 text-center">Không giới hạn</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-semibold">Quản lý sản xuất</td>
                  <td className="px-6 py-4 text-center">❌</td>
                  <td className="px-6 py-4 text-center">❌</td>
                  <td className="px-6 py-4 text-center bg-blue-50">✅</td>
                  <td className="px-6 py-4 text-center">✅</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-semibold">API</td>
                  <td className="px-6 py-4 text-center">❌</td>
                  <td className="px-6 py-4 text-center">Giới hạn</td>
                  <td className="px-6 py-4 text-center bg-blue-50">Không giới hạn</td>
                  <td className="px-6 py-4 text-center">Không giới hạn</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-semibold">Hỗ trợ</td>
                  <td className="px-6 py-4 text-center">Email</td>
                  <td className="px-6 py-4 text-center">Email</td>
                  <td className="px-6 py-4 text-center bg-blue-50">Ưu tiên</td>
                  <td className="px-6 py-4 text-center">24/7</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Câu Hỏi Thường Gặp</h2>
          <div className="max-w-3xl mx-auto space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-blue-600">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Sẵn Sàng Bắt Đầu?
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
              <h3 className="text-xl font-bold mb-4">SmartERP</h3>
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
            <p>&copy; 2026 SmartERP. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
