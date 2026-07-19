import { useParams } from 'react-router-dom'
import Navbar from '../../../../components/Navbar'
import { useMenuState } from './hooks/useMenuState'
import MenuManagementTab from './MenuManagementTab'

export default function MenuPage() {
  const { branchId } = useParams()
  const menu = useMenuState(branchId)

  return (
    <>
      <Navbar />
      {menu.loadingCategories
        ? <div className="page-container" style={{ padding: '1.5rem 1rem' }}>Đang tải...</div>
        : <MenuManagementTab menu={menu} />}
    </>
  )
}