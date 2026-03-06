import Link from 'next/link';

export const metadata = {
  title: 'Về Chúng Tôi - Plaster ERP',
  description: 'Tìm hiểu về Plaster ERP - Giải pháp quản lý doanh nghiệp hàng đầu Việt Nam.',
};

export default function AboutPage() {
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
              <Link href="/features" className="text-gray-600 hover:text-blue-600">Tính Năng</Link>
              <Link href="/pricing" className="text-gray-600 hover:text-blue-600">Bảng Giá</Link>
              <Link href="/about" className="text-blue-600 font-semibold">Về Chúng Tôi</Link>
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
            Về Plaster ERP
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Chúng tôi xây dựng giải pháp quản lý doanh nghiệp hiện đại, giúp doanh nghiệp Việt Nam phát triển bền vững
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Sứ Mệnh</h2>
              <p className="text-lg text-gray-600 mb-4">
                Chúng tôi tin rằng mọi doanh nghiệp, dù lớn hay nhỏ, đều xứng đáng có được công cụ quản lý hiện đại và chuyên nghiệp.
              </p>
              <p className="text-lg text-gray-600 mb-4">
                Plaster ERP được xây dựng với mục tiêu giúp doanh nghiệp Việt Nam tối ưu hóa quy trình, tiết kiệm chi phí và tăng trưởng bền vững.
              </p>
            </div>
            <div className="bg-blue-50 rounded-2xl p-12">
              <div className="space-y-6">
                <div>
                  <div className="text-4xl font-bold text-blue-600 mb-2">1000+</div>
                  <div className="text-gray-600">Doanh nghiệp tin dùng</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-blue-600 mb-2">99.9%</div>
                  <div className="text-gray-600">Uptime</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-blue-600 mb-2">24/7</div>
                  <div className="text-gray-600">Hỗ trợ khách hàng</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">Giá Trị Cốt Lõi</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Đơn Giản</h3>
              <p className="text-gray-600">
                Giao diện trực quan, dễ sử dụng. Không cần đào tạo phức tạp.
              </p>
            </div>
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Nhanh Chóng</h3>
              <p className="text-gray-600">
                Hiệu suất cao, xử lý nhanh. Tiết kiệm thời gian cho bạn.
              </p>
            </div>
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Bảo Mật</h3>
              <p className="text-gray-600">
                Dữ liệu được mã hóa và bảo vệ theo tiêu chuẩn quốc tế.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">Đội Ngũ</h2>
          <p className="text-xl text-gray-600 text-center max-w-3xl mx-auto mb-12">
            Chúng tôi là đội ngũ kỹ sư và chuyên gia giàu kinh nghiệm, đam mê công nghệ và cam kết mang đến giải pháp tốt nhất cho khách hàng.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-blue-600">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Bắt Đầu Hành Trình Chuyển Đổi Số
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Tham gia cùng hàng nghìn doanh nghiệp đã tin dùng Plaster ERP
          </p>
          <Link
            href="/register"
            className="inline-block bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100"
          >
            Dùng Thử Miễn Phí 14 Ngày
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
