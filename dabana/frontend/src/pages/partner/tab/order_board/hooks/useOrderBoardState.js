import { useState, useEffect, useCallback, useRef } from 'react'
import toast from 'react-hot-toast'
import { orderBoardApi } from '../../../../../api'

const unwrap = (res) => res.data?.data ?? res.data

// Poll nhe lam "realtime" tam thoi cho Task 1 (UI). Backend Task 5 da co san
// STOMP topic /topic/table-status/{branchId} - co the thay poll nay bang
// subscribe WebSocket khi lam tiep phan ket noi realtime that su.
const POLL_INTERVAL_MS = 15000

// Du lieu demo de UI van xem duoc khi chua noi API / API loi - dung style demo
// nhu cac hook khac trong PartnerDashboard (branchApi, bookingApi...).
const DEMO_ZONES = [
  {
    zoneId: 1,
    zoneName: 'Khu Tầng 1 - Trung Tâm',
    description: 'Khu vực náo nhiệt, gần quầy buffet chính',
    tables: [
      {
        tableId: 1, tableName: 'Bàn 101', capacity: 4, status: 3,
        activeBooking: {
          bookingId: 101, status: 'CHECKED_IN', contactName: 'Ngô Xuân Tùng',
          contactPhone: '0867884204', reservationTime: new Date().toISOString(), guestCount: 4,
        },
        orders: [
          { id: 1, source: 'PREORDER', itemName: 'Combo Dabana 2-3 Người', price: 499000, quantity: 1, lineTotal: 499000 },
          { id: 2, source: 'EXTRA_ORDER', itemName: 'Rượu Soju Truyền Thống', price: 65000, quantity: 2, lineTotal: 130000, recordedByName: 'Lễ tân A' },
        ],
        estimatedTotal: 629000,
      },
      {
        tableId: 2, tableName: 'Bàn 102', capacity: 4, status: 2,
        activeBooking: {
          bookingId: 102, status: 'CONFIRMED', contactName: 'Trần Thị Mai',
          contactPhone: '0912345678', reservationTime: new Date(Date.now() + 30 * 60000).toISOString(), guestCount: 2,
        },
        orders: [], estimatedTotal: 0,
      },
      { tableId: 3, tableName: 'Bàn 103', capacity: 6, status: 1, activeBooking: null, orders: [], estimatedTotal: 0 },
      { tableId: 4, tableName: 'Bàn 104', capacity: 8, status: 4, activeBooking: null, orders: [], estimatedTotal: 0 },
    ],
  },
  {
    zoneId: 2,
    zoneName: 'Khu VIP - Tầng 2',
    description: 'Không gian yên tĩnh, sang trọng cho tiệc riêng tư',
    tables: [
      { tableId: 5, tableName: 'VIP 201', capacity: 8, status: 1, activeBooking: null, orders: [], estimatedTotal: 0 },
      { tableId: 6, tableName: 'VIP 202', capacity: 6, status: 5, activeBooking: null, orders: [], estimatedTotal: 0 },
    ],
  },
]

export function useOrderBoardState(branchId) {
  const [zones, setZones] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null)
  const [activeZoneId, setActiveZoneId] = useState('ALL')
  const isFirstLoad = useRef(true)

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!branchId) return
    if (silent) setRefreshing(true); else setLoading(true)
    try {
      const res = await orderBoardApi.getBoard(branchId)
      const data = unwrap(res)
      setZones(data?.zones || [])
      setLastUpdatedAt(new Date())
    } catch (err) {
      if (isFirstLoad.current) {
        // Chua noi duoc API (hoac api.js chua co orderBoardApi) - dung demo de UI van xem duoc
        setZones(DEMO_ZONES)
        setLastUpdatedAt(new Date())
      } else if (!silent) {
        toast.error(err.response?.data?.message || 'Không tải được danh sách bàn')
      }
    } finally {
      isFirstLoad.current = false
      setLoading(false)
      setRefreshing(false)
    }
  }, [branchId])

  useEffect(() => {
    isFirstLoad.current = true
    setActiveZoneId('ALL')
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId])

  useEffect(() => {
    if (!branchId) return
    const timer = setInterval(() => load({ silent: true }), POLL_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [branchId, load])

  const allTables = zones.flatMap((z) => z.tables || [])
  const visibleZones = activeZoneId === 'ALL' ? zones : zones.filter((z) => z.zoneId === activeZoneId)

  const summary = {
    total: allTables.length,
    empty: allTables.filter((t) => t.status === 1).length,
    reserved: allTables.filter((t) => t.status === 2).length,
    occupied: allTables.filter((t) => t.status === 3).length,
    cleaning: allTables.filter((t) => t.status === 4).length,
    maintenance: allTables.filter((t) => t.status === 5).length,
  }

  return {
    branchId, zones, visibleZones, loading, refreshing, lastUpdatedAt,
    activeZoneId, setActiveZoneId, summary,
    reload: () => load(),
  }
}
