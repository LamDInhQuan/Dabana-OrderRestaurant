import { useState, useEffect } from 'react'
import { normalizeRotation } from '../../utils/layoutTransform'
import { DECORATION_PRESETS, getPreset } from './decorationPresets'

const TABLE_OPTION = { key: 'table', label: '🪑 Bàn' }
const MARKER_PRESETS = DECORATION_PRESETS.filter((p) => p.kind === 'marker')
const FLOOR_PRESETS = DECORATION_PRESETS.filter((p) => p.kind === 'floor')
const WALL_PRESETS = DECORATION_PRESETS.filter((p) => p.kind === 'wall')
const DOOR_PRESET = DECORATION_PRESETS.find((p) => p.kind === 'door')
const PATH_PRESET = DECORATION_PRESETS.find((p) => p.kind === 'path')

const DEFAULT_TABLE_SIZE = { width: 90, height: 80 }
const DEFAULT_DECORATION_SIZE = { width: 70, height: 70 }

const emptyForm = { tableName: '', capacity: 4, name: '', width: 90, height: 80, rotation: 0 }
const emptyPathForm = { name: '', strokeWidth: 20, style: 'solid', color: '#D8C9A3' }

function PresetGroup({ title, presets, activeKey, isEditing, onPick }) {
  if (!presets.length) return null
  return (
    <div>
      <div style={{ fontSize: '.72rem', fontWeight: 600, color: 'var(--text-muted)', margin: '.4rem 0 .3rem' }}>{title}</div>
      <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
        {presets.map((opt) => (
          <button key={opt.key} type="button"
            className={!isEditing && activeKey === opt.key ? 'btn-primary btn-sm' : 'btn-outline btn-sm'}
            onClick={() => onPick(opt.key)}>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function ObjectPanel({ floorPlan }) {
  const { selected, clearSelection, addTable, updateTable, deleteTable, updateTableGeometry,
    addDecoration, updateDecoration, deleteDecoration, savingLayout, savingTableId,
    pathDraft, startPathDraft, undoPathDraftPoint, cancelPathDraft, finishPathDraft } = floorPlan

  const [kind, setKind] = useState('table')
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

  const handlePick = (key) => {
    if (key === 'path') { clearSelection(); startPathDraft(); return }
    startCreate(key)
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
    if (ok) setPathForm(emptyPathForm)
  }

  const handlePathSave = async () => {
    const ok = await updateDecoration(selected.data.id, {
      name: pathForm.name, strokeWidth: Number(pathForm.strokeWidth) || 20,
      style: pathForm.style, color: pathForm.color,
    })
    if (ok) clearSelection()
  }

  const handleDelete = async () => {
    if (!selected) return
    if (!window.confirm('Xoá vật thể này khỏi sơ đồ?')) return
    if (selected.type === 'table') await deleteTable(selected.data)
    else await deleteDecoration(selected.data.id)
  }

  // --- Che do dang ve duong di: UI rieng, khac han form binh thuong ---
  if (isDrawingPath) {
    return (
      <div className="card" style={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
          <button type="button" className="btn-outline btn-sm" onClick={cancelPathDraft} style={{ color: '#EF4444' }}>
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

  return (
    <div className="card" style={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <div style={{ fontSize: '.8rem', fontWeight: 600, marginBottom: '.3rem', color: 'var(--text-muted)' }}>Thêm mới</div>
        <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
          <button type="button"
            className={!isEditing && kind === 'table' ? 'btn-primary btn-sm' : 'btn-outline btn-sm'}
            onClick={() => startCreate('table')}>
            {TABLE_OPTION.label}
          </button>
        </div>
        <PresetGroup title="Nhãn / vật thể" presets={MARKER_PRESETS} activeKey={kind} isEditing={isEditing} onPick={handlePick} />
        <PresetGroup title="Sàn tiểu cảnh" presets={FLOOR_PRESETS} activeKey={kind} isEditing={isEditing} onPick={handlePick} />
        <PresetGroup title="Kiến trúc" presets={WALL_PRESETS} activeKey={kind} isEditing={isEditing} onPick={handlePick} />
        {DOOR_PRESET && (
          <div>
            <div style={{ fontSize: '.72rem', fontWeight: 600, color: 'var(--text-muted)', margin: '.4rem 0 .3rem' }}>Cửa</div>
            <button type="button"
              className={!isEditing && kind === 'door' ? 'btn-primary btn-sm' : 'btn-outline btn-sm'}
              onClick={() => handlePick('door')}>
              {DOOR_PRESET.label}
            </button>
          </div>
        )}
        {PATH_PRESET && (
          <div>
            <div style={{ fontSize: '.72rem', fontWeight: 600, color: 'var(--text-muted)', margin: '.4rem 0 .3rem' }}>Lối đi</div>
            <button type="button" className="btn-outline btn-sm" onClick={() => handlePick('path')}>
              {PATH_PRESET.label}
            </button>
          </div>
        )}
      </div>

      {isEditingPath ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
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
          <button type="button" className="btn-outline btn-sm" onClick={clearSelection}>Huỷ chọn</button>
        </div>
      ) : (
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
            <button type="button" className="btn-outline btn-sm" onClick={clearSelection}>Huỷ chọn</button>
          )}
        </form>
      )}
    </div>
  )
}