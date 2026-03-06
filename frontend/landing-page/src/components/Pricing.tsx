const plans = [
  { name: 'Free', price: '0đ', users: 1, features: ['1 kho', '100 sản phẩm', 'Email support'] },
  { name: 'Basic', price: '299k', users: 3, features: ['2 kho', '1,000 sản phẩm', 'Email support'], popular: false },
  { name: 'Pro', price: '599k', users: 10, features: ['5 kho', '10,000 sản phẩm', 'Priority support', 'API access'], popular: true },
  { name: 'Enterprise', price: 'Liên hệ', users: '', features: ['Unlimited', 'Custom features', '24/7 support', 'White-label'] },
]

export default function Pricing() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12">Bảng giá</h2>
        <div className="grid md:grid-cols-4 gap-6">
          {plans.map((p, i) => (
            <div key={i} className={`border rounded-lg p-6 ${p.popular ? 'border-blue-600 shadow-lg' : ''}`}>
              {p.popular && <div className="bg-blue-600 text-white text-sm px-3 py-1 rounded-full inline-block mb-2">Khuyên dùng</div>}
              <h3 className="text-2xl font-bold mb-2">{p.name}</h3>
              <div className="text-3xl font-bold mb-4">{p.price}<span className="text-sm">/tháng</span></div>
              <div className="text-gray-600 mb-4">{p.users} users</div>
              <ul className="space-y-2 mb-6">
                {p.features.map((f, j) => <li key={j}> {f}</li>)}
              </ul>
              <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Chọn gói</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
