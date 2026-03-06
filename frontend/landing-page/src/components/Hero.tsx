export default function Hero() {
  return (
    <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-5xl font-bold mb-4">
          Giải pháp quản lý kho & bán hàng toàn diện
        </h1>
        <p className="text-xl mb-8">
          Dành cho doanh nghiệp vừa và nhỏ - Dùng thử miễn phí 14 ngày
        </p>
        <div className="space-x-4">
          <a href="/register" className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100">
            Dùng thử miễn phí
          </a>
          <a href="/demo" className="border-2 border-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600">
            Xem Demo
          </a>
        </div>
      </div>
    </section>
  )
}
