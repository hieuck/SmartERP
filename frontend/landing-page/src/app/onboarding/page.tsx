'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Company Info
    companyName: '',
    industry: '',
    employeeCount: '',
    
    // Step 2: Warehouse
    warehouseName: '',
    warehouseAddress: '',
    
    // Step 3: Sample Data
    useSampleData: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleFinish = async () => {
    // TODO: Save onboarding data
    window.location.href = '/dashboard';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Progress Bar */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className="flex items-center flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    s <= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {s}
                  </div>
                  {s < 4 && (
                    <div className={`flex-1 h-1 mx-2 ${
                      s < step ? 'bg-blue-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Công ty</span>
              <span>Kho hàng</span>
              <span>Dữ liệu mẫu</span>
              <span>Hoàn tất</span>
            </div>
          </div>

          {/* Step Content */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {/* Step 1: Company Info */}
            {step === 1 && (
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Thông Tin Công Ty
                </h2>
                <p className="text-gray-600 mb-8">
                  Cho chúng tôi biết thêm về doanh nghiệp của bạn
                </p>

                <div className="space-y-6">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      Tên Công Ty *
                    </label>
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      placeholder="Công ty ABC"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      Ngành Nghề
                    </label>
                    <select
                      name="industry"
                      value={formData.industry}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    >
                      <option value="">Chọn ngành nghề</option>
                      <option value="manufacturing">Sản xuất</option>
                      <option value="retail">Bán lẻ</option>
                      <option value="wholesale">Bán sỉ</option>
                      <option value="construction">Xây dựng</option>
                      <option value="food">Thực phẩm</option>
                      <option value="other">Khác</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      Số Lượng Nhân Viên
                    </label>
                    <select
                      name="employeeCount"
                      value={formData.employeeCount}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    >
                      <option value="">Chọn số lượng</option>
                      <option value="1-10">1-10 người</option>
                      <option value="11-50">11-50 người</option>
                      <option value="51-200">51-200 người</option>
                      <option value="200+">Trên 200 người</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Warehouse */}
            {step === 2 && (
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Kho Hàng Đầu Tiên
                </h2>
                <p className="text-gray-600 mb-8">
                  Tạo kho hàng đầu tiên để bắt đầu quản lý tồn kho
                </p>

                <div className="space-y-6">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      Tên Kho *
                    </label>
                    <input
                      type="text"
                      name="warehouseName"
                      value={formData.warehouseName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      placeholder="Kho chính"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      Địa Chỉ Kho
                    </label>
                    <input
                      type="text"
                      name="warehouseAddress"
                      value={formData.warehouseAddress}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      placeholder="123 Đường ABC, Quận 1, TP.HCM"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Sample Data */}
            {step === 3 && (
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Dữ Liệu Mẫu
                </h2>
                <p className="text-gray-600 mb-8">
                  Nhập dữ liệu mẫu để khám phá hệ thống nhanh hơn
                </p>

                <div className="bg-blue-50 rounded-xl p-6 mb-6">
                  <label className="flex items-start cursor-pointer">
                    <input
                      type="checkbox"
                      name="useSampleData"
                      checked={formData.useSampleData}
                      onChange={handleChange}
                      className="mt-1 mr-4"
                    />
                    <div>
                      <div className="font-semibold text-gray-900 mb-2">
                        Sử dụng dữ liệu mẫu
                      </div>
                      <div className="text-gray-600 text-sm">
                        Chúng tôi sẽ tạo sẵn một số sản phẩm, khách hàng và đơn hàng mẫu để bạn có thể trải nghiệm ngay
                      </div>
                    </div>
                  </label>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="text-2xl mr-4">📦</div>
                    <div>
                      <div className="font-semibold">50 sản phẩm mẫu</div>
                      <div className="text-sm text-gray-600">Các sản phẩm phổ biến với giá và mô tả</div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="text-2xl mr-4">👥</div>
                    <div>
                      <div className="font-semibold">20 khách hàng mẫu</div>
                      <div className="text-sm text-gray-600">Danh sách khách hàng với thông tin liên hệ</div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="text-2xl mr-4">📋</div>
                    <div>
                      <div className="font-semibold">10 đơn hàng mẫu</div>
                      <div className="text-sm text-gray-600">Đơn hàng với các trạng thái khác nhau</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Complete */}
            {step === 4 && (
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Hoàn Tất!
                </h2>
                <p className="text-xl text-gray-600 mb-8">
                  Tài khoản của bạn đã sẵn sàng. Hãy bắt đầu khám phá Plaster ERP!
                </p>

                <div className="bg-blue-50 rounded-xl p-6 mb-8">
                  <h3 className="font-semibold text-gray-900 mb-4">Bước tiếp theo:</h3>
                  <ul className="text-left space-y-2 text-gray-700">
                    <li className="flex items-center">
                      <span className="text-blue-600 mr-2">✓</span>
                      Thêm sản phẩm vào kho
                    </li>
                    <li className="flex items-center">
                      <span className="text-blue-600 mr-2">✓</span>
                      Tạo đơn hàng đầu tiên
                    </li>
                    <li className="flex items-center">
                      <span className="text-blue-600 mr-2">✓</span>
                      Mời thành viên tham gia
                    </li>
                    <li className="flex items-center">
                      <span className="text-blue-600 mr-2">✓</span>
                      Xem báo cáo và phân tích
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-8 border-t border-gray-200">
              {step > 1 && step < 4 && (
                <button
                  onClick={handleBack}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
                >
                  Quay Lại
                </button>
              )}
              {step < 4 ? (
                <button
                  onClick={handleNext}
                  className="ml-auto px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                >
                  Tiếp Theo
                </button>
              ) : (
                <button
                  onClick={handleFinish}
                  className="w-full px-6 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                >
                  Bắt Đầu Sử Dụng
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
