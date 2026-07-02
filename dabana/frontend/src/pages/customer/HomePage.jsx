import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { branchApi } from '../../api'

const CUISINE_TYPES = ['Tất cả', 'Việt Nam', 'Nhật Bản', 'Hàn Quốc', 'Ý', 'Trung Hoa', 'Hải sản']

function BranchCard({ branch, onClick }) {
  return (
    <div className="card" onClick={onClick}
      style={{ cursor: 'pointer', transition: 'box-shadow .2s', border: '1px solid var(--border)' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
    >
      <div style={{
        height: 160, borderRadius: 8, background: 'linear-gradient(135deg,var(--brand-light),#dde4ff)',
        marginBottom: '.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '2.5rem'
      }}>🍽️</div>
      <h3 style={{ fontWeight: 700, marginBottom: '.25rem' }}>{branch.name}</h3>
      <p style={{ fontSize: '.85rem', color: 'var(--text-muted)', marginBottom: '.5rem' }}>{branch.address}</p>
      <div className="flex items-center gap-2">
        <span className="badge badge-purple">{branch.restaurant?.cuisineType || 'Ẩm thực'}</span>
        <span className="badge badge-green">⭐ Mới</span>
      </div>
      <button className="btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Đặt bàn ngay</button>
    </div>
  )
}

export default function HomePage() {
  const navigate = useNavigate()
  const [branches, setBranches]     = useState([])
  const [keyword, setKeyword]       = useState('')
  const [cuisine, setCuisine]       = useState('Tất cả')
  const [loading, setLoading]       = useState(false)

  const search = async () => {
    setLoading(true)
    try {
      const params = {}
      if (keyword.trim()) params.keyword = keyword.trim()
      if (cuisine !== 'Tất cả') params.cuisineType = cuisine
      const { data } = await branchApi.search(params)
      setBranches(data.content || data || [])
    } catch {
      setBranches([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { search() }, [])

  return (
    <>
      <Navbar />

      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, var(--brand) 0%, #8B5CF6 100%)',
        padding: '4rem 1rem', textAlign: 'center', color: '#fff'
      }}>
        <h1 style={{ fontSize: 'clamp(1.8rem, 5vw, 3rem)', fontWeight: 800, marginBottom: '.75rem' }}>
          Đặt bàn nhà hàng dễ dàng
        </h1>
        <p style={{ fontSize: '1.1rem', opacity: .9, marginBottom: '2rem' }}>
          Hàng trăm nhà hàng trên toàn quốc — chọn bàn, đặt món, thanh toán cọc ngay
        </p>

        {/* Search bar */}
        <div style={{
          maxWidth: 640, margin: '0 auto', background: '#fff', borderRadius: 14,
          padding: '.75rem', display: 'flex', gap: '.75rem', boxShadow: '0 8px 32px rgba(0,0,0,.15)'
        }}>
          <input value={keyword} onChange={e => setKeyword(e.target.value)}
            placeholder="Tìm tên nhà hàng, địa chỉ..."
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: '.95rem' }}
            onKeyDown={e => e.key === 'Enter' && search()}
          />
          <button className="btn-primary" onClick={search} style={{ whiteSpace: 'nowrap' }}>
            🔍 Tìm kiếm
          </button>
        </div>

        {/* Cuisine filter pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem', justifyContent: 'center', marginTop: '1.25rem' }}>
          {CUISINE_TYPES.map(c => (
            <button key={c} onClick={() => { setCuisine(c); }}
              style={{
                padding: '.35rem .875rem', borderRadius: 99, fontSize: '.82rem', fontWeight: 600,
                background: cuisine === c ? '#fff' : 'rgba(255,255,255,.25)',
                color: cuisine === c ? 'var(--brand)' : '#fff',
                border: 'none', cursor: 'pointer'
              }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Branch listing */}
      <div className="page-container" style={{ padding: '2.5rem 1rem' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 style={{ fontWeight: 700, fontSize: '1.2rem' }}>
            {loading ? 'Đang tải...' : `${branches.length} chi nhánh`}
          </h2>
        </div>

        {branches.length === 0 && !loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
            <p>Không tìm thấy chi nhánh phù hợp. Thử từ khoá khác nhé!</p>
          </div>
        ) : (
          <div className="grid-3">
            {branches.map(b => (
              <BranchCard key={b.id} branch={b} onClick={() => navigate(`/branch/${b.id}`)} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
