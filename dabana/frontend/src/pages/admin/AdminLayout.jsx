import { NavLink } from 'react-router-dom'
import { BarChart3, Check, Users, Star, Folder, CreditCard, ReceiptText, KeyRound, TrendingUp } from 'lucide-react'
import Navbar from '../../components/Navbar'

const TABS = [
  ['/admin',            <BarChart3 size={16} />,   'Tổng quan'],
  ['/admin/approvals',  <Check size={16} />,       'Phê duyệt'],
  ['/admin/users',      <Users size={16} />,       'Người dùng'],
  ['/admin/reviews',    <Star size={16} />,        'Đánh giá'],
  ['/admin/categories', <Folder size={16} />,      'Danh mục'],
  ['/admin/subscription-plans', <CreditCard size={16} />, 'Gói dịch vụ'],
  ['/admin/subscription-invoices', <ReceiptText size={16} />, 'Xác nhận thanh toán'],
  ['/admin/subscription-payos-config', <KeyRound size={16} />, 'Cấu hình payOS'],
  ['/admin/reports',    <TrendingUp size={16} />,  'Báo cáo'],
]

export default function AdminLayout({ title, subtitle, children }) {
  return (
    <>
      <Navbar />
      <div className="page-container page-with-navbar" style={{ padding: '2rem 1rem' }}>
        {/* Tab navigation */}
        <div className="flex gap-2" style={{ marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {TABS.map(([path, icon, label]) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/admin'}
              style={({ isActive }) => ({
                padding: '.5rem 1rem',
                borderRadius: 99,
                fontWeight: 600,
                fontSize: '.85rem',
                background: isActive ? 'var(--brand)' : 'var(--white)',
                color: isActive ? '#fff' : 'var(--text-muted)',
                border: '1.5px solid',
                borderColor: isActive ? 'var(--brand)' : 'var(--border)',
                cursor: 'pointer',
                textDecoration: 'none',
                display: 'inline-block',
              })}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem' }}>{icon}{label}</span>
            </NavLink>
          ))}
        </div>

        {(title || subtitle) && (
          <div style={{ marginBottom: '1.5rem' }}>
            {title && <h1 style={{ fontWeight: 800, fontSize: '1.4rem', marginBottom: '.25rem' }}>{title}</h1>}
            {subtitle && <p style={{ color: 'var(--text-muted)', fontSize: '.9rem' }}>{subtitle}</p>}
          </div>
        )}

        {children}
      </div>
    </>
  )
}
