const toCsvValue = (v) => {
  const s = String(v ?? '')
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

// Luu y: chi export danh sach MON DANG HIEN THI TREN TRANG HIEN TAI (server tra ve
// phan trang), khong phai toan bo ket qua da loc. Neu can export ca bo loc, phai
// goi searchItems voi size lon (hoac size = totalElements) truoc khi export.
export default function ExportMenuButton({ items, categoryNameById }) {
  const handleExport = () => {
    const header = ['Tên món', 'Danh mục', 'Giá', 'Trạng thái', 'Mô tả']
    const rows = items.map((it) => [
      it.itemName,
      categoryNameById[it.categoryId] || '',
      it.price,
      it.status,
      it.description || '',
    ])
    const csv = [header, ...rows].map((r) => r.map(toCsvValue).join(',')).join('\n')
    // \uFEFF (BOM) de Excel doc dung UTF-8 / tieng Viet co dau
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `thuc-don-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button className="btn-outline btn-sm" onClick={handleExport} disabled={items.length === 0}>
      Xuất danh sách
    </button>
  )
}