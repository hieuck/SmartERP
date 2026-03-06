import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Plaster ERP - Giải pháp quản lý kho & bán hàng',
  description: 'Phần mềm quản lý kho, bán hàng, sản xuất cho doanh nghiệp vừa và nhỏ. Dùng thử miễn phí 14 ngày.',
  keywords: ['ERP', 'quản lý kho', 'bán hàng', 'sản xuất', 'phần mềm quản lý', 'doanh nghiệp'],
  authors: [{ name: 'Plaster ERP' }],
  openGraph: {
    title: 'Plaster ERP - Giải pháp quản lý toàn diện',
    description: 'Phần mềm quản lý kho, bán hàng, sản xuất cho doanh nghiệp vừa và nhỏ',
    type: 'website',
    locale: 'vi_VN',
    siteName: 'Plaster ERP',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Plaster ERP',
    description: 'Giải pháp quản lý toàn diện cho doanh nghiệp',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  )
}
