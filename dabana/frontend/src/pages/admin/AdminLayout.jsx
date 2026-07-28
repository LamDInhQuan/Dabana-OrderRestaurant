import { NavLink } from 'react-router-dom'
import Navbar from '../../components/Navbar'

const TABS = [
  ['/admin',            '📊 Tổng quan'],
  ['/admin/approvals',  '✅ Phê duyệt'],
  ['/admin/users',      '👥 Người dùng'],
  ['/admin/reviews',    '⭐ Đánh giá'],
  ['/admin/categories', '🗂️ Danh mục'],
  ['/admin/subscription-plans', '💳 Gói dịch vụ'],
  ['/admin/subscription-invoices', '🧾 Xác nhận thanh toán'],
  ['/admin/subscription-payos-config', '🔑 Cấu hình payOS'],
  ['/admin/reports',    '📈 Báo cáo'],
]

export default function AdminLayout({ title, subtitle, children }) {
  return (
    <>
      <Navbar />
      <div className="page-container page-with-navbar" style={{ padding: '2rem 1rem' }}>
        {/* Tab navigation */}
        <div className="flex gap-2" style={{ marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {TABS.map(([path, label]) => (
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
              {label}
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
