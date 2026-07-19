import { useState } from 'react'
import toast from 'react-hot-toast'
import ZoneList from './components/ZoneList'
import ZoneFormModal from './components/ZoneFormModal'
import { zoneApi } from '../../../../../api'

export default function ZoneManagementTab({ zones, reloadZones, branchId }) {
  const [editingZone, setEditingZone] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)

  const openCreate = () => { setEditingZone(null); setModalOpen(true) }
  const openEdit = (zone) => { setEditingZone(zone); setModalOpen(true) }

  const handleSubmit = async (form) => {
    try {
      if (editingZone) {
        // UpdateZoneRequest khong co branchId, chi zoneName + description
        await zoneApi.update(editingZone.id, form)
        toast.success('Đã cập nhật khu vực')
      } else {
        // CreateZoneRequest.branchId la @NotNull -> bat buoc dinh kem, ep kieu Number
        // vi useParams() tra ve string con backend nhan Long
        await zoneApi.create({ ...form, branchId: Number(branchId) })
        toast.success('Đã thêm khu vực')
      }
      await reloadZones()
      return true
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi lưu khu vực')
      return false
    }
  }

  const handleDelete = async (zone) => {
    // Backend chan xoa neu zone con ban (ZONE_HAS_TABLES) - de nguyen thong bao loi
    // tu BE tra ve, khong tu doan truoc o FE.
    try {
      await zoneApi.delete(zone.id)
      toast.success('Đã xoá khu vực')
      await reloadZones()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể xoá khu vực')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 style={{ fontWeight: 800, fontSize: '1.3rem' }}>Quản lý khu vực</h1>
        <button className="btn-outline btn-sm" onClick={openCreate}>+ Thêm khu vực</button>
      </div>
      <ZoneList zones={zones} onEdit={openEdit} onDelete={handleDelete} />
      <ZoneFormModal open={modalOpen} zone={editingZone} onClose={() => setModalOpen(false)} onSubmit={handleSubmit} />
    </div>
  )
}