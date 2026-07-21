import { useState, useMemo } from 'react'
import MenuHeader from './components/MenuHeader'
import MenuFilterBar from './components/MenuFilterBar'
import MenuStatsCards from './components/MenuStatsCards'
import MenuBulkActionBar from './components/MenuBulkActionBar'
import MenuItemTable from './components/MenuItemTable'
import MenuItemFormModal from './components/MenuItemFormModal'
import CategoryManageModal from './components/CategoryManageModal'
import ExportMenuButton from './components/ExportMenuButton'

export default function MenuManagementTab({ menu = {} }) {
  const [itemModal, setItemModal] = useState(null)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)

  // Safe destructure voi gia tri mac dinh
  const {
    categories = [],
    items = [],
    selectedIds = [],
    filters = {},
    stats = {},
    pageInfo = { page: 0, size: 20, totalElements: 0, totalPages: 0, last: true },
    loadingCategories = false,
    loadingItems = false,
    loadingStats = false,
    savingItemId = null,
    savingCategoryId = null,
    savingBulk = false,
    applyFilters,
    resetFilters,
    bulkUpdateStatus,
    bulkDeleteItems,
    clearSelection,
    toggleSelect,
    toggleSelectAllOnPage,
    toggleItemStatus,
    deleteItem,
    goToPage,
    createItem,
    updateItem,
    createCategory,
    updateCategory,
    deleteCategory,
  } = menu

  const categoryNameById = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.categoryName])),
    [categories]
  )

  const openAddItem = () => setItemModal('add')
  const openEditItem = (item) => setItemModal(item)
  const closeItemModal = () => setItemModal(null)

  const handleSubmitItem = (payload) =>
    itemModal === 'add' ? createItem?.(payload) : updateItem?.(itemModal.id, payload)

  return (
    <div className="page-container" style={{ padding: '1.5rem 1rem' }}>
      <MenuHeader onOpenCategories={() => setCategoryModalOpen(true)} onAddItem={openAddItem} />

      <MenuFilterBar
        filters={filters || {}}
        categories={categories}
        onApply={applyFilters}
        onReset={resetFilters}
      />

      <MenuStatsCards stats={stats} loading={loadingStats} />

      <div className="flex items-center justify-between" style={{ marginBottom: '.75rem' }}>
        <h2 style={{ fontWeight: 700, fontSize: '1.05rem' }}>Danh sách món ăn</h2>
        <ExportMenuButton items={items} categoryNameById={categoryNameById} />
      </div>

      <MenuBulkActionBar
        count={selectedIds.length}
        saving={savingBulk}
        onSetStatus={bulkUpdateStatus}
        onBulkDelete={bulkDeleteItems}
        onClear={clearSelection}
      />

      <MenuItemTable
        items={items}
        loading={loadingItems}
        pageInfo={pageInfo}
        savingItemId={savingItemId}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
        onToggleSelectAll={toggleSelectAllOnPage}
        onEdit={openEditItem}
        onToggleStatus={toggleItemStatus}
        onDelete={deleteItem}
        onGoToPage={goToPage}
        categoryNameById={categoryNameById}
      />

      <MenuItemFormModal
        open={itemModal !== null}
        item={itemModal === 'add' ? null : itemModal}
        categories={categories}
        onClose={closeItemModal}
        onSubmit={handleSubmitItem}
      />

      <CategoryManageModal
        open={categoryModalOpen}
        categories={categories}
        savingCategoryId={savingCategoryId}
        onClose={() => setCategoryModalOpen(false)}
        onCreate={createCategory}
        onUpdate={updateCategory}
        onDelete={deleteCategory}
      />
    </div>
  )
}