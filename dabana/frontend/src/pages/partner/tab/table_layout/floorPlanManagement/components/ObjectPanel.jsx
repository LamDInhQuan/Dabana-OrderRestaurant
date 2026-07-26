import { useState, useEffect } from 'react'
import { normalizeRotation } from '../../utils/layoutTransform'
import { DECORATION_PRESETS, getPreset } from './decorationPresets'

const MARKER_PRESETS = DECORATION_PRESETS.filter((p) => p.kind === 'marker')
const FLOOR_PRESETS = DECORATION_PRESETS.filter((p) => p.kind === 'floor')
const WALL_PRESETS = DECORATION_PRESETS.filter((p) => p.kind === 'wall')
const DOOR_PRESET = DECORATION_PRESETS.find((p) => p.kind === 'door')
// "Kien truc" gop chung Tuong + Cua theo yeu cau - truoc day tach rieng 2 nhom nho
// gay roi mat, gop lai con 1 danh muc voi 2 lua chon ben trong.
const ARCHITECTURE_PRESETS = [...WALL_PRESETS, ...(DOOR_PRESET ? [DOOR_PRESET] : [])]

const DEFAULT_TABLE_SIZE = { width: 90, height: 80 }
const DEFAULT_DECORATION_SIZE = { width: 70, height: 70 }

const emptyForm = { tableName: '', capacity: 4, name: '', width: 90, height: 80, rotation: 0 }
const emptyPathForm = { name: '', strokeWidth: 20, style: 'solid', color: '#D8C9A3' }

// Panel luon cao dung bang so do (480px) va tu cuon BEN TRONG chinh no - de nguoi dung
// khong bao gio phai cuon ca trang de tim nut Luu/Xoa nam duoi cung.
const PANEL_STYLE = {
  width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '1rem',
  height: 480, overflowY: 'auto',
}

const CATEGORY_LABELS = {
  table: '🪑 Bàn', path: '🚶 Lối đi', architecture: '🏗️ Kiến trúc',
  markers: '🖼️ Nhãn / vật thể', floors: '🎨 Sàn tiểu cảnh',
}

function CategoryTab({ active, onClick, children }) {
  return (
    <button type="button" className={active ? 'btn-primary btn-sm' : 'btn-outline btn-sm'}
      onClick={onClick} style={{ flex: '1 1 auto' }}>
      {children}
    </button>
  )
}

function BackLink({ onClick, children }) {
  return (
    <button type="button" onClick={onClick} style={{
      background: 'none', border: 'none', padding: 0, cursor: 'pointer',
      fontSize: '.78rem', fontWeight: 600, color: 'var(--brand, #8B6239)',
      textAlign: 'left', width: 'fit-content',
    }}>
      {children}
    </button>
  )
}

function PresetGroup({ presets, onPick }) {
  if (!presets.length) return null
  return (
    <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
      {presets.map((opt) => (
        <button key={opt.key} type="button" className="btn-outline btn-sm" onClick={() => onPick(opt.key)}>
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export default function ObjectPanel({ floorPlan }) {
  const { selected, clearSelection, addTable, updateTable, deleteTable, updateTableGeometry,
    addDecoration, updateDecoration, deleteDecoration, savingLayout, savingTableId,
    pathDraft, startPathDraft, undoPathDraftPoint, cancelPathDraft, finishPathDraft } = floorPlan

  // category=null: chi hien tab chon danh muc, chua vao muc nao ca. Day la man hinh
  // MAC DINH luc dau - nguoi dung phai chon 1 danh muc truoc khi thay bat ky form nao,
  // tranh tinh trang tat ca nut + form hien cung luc gay roi mat nhu truoc.
  const [category, setCategory] = useState(null)
  const [showMoreCategories, setShowMoreCategories] = useState(false)
  const [kind, setKind] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [pathForm, setPathForm] = useState(emptyPathForm)
  const [doorFlip, setDoorFlip] = useState(false)
  const [floorFullCover, setFloorFullCover] = useState(true)

  const isEditing = !!selected
  const editingKind = selected?.type === 'table' ? 'table' : selected?.type === 'decoration' ? selected.data.shape : null
  const isEditingPath = selected?.type === 'decoration' && selected.data.kind === 'path'
  const isDrawingPath = Array.isArray(pathDraft)
  const isDoor = kind === 'door'
  const isFloorKind = getPreset(kind)?.kind === 'floor'

  useEffect(() => {
    if (selected?.type === 'table') {
      setKind('table')
      setForm({
        tableName: selected.data.tableName, capacity: selected.data.capacity, name: '',
        width: selected.data.width ?? DEFAULT_TABLE_SIZE.width,
        height: selected.data.height ?? DEFAULT_TABLE_SIZE.height,
        rotation: selected.data.rotation ?? 0,
      })
    } else if (selected?.type === 'decoration' && selected.data.kind === 'path') {
      setPathForm({
        name: selected.data.name, strokeWidth: selected.data.strokeWidth ?? 20,
        style: selected.data.style ?? 'solid', color: selected.data.color ?? '#D8C9A3',
      })
    } else if (selected?.type === 'decoration') {
      setKind(selected.data.shape)
      setForm({
        tableName: '', capacity: 4, name: selected.data.name,
        width: selected.data.width ?? DEFAULT_DECORATION_SIZE.width,
        height: selected.data.height ?? DEFAULT_DECORATION_SIZE.height,
        rotation: selected.data.rotation ?? 0,
      })
      setDoorFlip(!!selected.data.flip)
      setFloorFullCover(selected.data.fullCover !== false)
    }
  }, [selected])

  const startCreate = (k) => {
    clearSelection()
    cancelPathDraft()
    setKind(k)
    setDoorFlip(false)
    setFloorFullCover(true)
    const preset = getPreset(k)
    const size = k === 'table' ? DEFAULT_TABLE_SIZE : (preset?.defaultSize || DEFAULT_DECORATION_SIZE)
    setForm({ ...emptyForm, ...size, name: k === 'table' ? '' : (preset?.defaultName || '') })
  }

  // Chon 1 danh muc tu man hinh tab. Bàn/Lối đi chỉ có 1 lựa chọn duy nhất nên vào
  // thẳng form/chế độ vẽ luôn; Kiến trúc/Nhãn-vật thể/Sàn tiểu cảnh có nhiều lựa chọn
  // nên dừng lại ở màn hình danh sách con, chờ người dùng bấm chọn tiếp.
  const selectCategory = (cat) => {
    clearSelection()
    cancelPathDraft()
    setCategory(cat)
    if (cat === 'table') startCreate('table')
    else if (cat === 'path') { setKind(null); startPathDraft() }
    else setKind(null)
  }

  const handleBackToCategories = () => {
    setCategory(null)
    setKind(null)
  }

  // Tu form tao moi quay lai: neu la danh muc 1-lua-chon (Ban) thi ve thang man hinh
  // chon danh muc; neu la danh muc nhieu lua chon thi chi lui ve danh sach con (van o
  // trong cung danh muc do).
  const handleBackFromForm = () => {
    if (category === 'table') handleBackToCategories()
    else setKind(null)
  }

  const handleCancelSelection = () => {
    clearSelection()
    setCategory(null)
    setKind(null)
  }

  const handleCancelPath = () => {
    cancelPathDraft()
    setCategory(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const width = Number(form.width)
    // Cua luon la khoi vuong width x width de dung hinh hoc ky hieu (canh cua + cung
    // xoay ban kinh = width) - khong dung form.height nguoi dung nhap cho loai nay.
    const height = isDoor ? width : Number(form.height)
    const rotation = normalizeRotation(Number(form.rotation) || 0)
    let ok = false

    if (kind === 'table') {
      if (isEditing) {
        ok = await updateTable(selected.data.id, { tableName: form.tableName, capacity: Number(form.capacity) })
        const geometryChanged = width !== (selected.data.width ?? DEFAULT_TABLE_SIZE.width)
          || height !== (selected.data.height ?? DEFAULT_TABLE_SIZE.height)
          || rotation !== (selected.data.rotation ?? 0)
        if (ok && geometryChanged) {
          await updateTableGeometry(selected.data.id, { width, height, rotation })
        }
      } else {
        ok = await addTable({ tableName: form.tableName, capacity: Number(form.capacity), width, height, rotation })
      }
    } else {
      const extra = isDoor ? { width, height, rotation, flip: doorFlip }
        : isFloorKind ? { width, height, rotation, fullCover: floorFullCover }
        : { width, height, rotation }
      ok = isEditing
        ? await updateDecoration(selected.data.id, { name: form.name, ...extra })
        : await addDecoration(kind, form.name, extra)
    }
    if (ok && !isEditing) {
      const preset = getPreset(kind)
      const size = kind === 'table' ? DEFAULT_TABLE_SIZE : (preset?.defaultSize || DEFAULT_DECORATION_SIZE)
      setForm({ ...emptyForm, ...size })
    }
  }

  const handlePathFinish = async () => {
    const ok = await finishPathDraft(pathForm.name, {
      strokeWidth: Number(pathForm.strokeWidth) || 20, style: pathForm.style, color: pathForm.color,
    })
    if (ok) { setPathForm(emptyPathForm); setCategory(null) }
  }

  const handlePathSave = async () => {
    const ok = await updateDecoration(selected.data.id, {
      name: pathForm.name, strokeWidth: Number(pathForm.strokeWidth) || 20,
      style: pathForm.style, color: pathForm.color,
    })
    if (ok) handleCancelSelection()
  }

  const handleDelete = async () => {
    if (!selected) return
    if (!window.confirm('Xoá vật thể này khỏi sơ đồ?')) return
    if (selected.type === 'table') await deleteTable(selected.data)
    else await deleteDecoration(selected.data.id)
    setCategory(null)
    setKind(null)
  }

  // ==================== 1. Che do dang ve duong di ====================
  if (isDrawingPath) {
    return (
      <div className="card" style={PANEL_STYLE}>
        <div>
          <div style={{ fontWeight: 700, marginBottom: '.3rem' }}>🚶 Đang vẽ đường đi</div>
          <p style={{ fontSize: '.8rem', color: 'var(--text-muted)', margin: 0 }}>
            Nhấp vào từng điểm trên sơ đồ theo thứ tự để tạo lối đi. Đã chọn <b>{pathDraft.length}</b> điểm
            (cần tối thiểu 2).
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn-outline btn-sm" onClick={undoPathDraftPoint} disabled={!pathDraft.length}>
            ↩ Xoá điểm cuối
          </button>
          <button type="button" className="btn-outline btn-sm" onClick={handleCancelPath} style={{ color: '#EF4444' }}>
            Huỷ
          </button>
        </div>
        <div>
          <label style={{ fontSize: '.85rem', fontWeight: 500, display: 'block', marginBottom: '.3rem' }}>Tên đường đi</label>
          <input value={pathForm.name} onChange={(e) => setPathForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="VD: Lối vào chính" />
        </div>
        <div className="flex gap-2">
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '.8rem', fontWeight: 500, display: 'block', marginBottom: '.3rem' }}>Bề rộng (px)</label>
            <input type="number" min={6} max={80} value={pathForm.strokeWidth}
              onChange={(e) => setPathForm((p) => ({ ...p, strokeWidth: e.target.value }))} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '.8rem', fontWeight: 500, display: 'block', marginBottom: '.3rem' }}>Kiểu</label>
            <select value={pathForm.style} onChange={(e) => setPathForm((p) => ({ ...p, style: e.target.value }))}>
              <option value="solid">Đường liền (đất/gạch)</option>
              <option value="stones">Đá lát rời</option>
            </select>
          </div>
        </div>
        <div>
          <label style={{ fontSize: '.8rem', fontWeight: 500, display: 'block', marginBottom: '.3rem' }}>Màu</label>
          <input type="color" value={pathForm.color} onChange={(e) => setPathForm((p) => ({ ...p, color: e.target.value }))} />
        </div>
        <button type="button" className="btn-primary btn-sm" disabled={pathDraft.length < 2 || savingLayout}
          onClick={handlePathFinish}>
          ✓ Hoàn tất ({pathDraft.length} điểm)
        </button>
      </div>
    )
  }

  // ==================== 2. Dang sua 1 duong di co san ====================
  if (isEditingPath) {
    return (
      <div className="card" style={PANEL_STYLE}>
        <div style={{ fontSize: '.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
          Đang sửa: {pathForm.name || 'Đường đi'}
        </div>
        <div>
          <label style={{ fontSize: '.85rem', fontWeight: 500, display: 'block', marginBottom: '.3rem' }}>Tên đường đi</label>
          <input value={pathForm.name} onChange={(e) => setPathForm((p) => ({ ...p, name: e.target.value }))} required />
        </div>
        <div className="flex gap-2">
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '.8rem', fontWeight: 500, display: 'block', marginBottom: '.3rem' }}>Bề rộng (px)</label>
            <input type="number" min={6} max={80} value={pathForm.strokeWidth}
              onChange={(e) => setPathForm((p) => ({ ...p, strokeWidth: e.target.value }))} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '.8rem', fontWeight: 500, display: 'block', marginBottom: '.3rem' }}>Kiểu</label>
            <select value={pathForm.style} onChange={(e) => setPathForm((p) => ({ ...p, style: e.target.value }))}>
              <option value="solid">Đường liền (đất/gạch)</option>
              <option value="stones">Đá lát rời</option>
            </select>
          </div>
        </div>
        <div>
          <label style={{ fontSize: '.8rem', fontWeight: 500, display: 'block', marginBottom: '.3rem' }}>Màu</label>
          <input type="color" value={pathForm.color} onChange={(e) => setPathForm((p) => ({ ...p, color: e.target.value }))} />
        </div>
        <p style={{ fontSize: '.72rem', color: 'var(--text-muted)', margin: 0 }}>
          💡 Kéo các chấm xanh trên sơ đồ để chỉnh từng điểm của đường đi.
        </p>
        <div className="flex gap-2">
          <button type="button" className="btn-outline btn-sm" onClick={handleDelete} style={{ color: '#EF4444' }}>Xoá</button>
          <button type="button" className="btn-primary btn-sm" style={{ flex: 1 }} disabled={savingLayout} onClick={handlePathSave}>
            Lưu thông tin
          </button>
        </div>
        <button type="button" className="btn-outline btn-sm" onClick={handleCancelSelection}>Huỷ chọn</button>
      </div>
    )
  }

  // ==================== 3. Form chung (Ban/Nhan/San/Kien truc) - dung chung cho ====================
  // ====================    ca tao moi (kind da chon) va sua vat co san (isEditing)  ====================
  const renderMainForm = () => (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
      <div style={{ fontSize: '.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
        {isEditing ? `Đang sửa: ${editingKind === 'table' ? form.tableName : form.name}` : 'Thông tin vật thể mới'}
      </div>

      {kind === 'table' ? (
        <>
          <div>
            <label style={{ fontSize: '.85rem', fontWeight: 500, display: 'block', marginBottom: '.3rem' }}>Tên bàn</label>
            <input value={form.tableName}
              onChange={(e) => setForm((p) => ({ ...p, tableName: e.target.value }))}
              placeholder="VD: T01, VIP-02" required />
          </div>
          <div>
            <label style={{ fontSize: '.85rem', fontWeight: 500, display: 'block', marginBottom: '.3rem' }}>Sức chứa (khách)</label>
            <input type="number" min={1} value={form.capacity}
              onChange={(e) => setForm((p) => ({ ...p, capacity: e.target.value }))} />
          </div>
        </>
      ) : (
        <div>
          <label style={{ fontSize: '.85rem', fontWeight: 500, display: 'block', marginBottom: '.3rem' }}>Tên minh hoạ</label>
          <input value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder={getPreset(kind)?.defaultName || 'VD: Quầy bar, Sân khấu'} required />
        </div>
      )}

      {isFloorKind && (
        <div>
          <label className="flex items-center gap-2" style={{ fontSize: '.85rem', fontWeight: 500, cursor: 'pointer' }}>
            <input type="checkbox" checked={floorFullCover} onChange={(e) => setFloorFullCover(e.target.checked)} />
            Phủ toàn bộ khu vực (khuyên dùng)
          </label>
          <p style={{ fontSize: '.72rem', color: 'var(--text-muted)', margin: '.3rem 0 0' }}>
            {floorFullCover
              ? 'Sàn sẽ tự lấp đầy toàn bộ canvas, không cần chỉnh kích thước/vị trí.'
              : 'Bỏ chọn để đặt 1 mảng sàn nhỏ cục bộ (ví dụ góc vườn) - kéo/đổi cỡ như bình thường.'}
          </p>
        </div>
      )}

      {!(isFloorKind && floorFullCover) && (
        <>
          <div style={{ fontSize: '.8rem', fontWeight: 600, color: 'var(--text-muted)', marginTop: '.25rem' }}>
            Kích thước &amp; góc xoay
          </div>
          <div className="flex gap-2">
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '.8rem', fontWeight: 500, display: 'block', marginBottom: '.3rem' }}>
                {isDoor ? 'Bề rộng cửa (px)' : 'Rộng (px)'}
              </label>
              <input type="number" min={20} max={500} value={form.width}
                onChange={(e) => setForm((p) => ({ ...p, width: e.target.value }))} />
            </div>
            {!isDoor && (
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '.8rem', fontWeight: 500, display: 'block', marginBottom: '.3rem' }}>Cao (px)</label>
                <input type="number" min={20} max={500} value={form.height}
                  onChange={(e) => setForm((p) => ({ ...p, height: e.target.value }))} />
              </div>
            )}
          </div>
          <div>
            <label style={{ fontSize: '.8rem', fontWeight: 500, display: 'block', marginBottom: '.3rem' }}>Góc xoay (độ)</label>
            <input type="number" min={0} max={359.99} step={0.5} value={form.rotation}
              onChange={(e) => setForm((p) => ({ ...p, rotation: e.target.value }))} />
          </div>
        </>
      )}
      {isDoor && (
        <div>
          <label style={{ fontSize: '.8rem', fontWeight: 500, display: 'block', marginBottom: '.3rem' }}>Hướng mở</label>
          <div className="flex gap-2">
            <button type="button" className={!doorFlip ? 'btn-primary btn-sm' : 'btn-outline btn-sm'} onClick={() => setDoorFlip(false)}>
              Mở trái
            </button>
            <button type="button" className={doorFlip ? 'btn-primary btn-sm' : 'btn-outline btn-sm'} onClick={() => setDoorFlip(true)}>
              Mở phải
            </button>
          </div>
          <p style={{ fontSize: '.72rem', color: 'var(--text-muted)', margin: '.3rem 0 0' }}>
            💡 Dùng "Góc xoay" để đặt cửa đúng theo hướng tường thật.
          </p>
        </div>
      )}
      {!isDoor && !(isFloorKind && floorFullCover) && (
        <p style={{ fontSize: '.72rem', color: 'var(--text-muted)', margin: 0 }}>
          💡 Cũng có thể kéo tay cầm trên sơ đồ để đổi kích cỡ / xoay bằng chuột.
        </p>
      )}

      <div className="flex gap-2">
        {isEditing && (
          <button type="button" className="btn-outline btn-sm" onClick={handleDelete} style={{ color: '#EF4444' }}>Xoá</button>
        )}
        <button type="submit" className="btn-primary btn-sm" style={{ flex: 1 }} disabled={savingLayout || !!savingTableId}>
          {isEditing ? 'Lưu thông tin' : kind === 'table' ? '+ Thêm bàn' : '+ Thêm vật thể'}
        </button>
      </div>
      {isEditing && (
        <button type="button" className="btn-outline btn-sm" onClick={handleCancelSelection}>Huỷ chọn</button>
      )}
    </form>
  )

  // ==================== 4. Dang sua 1 ban/vat the (khong phai path) co san tren so do ====================
  // Vao thang form, khong can chon lai danh muc - vat the da co san roi thi chi can sua.
  if (isEditing) {
    return <div className="card" style={PANEL_STYLE}>{renderMainForm()}</div>
  }

  // ==================== 5. Chua chon danh muc nao - MAN HINH MAC DINH luc dau ====================
  if (!category) {
    return (
      <div className="card" style={PANEL_STYLE}>
        <div style={{ fontSize: '.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Thêm mới</div>
        <p style={{ fontSize: '.78rem', color: 'var(--text-muted)', margin: '-.5rem 0 0' }}>
          Chọn 1 danh mục bên dưới để bắt đầu thêm vào sơ đồ.
        </p>
        <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
          <CategoryTab onClick={() => selectCategory('table')}>{CATEGORY_LABELS.table}</CategoryTab>
          <CategoryTab onClick={() => selectCategory('path')}>{CATEGORY_LABELS.path}</CategoryTab>
          <CategoryTab onClick={() => selectCategory('architecture')}>{CATEGORY_LABELS.architecture}</CategoryTab>
        </div>
        {!showMoreCategories ? (
          <BackLink onClick={() => setShowMoreCategories(true)}>+ Thêm danh mục khác (Sàn, Nhãn/vật thể)</BackLink>
        ) : (
          <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
            <CategoryTab onClick={() => selectCategory('markers')}>{CATEGORY_LABELS.markers}</CategoryTab>
            <CategoryTab onClick={() => selectCategory('floors')}>{CATEGORY_LABELS.floors}</CategoryTab>
          </div>
        )}
      </div>
    )
  }

  // ==================== 6. Da chon danh muc nhieu-lua-chon, CHUA chon item cu the ====================
  if (category !== 'table' && kind === null) {
    const presets = category === 'architecture' ? ARCHITECTURE_PRESETS
      : category === 'markers' ? MARKER_PRESETS
      : FLOOR_PRESETS
    return (
      <div className="card" style={PANEL_STYLE}>
        <BackLink onClick={handleBackToCategories}>← Danh mục</BackLink>
        <div style={{ fontWeight: 700 }}>{CATEGORY_LABELS[category]}</div>
        <PresetGroup presets={presets} onPick={startCreate} />
      </div>
    )
  }

  // ==================== 7. Da chon item cu the (hoac danh muc Ban) - hien form tao moi ====================
  return (
    <div className="card" style={PANEL_STYLE}>
      <BackLink onClick={handleBackFromForm}>
        {category === 'table' ? '← Danh mục' : `← ${CATEGORY_LABELS[category]}`}
      </BackLink>
      {renderMainForm()}
    </div>
  )
}