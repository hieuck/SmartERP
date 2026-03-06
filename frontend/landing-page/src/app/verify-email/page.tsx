'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  const handleResend = async () => {
    setIsResending(true);
    setResendMessage('');

    try {
      // TODO: Call resend verification API
      await new Promise(resolve => setTimeout(resolve, 1000));
      setResendMessage('Email xác thực đã được gửi lại!');
    } catch (error) {
      setResendMessage('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Kiểm Tra Email Của Bạn
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            Chúng tôi đã gửi email xác thực đến:
          </p>
          <p className="text-xl font-semibold text-blue-600 mb-6">
            {email}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="space-y-6">
            <div className="flex items-start">
              <div className="text-2xl mr-4">📧</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Bước 1: Mở Email</h3>
                <p className="text-gray-600 text-sm">
                  Kiểm tra hộp thư đến hoặc thư mục spam
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="text-2xl mr-4">🔗</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Bước 2: Click Link</h3>
                <p className="text-gray-600 text-sm">
                  Nhấp vào link xác thực trong email
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="text-2xl mr-4">✅</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Bước 3: Hoàn Tất</h3>
                <p className="text-gray-600 text-sm">
                  Tài khoản của bạn sẽ được kích hoạt
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-gray-600 text-sm text-center mb-4">
              Không nhận được email?
            </p>
            <button
              onClick={handleResend}
              disabled={isResending}
              className={`w-full py-3 rounded-lg font-semibold transition ${
                isResending
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isResending ? 'Đang gửi...' : 'Gửi Lại Email'}
            </button>
            {resendMessage && (
              <p className={`text-sm text-center mt-3 ${
                resendMessage.includes('lỗi') ? 'text-red-600' : 'text-green-600'
              }`}>
                {resendMessage}
              </p>
            )}
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4">
            Đã xác thực email?
          </p>
          <Link
            href="/login"
            className="inline-block bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold border-2 border-blue-600 hover:bg-blue-50"
          >
            Đăng Nhập Ngay
          </Link>
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="text-gray-600 hover:text-blue-600">
            ← Quay lại trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
