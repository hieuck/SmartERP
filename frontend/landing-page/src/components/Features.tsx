const features = [
  { icon: '', title: 'Quản lý kho', desc: 'Theo dõi tồn kho real-time' },
  { icon: '', title: 'Bán hàng', desc: 'Đơn hàng, hóa đơn tự động' },
  { icon: '', title: 'Sản xuất', desc: 'Quản lý quy trình sản xuất' },
  { icon: '', title: 'Nhân sự', desc: 'HR & Payroll tích hợp' },
  { icon: '', title: 'Báo cáo', desc: 'Dashboard & analytics' },
  { icon: '📱', title: 'Mobile', desc: 'Truy cập mọi lúc mọi nơi' },
]

export default function Features() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12">Tính năng nổi bật</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
              <p className="text-gray-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
