import Link from 'next/link';

export const metadata = {
  title: 'Demo - Plaster ERP',
  description: 'Trải nghiệm Plaster ERP với tài khoản demo miễn phí',
};

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <nav className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              Plaster ERP
            </Link>
            <Link
              href="/register"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Đăng Ký Miễn Phí
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Trải Nghiệm Demo
            </h1>
            <p className="text-xl text-gray-600 mb-12">
              Khám phá đầy đủ tính năng của Plaster ERP với tài khoản demo
            </p>

            {/* Demo Card */}
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>

              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Thông Tin Đăng Nhập
              </h2>

              <div className="bg-gray-50 rounded-xl p-6 mb-6 text-left">
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">URL</div>
                    <div className="font-mono text-lg text-blue-600">
                      https://demo.smart-erp.com
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Email</div>
                    <div className="font-mono text-lg">demo@smart-erp.com</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Mật khẩu</div>
                    <div className="font-mono text-lg">Demo@123456</div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="text-sm text-yellow-800">
                    <strong>Lưu ý:</strong> Tài khoản demo được reset tự động mỗi ngày lúc 00:00. Dữ liệu bạn tạo sẽ bị xóa.
                  </div>
                </div>
              </div>

              <a
                href="https://demo.smart-erp.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block w-full bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Truy Cập Demo Ngay
              </a>
            </div>

            {/* Features */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="text-4xl mb-4">📦</div>
                <h3 className="font-semibold text-gray-900 mb-2">50 Sản Phẩm</h3>
                <p className="text-gray-600 text-sm">Dữ liệu mẫu đầy đủ</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="text-4xl mb-4">👥</div>
                <h3 className="font-semibold text-gray-900 mb-2">20 Khách Hàng</h3>
                <p className="text-gray-600 text-sm">Thông tin chi tiết</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="text-4xl mb-4">📋</div>
                <h3 className="font-semibold text-gray-900 mb-2">10 Đơn Hàng</h3>
                <p className="text-gray-600 text-sm">Các trạng thái khác nhau</p>
              </div>
            </div>

            {/* CTA */}
            <div className="bg-blue-50 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Sẵn Sàng Bắt Đầu?
              </h3>
              <p className="text-gray-600 mb-6">
                Đăng ký tài khoản riêng để sử dụng đầy đủ tính năng
              </p>
              <Link
                href="/register"
                className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700"
              >
                Đăng Ký Miễn Phí 14 Ngày
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-6 text-center">
          <p className="text-gray-400">&copy; 2026 Plaster ERP. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
