'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface TrialBannerProps {
  trialEndsAt: string; // ISO date string
}

export default function TrialBanner({ trialEndsAt }: TrialBannerProps) {
  const [daysLeft, setDaysLeft] = useState(0);

  useEffect(() => {
    const calculateDaysLeft = () => {
      const now = new Date();
      const endDate = new Date(trialEndsAt);
      const diff = endDate.getTime() - now.getTime();
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      setDaysLeft(days > 0 ? days : 0);
    };

    calculateDaysLeft();
    const interval = setInterval(calculateDaysLeft, 1000 * 60 * 60); // Update every hour

    return () => clearInterval(interval);
  }, [trialEndsAt]);

  if (daysLeft === 0) {
    return (
      <div className="bg-red-600 text-white py-3 px-6">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="font-semibold">
              Thời gian dùng thử đã hết. Nâng cấp để tiếp tục sử dụng.
            </span>
          </div>
          <Link
            href="/pricing"
            className="bg-white text-red-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100"
          >
            Nâng Cấp Ngay
          </Link>
        </div>
      </div>
    );
  }

  if (daysLeft <= 3) {
    return (
      <div className="bg-yellow-500 text-gray-900 py-3 px-6">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-semibold">
              Còn {daysLeft} ngày dùng thử. Nâng cấp để không bị gián đoạn.
            </span>
          </div>
          <Link
            href="/pricing"
            className="bg-gray-900 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-800"
          >
            Xem Gói Dịch Vụ
          </Link>
        </div>
      </div>
    );
  }

  if (daysLeft <= 7) {
    return (
      <div className="bg-blue-600 text-white py-3 px-6">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              Còn {daysLeft} ngày dùng thử miễn phí
            </span>
          </div>
          <Link
            href="/pricing"
            className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100"
          >
            Nâng Cấp
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
