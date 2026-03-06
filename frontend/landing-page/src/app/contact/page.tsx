import Link from 'next/link';

export const metadata = {
  title: 'Liên Hệ - Plaster ERP',
  description: 'Liên hệ với đội ngũ Plaster ERP để được tư vấn và hỗ trợ.',
};

export default function ContactPage() {
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
              <Link href="/about" className="text-gray-600 hover:text-blue-600">Về Chúng Tôi</Link>
              <Link href="/contact" className="text-blue-600 font-semibold">Liên Hệ</Link>
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
            Liên Hệ Với Chúng Tôi
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Đội ngũ của chúng tôi sẵn sàng hỗ trợ bạn 24/7
          </p>
        </div>
      </section>

      {/* Contact Info & Form */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Thông Tin Liên Hệ</h2>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="text-3xl mr-4">📧</div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                    <p className="text-gray-600">support@smart-erp.com</p>
                    <p className="text-gray-600">sales@smart-erp.com</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="text-3xl mr-4">📞</div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Điện Thoại</h3>
                    <p className="text-gray-600">Hotline: 1900-xxxx</p>
                    <p className="text-gray-600">Hỗ trợ: 024-xxxx-xxxx</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="text-3xl mr-4">📍</div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Địa Chỉ</h3>
                    <p className="text-gray-600">
                      Tầng 10, Tòa nhà ABC<br />
                      123 Đường XYZ, Quận 1<br />
                      TP. Hồ Chí Minh, Việt Nam
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="text-3xl mr-4">⏰</div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Giờ Làm Việc</h3>
                    <p className="text-gray-600">Thứ 2 - Thứ 6: 8:00 - 18:00</p>
                    <p className="text-gray-600">Thứ 7: 8:00 - 12:00</p>
                    <p className="text-gray-600">Chủ nhật: Nghỉ</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Gửi Tin Nhắn</h2>
              <form className="space-y-6">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Họ và Tên *
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    placeholder="Nguyễn Văn A"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    placeholder="email@example.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Số Điện Thoại
                  </label>
                  <input
                    type="tel"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    placeholder="0912345678"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Công Ty
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    placeholder="Tên công ty"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Tin Nhắn *
                  </label>
                  <textarea
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    placeholder="Nội dung tin nhắn..."
                    required
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  Gửi Tin Nhắn
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Câu Hỏi Thường Gặp
          </h2>
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Làm sao để bắt đầu sử dụng Plaster ERP?
              </h3>
              <p className="text-gray-600">
                Bạn chỉ cần đăng ký tài khoản miễn phí, sau đó có thể dùng thử đầy đủ tính năng trong 14 ngày.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Tôi cần hỗ trợ kỹ thuật, liên hệ ai?
              </h3>
              <p className="text-gray-600">
                Bạn có thể gửi email đến support@smart-erp.com hoặc gọi hotline 1900-xxxx. Chúng tôi hỗ trợ 24/7.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Có hỗ trợ đào tạo không?
              </h3>
              <p className="text-gray-600">
                Có, chúng tôi cung cấp tài liệu hướng dẫn, video tutorial và đào tạo trực tiếp cho gói Enterprise.
              </p>
            </div>
          </div>
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
