import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { zoneApi, tableApi } from '../../../../../api';
import { validateTableOverlap } from '../utils/layoutOverlap';

export const useFloorPlanState = (branchId) => {
  const [zones, setZones] = useState([]);
  const [tables, setTables] = useState({}); // Cấu trúc map: zoneId -> Array của các bàn
  const [activeZone, setActiveZone] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [draggingTable, setDraggingTable] = useState(null);

  const stompRef = useRef(null);

  // 1. Quản lý kết nối WebSocket nhận cập nhật trạng thái bàn ăn real-time
  useEffect(() => {
    if (!branchId) return;

    const client = new Client({
      webSocketFactory: () => new SockJS('/ws'),
      onConnect: () => {
        client.subscribe(`/topic/table-status/${branchId}`, (msg) => {
          const update = JSON.parse(msg.body); // Trả về dạng DTO { tableId, status }
          setTables((prev) => {
            const next = { ...prev };
            Object.keys(next).forEach((zoneId) => {
              next[zoneId] = next[zoneId].map((t) =>
                t.id === update.tableId ? { ...t, status: update.status } : t
              );
            });
            return next;
          });
        });
      },
      onStompError: () => {
        console.error('Lỗi kết nối WebSocket đồng bộ trạng thái.');
      }
    });

    client.activate();
    stompRef.current = client;

    return () => {
      if (stompRef.current) stompRef.current.deactivate();
    };
  }, [branchId]);

  // 2. Tải toàn bộ danh sách Khu vực và Bàn ăn trực thuộc chi nhánh
  // 2. Tải toàn bộ danh sách Khu vực và Bàn ăn trực thuộc chi nhánh
  const fetchLayoutData = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const zoneRes = await zoneApi.getByBranch(branchId);

      // 🚀 CHÈN CONSOLE.LOG VÀO ĐÂY ĐỂ KIỂM TRA
      console.log("=== KIỂM TRA PHẢN HỒI API ===");
      console.log("Toàn bộ zoneRes:", zoneRes);
      console.log("Dữ liệu zoneRes.data:", zoneRes.data);
      console.log("Mảng dữ liệu đúng phải là zoneRes.data.data:", zoneRes.data?.data);
      console.log("=============================");

      // 👉 SỬA LẠI: Lấy đúng mảng `.data.data` theo cấu trúc API của bạn
      const actualZones = zoneRes.data?.data || [];

      setZones(actualZones);

      if (actualZones.length > 0) {
        // Tự động chọn Zone đầu tiên nếu chưa có zone nào active
        setActiveZone((curr) => curr || actualZones[0]);
      }

      const tableMap = {};
      await Promise.all(
        actualZones.map(async (zone) => {
          // ZoneResponse đã chứa danh sách tables được nest sẵn từ tầng Backend
          tableMap[zone.id] = zone.tables || [];
        })
      );
      setTables(tableMap);
      setIsDirty(false);
    } catch (err) {
      console.error("Lỗi chi tiết khi fetch layout:", err); // In thêm lỗi ra console nếu có
      toast.error('Không thể tải cấu trúc sơ đồ phân khu.');
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    fetchLayoutData();
  }, [fetchLayoutData]);

  // 3. Cập nhật vị trí cục bộ trên giao diện Canvas (Client-side position update)
  const updateTableLocalPosition = (tableId, x, y) => {
    if (!activeZone) return;
    setTables((prev) => ({
      ...prev,
      [activeZone.id]: prev[activeZone.id].map((t) =>
        t.id === tableId ? { ...t, positionX: x, positionY: y } : t
      )
    }));
    setIsDirty(true);
  };

  // 4. Lưu đồng bộ vị trí hàng loạt (Gửi Request khớp với BulkUpdateDiningTablePositions ở Backend)
  const savePositions = async () => {
    if (!activeZone) return;
    const currentZoneTables = tables[activeZone.id] || [];

    // Chặn trước ở Client nếu phát hiện bàn chồng lấn hoặc vi phạm khoảng cách
    const check = validateTableOverlap(currentZoneTables);
    if (!check.isValid) {
      toast.error(check.message);
      return false;
    }

    try {
      const payload = currentZoneTables.map((t) => ({
        tableId: t.id,
        positionX: t.positionX,
        positionY: t.positionY
      }));

      await tableApi.updateLayout({ tables: payload });
      setIsDirty(false);
      toast.success('Đồng bộ vị trí sơ đồ bàn thành công!');
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi đồng bộ sơ đồ vị trí bàn.');
      return false;
    }
  };

  return {
    zones,
    tables,
    activeZone,
    loading,
    isDirty,
    draggingTable,
    activeZoneTables: activeZone ? (tables[activeZone.id] || []) : [],
    setActiveZone,
    setDraggingTable,
    updateTableLocalPosition,
    savePositions,
    refreshData: fetchLayoutData
  };
};