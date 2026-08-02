import React, { useState, useMemo, useRef, useEffect } from 'react'
import { Search, X, ChevronDown, Check, Landmark } from 'lucide-react'

export default function BankSelect({
  banks = [],
  value = '',
  onChange,
  disabled = false,
  required = false,
  label = 'Ngân hàng thụ hưởng:',
  searchPlaceholder = 'Tìm nhanh theo tên viết tắt (VCB, MB, ACB, TPB...)...',
  selectPlaceholder = '-- Chọn ngân hàng thụ hưởng --',
  style = {},
  hideLabel = false
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const containerRef = useRef(null)
  const searchInputRef = useRef(null)

  // Tìm kiếm theo shortName, code, name hoặc bin
  const filteredBanks = useMemo(() => {
    if (!searchTerm.trim()) return banks
    const term = searchTerm.trim().toLowerCase()
    return banks.filter(b => {
      const shortName = (b.shortName || '').toLowerCase()
      const code = (b.code || '').toLowerCase()
      const name = (b.name || '').toLowerCase()
      const bin = (b.bin || '').toLowerCase()
      return shortName.includes(term) || code.includes(term) || name.includes(term) || bin.includes(term)
    })
  }, [banks, searchTerm])

  // Lấy ngân hàng đang được chọn
  const selectedBank = useMemo(() => {
    return banks.find(b => String(b.id) === String(value))
  }, [banks, value])

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      // Focus vào ô tìm kiếm khi mở popup
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 50)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSelectBank = (bankId) => {
    if (onChange) {
      onChange(String(bankId))
    }
    setIsOpen(false)
    setSearchTerm('')
  }

  const handleClear = (e) => {
    e.stopPropagation()
    if (onChange) {
      onChange('')
    }
    setSearchTerm('')
  }

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '.35rem',
        position: 'relative',
        ...style
      }}
    >
      {!hideLabel && label && (
        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '.83rem', fontWeight: 600, color: '#374151', margin: 0 }}>
          <Landmark size={14} style={{ color: '#0284c7' }} /> {label} {required && <span style={{ color: '#DC2626' }}>*</span>}
        </label>
      )}

      {/* NÚT / Ô DROPDOWN CHÍNH */}
      <div
        tabIndex={disabled ? -1 : 0}
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen)
            setSearchTerm('')
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            if (!disabled) setIsOpen(!isOpen)
          } else if (e.key === 'Escape') {
            setIsOpen(false)
          }
        }}
        style={{
          width: '100%',
          minHeight: '40px',
          padding: '.5rem .75rem',
          borderRadius: '8px',
          border: isOpen ? '1.5px solid #0284c7' : '1.5px solid #d1d5db',
          background: disabled ? '#f3f4f6' : '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: disabled ? 'not-allowed' : 'pointer',
          outline: 'none',
          boxSizing: 'border-box',
          boxShadow: isOpen ? '0 0 0 3px rgba(2, 132, 199, 0.15)' : 'none',
          transition: 'all 0.15s ease'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '.55rem', overflow: 'hidden', flex: 1 }}>
          {selectedBank ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', overflow: 'hidden' }}>
              {selectedBank.logoUrl ? (
                <img
                  src={selectedBank.logoUrl}
                  alt={selectedBank.shortName}
                  style={{ width: 24, height: 24, objectFit: 'contain', borderRadius: '4px', flexShrink: 0 }}
                  onError={(e) => { e.target.style.display = 'none' }}
                />
              ) : (
                <div style={{
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: '#e0f2fe',
                  color: '#0369a1',
                  fontWeight: 700,
                  fontSize: '.72rem',
                  flexShrink: 0
                }}>
                  {selectedBank.shortName || selectedBank.code || 'NH'}
                </div>
              )}
              <span style={{
                fontSize: '.88rem',
                color: '#0f172a',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                <strong style={{ color: '#0284c7' }}>{selectedBank.shortName || selectedBank.code}</strong> - {selectedBank.name}
              </span>
            </div>
          ) : (
            <span style={{ fontSize: '.86rem', color: '#9ca3af' }}>
              {selectPlaceholder}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0, marginLeft: '6px' }}>
          {selectedBank && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              style={{
                border: 'none',
                background: 'transparent',
                padding: '2px',
                cursor: 'pointer',
                color: '#9ca3af',
                display: 'flex',
                alignItems: 'center',
                borderRadius: '50%'
              }}
              title="Bỏ chọn"
            >
              <X size={14} />
            </button>
          )}
          <ChevronDown
            size={16}
            style={{
              color: '#64748b',
              transform: isOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s ease'
            }}
          />
        </div>
      </div>

      {/* DROPDOWN MENU POPOVER KHI BẤM VÀO */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 1100,
            background: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #cbd5e1',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
            animation: 'fadeIn 0.15s ease-out'
          }}
        >
          {/* PHẦN INPUT TÌM KIẾM NHANH BÊN TRONG DROPDOWN */}
          <div
            style={{
              padding: '.55rem .65rem',
              borderBottom: '1px solid #f1f5f9',
              background: '#f8fafc',
              position: 'relative',
              display: 'flex',
              alignItems: 'center'
            }}
            onClick={e => e.stopPropagation()}
          >
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '18px',
                color: '#94a3b8',
                pointerEvents: 'none'
              }}
            />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder={searchPlaceholder}
              style={{
                width: '100%',
                padding: '.5rem .65rem .5rem 2rem',
                borderRadius: '6px',
                border: '1.5px solid #cbd5e1',
                fontSize: '.84rem',
                background: '#ffffff',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s'
              }}
              onFocus={e => e.target.style.borderColor = '#0284c7'}
              onBlur={e => e.target.style.borderColor = '#cbd5e1'}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                style={{
                  position: 'absolute',
                  right: '16px',
                  border: 'none',
                  background: 'transparent',
                  padding: '2px',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Xoá tìm kiếm"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* DANH SÁCH CÁC NGÂN HÀNG (SCROLLABLE) */}
          <div
            style={{
              maxHeight: '250px',
              overflowY: 'auto',
              padding: '.35rem 0'
            }}
          >
            {filteredBanks.length === 0 ? (
              <div style={{ padding: '1.25rem 1rem', textAlign: 'center', color: '#64748b', fontSize: '.85rem' }}>
                Không tìm thấy ngân hàng khớp với "<strong>{searchTerm}</strong>"
              </div>
            ) : (
              filteredBanks.map((bank) => {
                const isSelected = String(bank.id) === String(value)
                return (
                  <div
                    key={bank.id}
                    onClick={() => handleSelectBank(bank.id)}
                    style={{
                      padding: '.55rem .85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      background: isSelected ? '#f0f9ff' : 'transparent',
                      transition: 'background 0.15s ease',
                      borderLeft: isSelected ? '3px solid #0284c7' : '3px solid transparent'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = '#f8fafc'
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem', overflow: 'hidden' }}>
                      {bank.logoUrl ? (
                        <img
                          src={bank.logoUrl}
                          alt={bank.shortName}
                          style={{ width: 26, height: 26, objectFit: 'contain', borderRadius: '4px', flexShrink: 0 }}
                          onError={(e) => { e.target.style.display = 'none' }}
                        />
                      ) : (
                        <div style={{
                          padding: '3px 6px',
                          borderRadius: '4px',
                          background: isSelected ? '#bae6fd' : '#f1f5f9',
                          color: isSelected ? '#0369a1' : '#475569',
                          fontWeight: 700,
                          fontSize: '.72rem',
                          flexShrink: 0
                        }}>
                          {bank.shortName || bank.code || 'NH'}
                        </div>
                      )}

                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                          <span style={{ fontSize: '.86rem', fontWeight: 700, color: isSelected ? '#0284c7' : '#0f172a' }}>
                            {bank.shortName || bank.code}
                          </span>
                          {bank.code && bank.code !== bank.shortName && (
                            <span style={{ fontSize: '.72rem', color: '#64748b', background: '#f1f5f9', padding: '0 4px', borderRadius: '3px' }}>
                              {bank.code}
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '.78rem', color: '#64748b', lineHeight: '1.2' }}>
                          {bank.name}
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <Check size={16} color="#0284c7" style={{ flexShrink: 0, marginLeft: '8px' }} />
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* FOOTER NHỎ HIỂN THỊ TỔNG SỐ NGÂN HÀNG */}
          <div style={{
            padding: '.4rem .85rem',
            background: '#f8fafc',
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '.72rem',
            color: '#64748b'
          }}>
            <span>{searchTerm ? `Khớp: ${filteredBanks.length} ngân hàng` : `Tổng: ${banks.length} ngân hàng`}</span>
            <span>Hỗ trợ: VietQR / NAPAS</span>
          </div>
        </div>
      )}
    </div>
  )
}
