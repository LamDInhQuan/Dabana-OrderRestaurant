import { memo } from 'react'
import { getStatusMeta } from '../utils/menuStatusMeta'

const cellHead = { textAlign: 'left', padding: '.75rem 1rem', fontSize: '.75rem', color: 'var(--text-muted)', fontWeight: 600 }
const cell = { padding: '.75rem 1rem', fontSize: '.85rem', verticalAlign: 'middle' }

function MenuItemTable({
  items, loading, pageInfo, savingItemId,
  selectedIds, onToggleSelect, onToggleSelectAll,
  onEdit, onToggleStatus, onDelete, onGoToPage, categoryNameById,
}) {
  const allOnPageSelected = items.length > 0 && items.every((it) => selectedIds.includes(it.id))

  return (
    <div className="card" style={{ padding: 0 }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th style={cellHead}>
                <input type="checkbox" checked={allOnPageSelected} onChange={onToggleSelectAll} disabled={items.length === 0} />
              </th>
              <th style={cellHead}>Ảnh</th>
              <th style={cellHead}>Tên món</th>
              <th style={cellHead}>Danh mục</th>
              <th style={cellHead}>Giá</th>
              <th style={cellHead}>Trạng thái</th>
              <th style={{ ...cellHead, textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={7} style={{ ...cell, textAlign: 'center', color: 'var(--text-muted)' }}>Đang tải...</td></tr>
            )}
            {!loading && items.length === 0 && (
              <tr><td colSpan={7} style={{ ...cell, textAlign: 'center', color: 'var(--text-muted)' }}>Chưa có món nào khớp bộ lọc.</td></tr>
            )}
            {!loading && items.map((item) => {
              const meta = getStatusMeta(item.status)
              const saving = savingItemId === item.id
              return (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={cell}>
                    <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => onToggleSelect(item.id)} />
                  </td>
                  <td style={cell}>
                    {item.imageUrl
                      ? <img
                          src={item.imageUrl}
                          alt={item.itemName}
                          width={40}
                          height={40}
                          loading="lazy"
                          decoding="async"
                          style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }}
                        />
                      : <div style={{ width: 40, height: 40, borderRadius: 6, background: 'var(--border)' }} />}
                  </td>
                  <td style={cell}>
                    <div style={{ fontWeight: 600 }}>{item.itemName}</div>
                    {item.description && (
                      <div style={{ fontSize: '.75rem', color: 'var(--text-muted)', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.description}
                      </div>
                    )}
                  </td>
                  <td style={cell}>{categoryNameById[item.categoryId] || '—'}</td>
                  <td style={cell}>{Number(item.price).toLocaleString('vi-VN')}₫</td>
                  <td style={cell}><span className={`badge ${meta.badgeClass}`}>{meta.label}</span></td>
                  <td style={{ ...cell, textAlign: 'right' }}>
                    <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
                      <button className="btn-outline btn-sm" onClick={() => onEdit(item)}>Sửa</button>
                      <button className="btn-outline btn-sm" disabled={saving} onClick={() => onToggleStatus(item)}>
                        {item.status === 'SELLING' ? 'Ẩn' : 'Hiện'}
                      </button>
                      <button className="btn-outline btn-sm red" disabled={saving} onClick={() => onDelete(item.id)}>
                        Xoá
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {pageInfo.totalPages > 1 && (
        <div className="flex items-center justify-between" style={{ padding: '.75rem 1rem' }}>
          <span style={{ fontSize: '.78rem', color: 'var(--text-muted)' }}>
            Trang {pageInfo.page + 1}/{pageInfo.totalPages} — {pageInfo.totalElements} món
          </span>
          <div className="flex gap-2">
            <button className="btn-outline btn-sm" disabled={pageInfo.page === 0} onClick={() => onGoToPage(pageInfo.page - 1)}>‹ Trước</button>
            <button className="btn-outline btn-sm" disabled={pageInfo.last} onClick={() => onGoToPage(pageInfo.page + 1)}>Sau ›</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default memo(MenuItemTable)