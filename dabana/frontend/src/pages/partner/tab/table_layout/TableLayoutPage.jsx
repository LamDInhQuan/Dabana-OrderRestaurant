import { useParams } from 'react-router-dom'
import Navbar from '../../../../components/Navbar'
import { useFloorPlanState } from './hooks/useFloorPlanState'
import TableLayoutTab from './TableLayoutTab'

export default function TableLayoutPage() {
  const { branchId } = useParams()
  const floorPlan = useFloorPlanState(branchId)

  return (
    <>
      <Navbar />
      {floorPlan.loading
        ? <div className="page-container" style={{ padding: '1.5rem 1rem' }}>Đang tải...</div>
        : <TableLayoutTab floorPlan={floorPlan} />}
    </>
  )
}