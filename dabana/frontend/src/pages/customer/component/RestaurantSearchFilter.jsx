import { useState, useEffect, useMemo } from 'react'
import { Search } from 'lucide-react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { restaurantApi } from '../../../api'

const FIXED_RATINGS = [
  { value: '', label: 'Tất cả Đánh giá' },
  { value: '4.5', label: 'Từ 4.5 sao ★' },
  { value: '4.0', label: 'Từ 4.0 sao ★' },
  { value: '3.0', label: 'Từ 3.0 sao ★' },
]

export default function RestaurantSearchFilter({ onSearch, onCuisineSelect }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()

  const [provinces, setProvinces] = useState([])
  const [rawCuisines, setRawCuisines] = useState([])

  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '')
  const [province, setProvince] = useState(searchParams.get('province') || '')
  const [cuisine, setCuisine] = useState(searchParams.get('cuisine') || '')
  const [minRate, setMinRate] = useState(searchParams.get('minRate') || '')

  const isSearchPage = location.pathname.startsWith('/search')

  useEffect(() => {
    setKeyword(searchParams.get('keyword') || '')
    setProvince(searchParams.get('province') || '')
    setCuisine(searchParams.get('cuisine') || '')
    setMinRate(searchParams.get('minRate') || '')
  }, [searchParams])

  useEffect(() => {
    restaurantApi.getSystemOptions()
      .then(res => {
        setProvinces(res.data.data.provinces || [])
        setRawCuisines(res.data.data.cuisines || [])
      })
      .catch(err => console.error("Lỗi tải bộ lọc:", err))
  }, [])

  const flattenedCuisines = useMemo(() => {
    const set = new Set()
    rawCuisines.forEach(item => {
      if (!item) return
      item.split(',').forEach(sub => {
        const cleaned = sub.trim()
        if (cleaned) set.add(cleaned)
      })
    })
    return Array.from(set)
  }, [rawCuisines])

  const triggerSearch = (newParams) => {
    const queryParams = new URLSearchParams()
    
    const finalKeyword = newParams.keyword !== undefined ? newParams.keyword : keyword
    const finalProvince = newParams.province !== undefined ? newParams.province : province
    const finalCuisine = newParams.cuisine !== undefined ? newParams.cuisine : cuisine
    const finalMinRate = newParams.minRate !== undefined ? newParams.minRate : minRate

    if (finalKeyword) queryParams.append('keyword', finalKeyword)
    if (finalProvince) queryParams.append('province', finalProvince)
    if (finalCuisine) queryParams.append('cuisine', finalCuisine)
    if (finalMinRate) queryParams.append('minRate', finalMinRate)

    const queryString = queryParams.toString()
    navigate(`/search${queryString ? `?${queryString}` : ''}`)

    if (onSearch) {
      onSearch({
        keyword: finalKeyword,
        province: finalProvince,
        cuisine: finalCuisine,
        minRate: finalMinRate
      })
    }
  }

  const handleFullSearchSubmit = () => {
    triggerSearch({ keyword, province, cuisine, minRate })
  }

  const handleBadgeClick = (val) => {
    setCuisine(val)
    if (isSearchPage) {
      triggerSearch({ cuisine: val })
    } else {
      if (onCuisineSelect) {
        onCuisineSelect(val)
      }
    }
  }

  return (
    <div style={{ marginBottom: '2.5rem' }}>
      <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap', background: '#fff', padding: '1rem', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #e5e7eb', marginBottom: '1.25rem' }}>
        <input
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleFullSearchSubmit()}
          placeholder="Tìm tên nhà hàng, món ăn..."
          style={{ flex: 1, minWidth: 200, padding: '.75rem 1rem', border: '1px solid #d1d5db', borderRadius: 8, outline: 'none', fontSize: '0.9rem' }}
        />

        <select
          value={province}
          onChange={e => {
            setProvince(e.target.value)
            if (isSearchPage) triggerSearch({ province: e.target.value })
          }}
          style={{ width: 'auto', minWidth: 160, padding: '.75rem 1rem', border: '1px solid #d1d5db', borderRadius: 8, background: '#fff', outline: 'none', fontSize: '0.9rem' }}
        >
          <option value="">Tất cả Tỉnh/Thành</option>
          {provinces.map((p, idx) => <option key={idx} value={p}>{p}</option>)}
        </select>

        <select
          value={cuisine}
          onChange={e => {
            setCuisine(e.target.value)
            if (isSearchPage) triggerSearch({ cuisine: e.target.value })
          }}
          style={{ width: 'auto', minWidth: 160, padding: '.75rem 1rem', border: '1px solid #d1d5db', borderRadius: 8, background: '#fff', outline: 'none', fontSize: '0.9rem' }}
        >
          <option value="">Tất cả Ẩm thực</option>
          {flattenedCuisines.map((c, idx) => <option key={idx} value={c}>{c}</option>)}
        </select>

        {/* THAY THẾ PRICE RANGE BẰNG SELECT MIN RATE */}
        <select
          value={minRate}
          onChange={e => {
            setMinRate(e.target.value)
            if (isSearchPage) triggerSearch({ minRate: e.target.value })
          }}
          style={{ width: 'auto', minWidth: 160, padding: '.75rem 1rem', border: '1px solid #d1d5db', borderRadius: 8, background: '#fff', outline: 'none', fontSize: '0.9rem' }}
        >
          {FIXED_RATINGS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>

        <button 
          type="button"
          onClick={handleFullSearchSubmit} 
          style={{ background: '#5c4033', color: '#fff', border: 'none', padding: '.75rem 1.75rem', fontSize: '.9rem', fontWeight: 600, borderRadius: 8, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'background 0.2s' }}
        >
          <Search size={16} /> Tìm kiếm
        </button>
      </div>

      {/* Dãy Badge ẩm thực */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => handleBadgeClick('')}
          style={{
            padding: '7px 16px', borderRadius: '24px', fontSize: '0.85rem', cursor: 'pointer',
            border: cuisine === '' ? '1px solid #5c4033' : '1px solid #e5e7eb',
            background: cuisine === '' ? '#5c4033' : '#fff',
            color: cuisine === '' ? '#fff' : '#4b5563',
            fontWeight: cuisine === '' ? 600 : 500,
            transition: 'all 0.2s'
          }}
        >
          Tất cả
        </button>

        {flattenedCuisines.map((item, idx) => {
          const isActive = cuisine === item
          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleBadgeClick(item)}
              style={{
                padding: '7px 16px', borderRadius: '24px', fontSize: '0.85rem', cursor: 'pointer',
                border: isActive ? '1px solid #6366f1' : '1px solid #e5e7eb',
                background: isActive ? '#6366f1' : '#fff',
                color: isActive ? '#fff' : '#4b5563',
                fontWeight: isActive ? 600 : 500,
                transition: 'all 0.2s',
                boxShadow: isActive ? '0 2px 6px rgba(99, 102, 241, 0.3)' : '0 1px 2px rgba(0,0,0,0.02)'
              }}
            >
              {item}
            </button>
          )
        })}
      </div>
    </div>
  )
}