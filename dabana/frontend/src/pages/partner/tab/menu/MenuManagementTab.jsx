import { useState, useMemo } from 'react'
import MenuHeader from './components/MenuHeader'
import MenuFilterBar from './components/MenuFilterBar'
import MenuStatsCards from './components/MenuStatsCards'
import MenuBulkActionBar from './components/MenuBulkActionBar'
import MenuItemTable from './components/MenuItemTable'
import MenuItemFormModal from './components/MenuItemFormModal'
import CategoryManageModal from './components/CategoryManageModal'
import ExportMenuButton from './components/ExportMenuButton'

export default function MenuManagementTab({ menu }) {
  const [itemModal, setItemModal] = useState(null) // null | 'add' | item (edit)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)

  const categoryNameById = useMemo(
    () => Object.fromEntries(menu.categories.map((c) => [c.id, c.categoryName])),
    [menu.categories]
  )

  const openAddItem = () => setItemModal('add')
  const openEditItem = (item) => setItemModal(item)
  const closeItemModal = () => setItemModal(null)

  const handleSubmitItem = (payload) =>
    itemModal === 'add' ? menu.createItem(payload) : menu.updateItem(itemModal.id, payload)

  return (
    <div className="page-container" style={{ padding: '1.5rem 1rem' }}>
      <MenuHeader onOpenCategories={() => setCategoryModalOpen(true)} onAddItem={openAddItem} />

      <MenuFilterBar
        filters={menu.filters}
        categories={menu.categories}
        onApply={menu.applyFilters}
        onReset={menu.resetFilters}
      />

      <MenuStatsCards stats={menu.stats} loading={menu.loadingStats} />

      <div className="flex items-center justify-between" style={{ marginBottom: '.75rem' }}>
        <h2 style={{ fontWeight: 700, fontSize: '1.05rem' }}>Danh sách món ăn</h2>
        <ExportMenuButton items={menu.items} categoryNameById={categoryNameById} />
      </div>

      <MenuBulkActionBar
        count={menu.selectedIds.length}
        saving={menu.savingBulk}
        onSetStatus={menu.bulkUpdateStatus}
        onClear={menu.clearSelection}
      />

      <MenuItemTable
        items={menu.items}
        loading={menu.loadingItems}
        pageInfo={menu.pageInfo}
        savingItemId={menu.savingItemId}
        selectedIds={menu.selectedIds}
        onToggleSelect={menu.toggleSelect}
        onToggleSelectAll={menu.toggleSelectAllOnPage}
        onEdit={openEditItem}
        onToggleStatus={menu.toggleItemStatus}
        onGoToPage={menu.goToPage}
        categoryNameById={categoryNameById}
      />

      <MenuItemFormModal
        open={itemModal !== null}
        item={itemModal === 'add' ? null : itemModal}
        categories={menu.categories}
        onClose={closeItemModal}
        onSubmit={handleSubmitItem}
      />

      <CategoryManageModal
        open={categoryModalOpen}
        categories={menu.categories}
        savingCategoryId={menu.savingCategoryId}
        onClose={() => setCategoryModalOpen(false)}
        onCreate={menu.createCategory}
        onUpdate={menu.updateCategory}
        onDelete={menu.deleteCategory}
      />
    </div>
  )
}