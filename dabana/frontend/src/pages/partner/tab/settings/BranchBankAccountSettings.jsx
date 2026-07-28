import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { branchBankAccountApi } from '../../../../api'

const C = {
  brown: '#5C3A1E',
  brownMid: '#7A4F2D',
  gold: '#C9A84C',
  white: '#FFFFFF',
  muted: '#888',
  border: '#E2D9CF',
  bg: '#FAF8F5',
  red: '#C0392B',
  green: '#27AE60',
}

const S = {
  card: { background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: '1.25rem' },
  eyebrow: { fontSize: '.72rem', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: C.brownMid },
  label: { fontSize: '.8rem', fontWeight: 600, color: C.brown, display: 'block', marginBottom: 4 },
  hint: { fontSize: '.74rem', color: C.muted, marginTop: 4 },
  input: {
    width: '100%', boxSizing: 'border-box', padding: '8px 10px',
    border: `1px solid ${C.border}`, borderRadius: 4, fontSize: '.88rem',
    outline: 'none', background: C.white, color: '#333',
  },
  select: {
    width: '100%', boxSizing: 'border-box', padding: '8px 10px',
    border: `1px solid ${C.border}`, borderRadius: 4, fontSize: '.88rem',
    outline: 'none', background: C.white, color: '#333',
  },
  btnGold: {
    padding: '9px 18px', background: `linear-gradient(135deg,${C.gold},#B8932A)`,
    color: '#fff', border: 'none', borderRadius: 4, fontWeight: 700,
    cursor: 'pointer', fontSize: '.85rem',
  },
  btnOut: {
    padding: '9px 18px', background: 'transparent',
    color: C.brown, border: `1px solid ${C.brown}`, borderRadius: 4,
    cursor: 'pointer', fontSize: '.85rem',
  },
  badgeOn: {
    display: 'inline-block', padding: '2px 9px', borderRadius: 20, fontSize: '.72rem',
    fontWeight: 700, background: '#E8F6EC', color: C.green,
  },
  badgeOff: {
    display: 'inline-block', padding: '2px 9px', borderRadius: 20, fontSize: '.72rem',
    fontWeight: 700, background: '#F3F0EC', color: C.muted,
  },
}

const emptyForm = {
  bankId: '', accountNumber: '', accountName: '',
  payosClientId: '', payosApiKey: '', payosChecksumKey: '',
  payosPayoutClientId: '', payosPayoutApiKey: '', payosPayoutChecksumKey: '',
}

/**
 * Man hinh cho nha hang tu nhap/sua tai khoan ngan hang + credential payOS
 * cua 1 branch (pm_branch_bank_accounts) - dung cho ca kenh THU (thu coc dat
 * ban) va kenh CHI (hoan coc). Dat trong tab "Cai dat" cua Partner, ngay canh
 * BranchLocationPicker.
 *
 * Luu y bao mat: BE khong bao gio tra ve payosApiKey/payosChecksumKey that
 * (chi tra flag payosConfigured/payosPayoutConfigured), nen o che do Sua, 3 o
 * key/checksum luon de trong - de trong = giu nguyen gia tri cu (khop voi
 * StringUtils.hasText check o BE), chi dien khi muon THAY doi.
 */
export default function BranchBankAccountSettings({ branchId }) {
  const [banks, setBanks] = useState([])
  const [account, setAccount] = useState(null) // null = chua cau hinh
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    branchBankAccountApi.listBanks()
      .then((res) => setBanks(res.data?.data || res.data || []))
      .catch(() => toast.error('Không tải được danh mục ngân hàng'))
  }, [])

  useEffect(() => {
    if (!branchId) return
    setLoading(true)
    branchBankAccountApi.getByBranch(branchId)
      .then((res) => setAccount(res.data?.data ?? res.data))
      .catch((err) => {
        if (err.response?.status === 400 || err.response?.status === 404) {
          setAccount(null) // chi nhanh chua cau hinh - khong phai loi
        } else {
          toast.error('Không tải được thông tin tài khoản ngân hàng')
        }
      })
      .finally(() => setLoading(false))
  }, [branchId])

  const openCreate = () => {
    setForm(emptyForm)
    setEditing(true)
  }

  const openEdit = () => {
    setForm({
      bankId: account.bank?.id || '',
      accountNumber: account.accountNumber || '',
      accountName: account.accountName || '',
      payosClientId: account.payosClientId || '',
      payosApiKey: '', payosChecksumKey: '',
      payosPayoutClientId: account.payosPayoutClientId || '',
      payosPayoutApiKey: '', payosPayoutChecksumKey: '',
    })
    setEditing(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.bankId || !form.accountNumber || !form.accountName) {
      toast.error('Vui lòng nhập đủ Ngân hàng, Số tài khoản, Tên chủ tài khoản')
      return
    }
    setSaving(true)
    try {
      if (account) {
        const res = await branchBankAccountApi.update(account.id, {
          bankId: Number(form.bankId),
          accountNumber: form.accountNumber,
          accountName: form.accountName,
          payosClientId: form.payosClientId,
          payosApiKey: form.payosApiKey,
          payosChecksumKey: form.payosChecksumKey,
          payosPayoutClientId: form.payosPayoutClientId,
          payosPayoutApiKey: form.payosPayoutApiKey,
          payosPayoutChecksumKey: form.payosPayoutChecksumKey,
        })
        setAccount(res.data?.data ?? res.data)
      } else {
        const res = await branchBankAccountApi.create({
          branchId,
          bankId: Number(form.bankId),
          accountNumber: form.accountNumber,
          accountName: form.accountName,
          payosClientId: form.payosClientId,
          payosApiKey: form.payosApiKey,
          payosChecksumKey: form.payosChecksumKey,
          payosPayoutClientId: form.payosPayoutClientId,
          payosPayoutApiKey: form.payosPayoutApiKey,
          payosPayoutChecksumKey: form.payosPayoutChecksumKey,
        })
        setAccount(res.data?.data ?? res.data)
      }
      toast.success('Đã lưu tài khoản ngân hàng')
      setEditing(false)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lưu thất bại')
    } finally {
      setSaving(false)
    }
  }

  if (!branchId) return null

  return (
    <div style={S.card}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={S.eyebrow}>Tài khoản ngân hàng & payOS</div>
        {account && !editing && (
          <button style={S.btnOut} onClick={openEdit}>Sửa</button>
        )}
      </div>

      {loading ? (
        <p style={{ fontSize: '.85rem', color: C.muted }}>Đang tải...</p>
      ) : editing ? (
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={S.label}>Ngân hàng *</label>
              <select style={S.select} value={form.bankId} required
                onChange={(e) => setForm((p) => ({ ...p, bankId: e.target.value }))}>
                <option value="">-- Chọn ngân hàng --</option>
                {banks.map((b) => (
                  <option key={b.id} value={b.id}>{b.shortName || b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={S.label}>Số tài khoản *</label>
              <input style={S.input} required value={form.accountNumber}
                onChange={(e) => setForm((p) => ({ ...p, accountNumber: e.target.value }))} />
            </div>
          </div>

          <div>
            <label style={S.label}>Tên chủ tài khoản *</label>
            <input style={S.input} required value={form.accountName}
              placeholder="KHÔNG DẤU, IN HOA theo chuẩn ngân hàng"
              onChange={(e) => setForm((p) => ({ ...p, accountName: e.target.value.toUpperCase() }))} />
          </div>

          <div style={{ borderTop: `1px dashed ${C.border}`, paddingTop: '1rem' }}>
            <div style={{ ...S.label, marginBottom: '.5rem' }}>Kênh THU (thu tiền cọc đặt bàn)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
              <input style={S.input} placeholder="payOS Client ID"
                value={form.payosClientId} onChange={(e) => setForm((p) => ({ ...p, payosClientId: e.target.value }))} />
              <input style={S.input} type="password" placeholder={account?.payosConfigured ? 'API Key (để trống nếu không đổi)' : 'API Key'}
                value={form.payosApiKey} onChange={(e) => setForm((p) => ({ ...p, payosApiKey: e.target.value }))} />
              <input style={S.input} type="password" placeholder={account?.payosConfigured ? 'Checksum Key (để trống nếu không đổi)' : 'Checksum Key'}
                value={form.payosChecksumKey} onChange={(e) => setForm((p) => ({ ...p, payosChecksumKey: e.target.value }))} />
            </div>
          </div>

          <div style={{ borderTop: `1px dashed ${C.border}`, paddingTop: '1rem' }}>
            <div style={{ ...S.label, marginBottom: '.5rem' }}>Kênh CHI (hoàn tiền cọc)</div>
            <p style={S.hint}>payOS quy định checksum key của kênh chi khác kênh thu, không dùng chung.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem', marginTop: '.5rem' }}>
              <input style={S.input} placeholder="payOS Payout Client ID"
                value={form.payosPayoutClientId} onChange={(e) => setForm((p) => ({ ...p, payosPayoutClientId: e.target.value }))} />
              <input style={S.input} type="password" placeholder={account?.payosPayoutConfigured ? 'Payout API Key (để trống nếu không đổi)' : 'Payout API Key'}
                value={form.payosPayoutApiKey} onChange={(e) => setForm((p) => ({ ...p, payosPayoutApiKey: e.target.value }))} />
              <input style={S.input} type="password" placeholder={account?.payosPayoutConfigured ? 'Payout Checksum Key (để trống nếu không đổi)' : 'Payout Checksum Key'}
                value={form.payosPayoutChecksumKey} onChange={(e) => setForm((p) => ({ ...p, payosPayoutChecksumKey: e.target.value }))} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '.6rem', justifyContent: 'flex-end' }}>
            <button type="button" style={S.btnOut} disabled={saving} onClick={() => setEditing(false)}>Huỷ</button>
            <button type="submit" style={S.btnGold} disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu'}</button>
          </div>
        </form>
      ) : account ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', fontSize: '.88rem' }}>
          <div><strong>{account.bank?.shortName || account.bank?.name}</strong> · {account.accountNumber} · {account.accountName}</div>
          <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginTop: '.25rem' }}>
            <span style={account.payosConfigured ? S.badgeOn : S.badgeOff}>
              Kênh Thu {account.payosConfigured ? '· Đã cấu hình' : '· Chưa cấu hình'}
            </span>
            <span style={account.payosPayoutConfigured ? S.badgeOn : S.badgeOff}>
              Kênh Chi {account.payosPayoutConfigured ? '· Đã cấu hình' : '· Chưa cấu hình'}
            </span>
            <span style={account.isActive ? S.badgeOn : S.badgeOff}>
              {account.isActive ? 'Đang hoạt động' : 'Đã tắt'}
            </span>
          </div>
        </div>
      ) : (
        <div>
          <p style={{ fontSize: '.85rem', color: C.muted, marginBottom: '.75rem' }}>
            Chi nhánh này chưa có tài khoản ngân hàng nào được cấu hình, sẽ không thu được tiền cọc online qua payOS.
          </p>
          <button style={S.btnGold} onClick={openCreate}>+ Thêm tài khoản ngân hàng</button>
        </div>
      )}
    </div>
  )
}
