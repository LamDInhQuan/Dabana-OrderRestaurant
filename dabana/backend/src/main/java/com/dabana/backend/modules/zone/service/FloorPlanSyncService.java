package com.dabana.backend.modules.zone.service;

import com.dabana.backend.exception.BusinessException;
import com.dabana.backend.modules.diningtable.entity.DiningTable;
import com.dabana.backend.modules.diningtable.repository.DiningTableRepository;
import com.dabana.backend.modules.zone.entity.FloorPlan;
import com.dabana.backend.modules.zone.entity.Zone;
import com.dabana.backend.modules.zone.repository.FloorPlanRepository;
import com.dabana.backend.modules.zone.util.ZoneErrorCode;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Diem doc/ghi DUY NHAT cho rt_layout_floor_plans.layout_data va su dong bo cua no voi
 * rt_layout_tables.position_x / position_y.
 *
 * Quy uoc: layout_data la NGUON GOC (source of truth). position_x/position_y tren
 * rt_layout_tables chi la ban sao duoc derive tu layout_data.
 *
 * ZoneService va DiningTableService KHONG duoc tu parse/ghi JSON layout_data nua ma
 * phai goi qua service nay, de dam bao:
 *  1) Luon lock (PESSIMISTIC_WRITE) dong FloorPlan truoc khi doc-sua-ghi -> khong lost update.
 *  2) Loi parse JSON luon duoc nem ra ngoai (khong nuot am tham).
 *  3) layout_data khong bao gio duoc phep mo ta 1 "ban" khong ton tai that trong DB.
 */
@Service
@RequiredArgsConstructor
public class FloorPlanSyncService {

    private static final int DEFAULT_WIDTH = 90;
    private static final int DEFAULT_HEIGHT = 80;
    private static final BigDecimal DEFAULT_ROTATION = BigDecimal.ZERO;
    private static final BigDecimal FULL_CIRCLE = BigDecimal.valueOf(360);

    private final FloorPlanRepository floorPlanRepository;
    private final DiningTableRepository diningTableRepository;
    private final ObjectMapper objectMapper;

    /**
     * Lock ghi FloorPlan cua zone. GOI DAU TIEN trong bat ky transaction nao se doc-sua-ghi
     * layout_data hoac position_x/y, de serialize hoa voi cac giao dich dong thoi khac
     * tren cung zone. Neu zone chua co floor plan thi tao moi rong.
     */
    public FloorPlan lockOrCreateFloorPlan(Zone zone) {
        return floorPlanRepository.findByZoneIdForUpdate(zone.getId())
                .orElseGet(() -> createEmptyFloorPlan(zone));
    }

    public FloorPlan createEmptyFloorPlan(Zone zone) {
        FloorPlan floorPlan = new FloorPlan();
        floorPlan.setZone(zone);
        floorPlan.setLayoutData("{\"tables\":[]}");
        return floorPlanRepository.saveAndFlush(floorPlan);
    }

    // ==================== Chieu DiningTable -> layout_data ====================

    /**
     * Upsert 1 ban vao layout_data theo tableId. Phai goi SAU khi da lockOrCreateFloorPlan
     * trong CUNG mot transaction (de dam bao floorPlan truyen vao da duoc lock).
     */
    public void upsertTableIntoLayout(FloorPlan floorPlan, DiningTable table, boolean addIfMissing) {
        ObjectNode root = readRoot(floorPlan);
        ArrayNode tablesNode = root.withArray("tables");

        boolean found = false;
        for (JsonNode node : tablesNode) {
            ObjectNode item = (ObjectNode) node;
            if (table.getId() != null && item.has("tableId") && item.get("tableId").asLong() == table.getId()) {
                fillTableNode(item, table);
                found = true;
                break;
            }
        }

        if (!found && addIfMissing) {
            ObjectNode item = objectMapper.createObjectNode();
            fillTableNode(item, table);
            tablesNode.add(item);
        }

        writeRoot(floorPlan, root);
    }

    public void removeTableFromLayout(FloorPlan floorPlan, Long tableId) {
        ObjectNode root = readRoot(floorPlan);
        ArrayNode tablesNode = root.withArray("tables");
        for (int i = tablesNode.size() - 1; i >= 0; i--) {
            JsonNode item = tablesNode.get(i);
            if (item.has("tableId") && item.get("tableId").asLong() == tableId) {
                tablesNode.remove(i);
                break;
            }
        }
        writeRoot(floorPlan, root);
    }

    private void fillTableNode(ObjectNode item, DiningTable table) {
        item.put("tableId", table.getId());
        item.put("tableName", table.getTableName());
        item.put("x", table.getPositionX() != null ? table.getPositionX() : 0);
        item.put("y", table.getPositionY() != null ? table.getPositionY() : 0);
        item.put("width", table.getWidth() != null ? table.getWidth() : DEFAULT_WIDTH);
        item.put("height", table.getHeight() != null ? table.getHeight() : DEFAULT_HEIGHT);
        item.put("rotation", (table.getRotation() != null ? table.getRotation() : DEFAULT_ROTATION).doubleValue());
    }

    // ==================== Chieu layout_data -> DiningTable ====================

    /**
     * Nhan layout_data moi tu FloorPlanRequest, validate NGHIEM NGAT roi ghi de len ca
     * layout_data lan position_x/y cua tung ban trong DB.
     *
     * Vi layout_data la nguon goc:
     *  - Moi phan tu "table" BAT BUOC phai co tableId hop le, tro toi dung 1 ban co that
     *    trong CHINH zone nay. Khong khop -> nem FLOOR_PLAN_TABLE_REF_INVALID, KHONG
     *    am tham bo qua nhu code cu (tranh layout_data mo ta ban "ma").
     *  - Khong chap nhan 2 phan tu trung tableId.
     *
     * Phai goi SAU khi da lockOrCreateFloorPlan trong CUNG mot transaction.
     */
    public void applyFloorPlanRequest(Zone zone, FloorPlan floorPlan, String rawLayoutData) {
        if (rawLayoutData == null || rawLayoutData.isBlank()) {
            throw new BusinessException(ZoneErrorCode.INVALID_FLOOR_PLAN_LAYOUT);
        }

        JsonNode parsed;
        try {
            parsed = objectMapper.readTree(rawLayoutData.trim());
        } catch (JsonProcessingException ex) {
            throw new BusinessException(ZoneErrorCode.INVALID_FLOOR_PLAN_LAYOUT);
        }

        if (!parsed.isObject()) {
            throw new BusinessException(ZoneErrorCode.INVALID_FLOOR_PLAN_LAYOUT);
        }
        ObjectNode root = (ObjectNode) parsed;

        JsonNode tablesNode = root.path("tables");
        if (!tablesNode.isMissingNode() && !tablesNode.isArray()) {
            throw new BusinessException(ZoneErrorCode.INVALID_FLOOR_PLAN_LAYOUT);
        }

        Map<Long, DiningTable> tablesById = new HashMap<>();
        for (DiningTable table : diningTableRepository.findByZoneIdOrderByIdAsc(zone.getId())) {
            tablesById.put(table.getId(), table);
        }

        List<DiningTable> toUpdate = new ArrayList<>();
        Set<Long> seenTableIds = new HashSet<>();

        if (tablesNode.isArray()) {
            for (JsonNode tableNode : tablesNode) {
                if (!tableNode.isObject()) {
                    throw new BusinessException(ZoneErrorCode.INVALID_FLOOR_PLAN_LAYOUT);
                }

                JsonNode xNode = tableNode.get("x");
                JsonNode yNode = tableNode.get("y");
                JsonNode tableIdNode = tableNode.get("tableId");
                // width/height/rotation la OPTIONAL: layout_data cu (tao truoc khi co
                // tinh nang resize/rotate) se khong co cac field nay -> khong duoc coi la loi.
                JsonNode widthNode = tableNode.get("width");
                JsonNode heightNode = tableNode.get("height");
                JsonNode rotationNode = tableNode.get("rotation");

                if (xNode == null || !xNode.isNumber() || yNode == null || !yNode.isNumber()) {
                    throw new BusinessException(ZoneErrorCode.INVALID_FLOOR_PLAN_LAYOUT);
                }
                if (widthNode != null && (!widthNode.isNumber() || widthNode.intValue() < 20 || widthNode.intValue() > 500)) {
                    throw new BusinessException(ZoneErrorCode.INVALID_FLOOR_PLAN_LAYOUT);
                }
                if (heightNode != null && (!heightNode.isNumber() || heightNode.intValue() < 20 || heightNode.intValue() > 500)) {
                    throw new BusinessException(ZoneErrorCode.INVALID_FLOOR_PLAN_LAYOUT);
                }
                if (rotationNode != null && !rotationNode.isNumber()) {
                    throw new BusinessException(ZoneErrorCode.INVALID_FLOOR_PLAN_LAYOUT);
                }
                if (tableIdNode == null || !tableIdNode.isNumber()) {
                    throw new BusinessException(ZoneErrorCode.FLOOR_PLAN_TABLE_REF_INVALID);
                }

                Long tableId = tableIdNode.longValue();
                if (!seenTableIds.add(tableId)) {
                    throw new BusinessException(ZoneErrorCode.FLOOR_PLAN_TABLE_REF_INVALID);
                }

                DiningTable target = tablesById.get(tableId);
                if (target == null) {
                    throw new BusinessException(ZoneErrorCode.FLOOR_PLAN_TABLE_REF_INVALID);
                }

                target.setPositionX(xNode.intValue());
                target.setPositionY(yNode.intValue());
                if (widthNode != null) {
                    target.setWidth(widthNode.intValue());
                }
                if (heightNode != null) {
                    target.setHeight(heightNode.intValue());
                }
                if (rotationNode != null) {
                    target.setRotation(normalizeRotation(rotationNode.decimalValue()));
                }
                toUpdate.add(target);

                // dam bao tableName/width/height/rotation luu trong layout_data luon khop
                // DB, tranh lech du lieu hien thi so voi ban ghi thuc te
                ((ObjectNode) tableNode).put("tableName", target.getTableName());
                ((ObjectNode) tableNode).put("width", target.getWidth() != null ? target.getWidth() : DEFAULT_WIDTH);
                ((ObjectNode) tableNode).put("height", target.getHeight() != null ? target.getHeight() : DEFAULT_HEIGHT);
                ((ObjectNode) tableNode).put("rotation",
                        (target.getRotation() != null ? target.getRotation() : DEFAULT_ROTATION).doubleValue());
            }
        }

        diningTableRepository.saveAll(toUpdate);
        writeRoot(floorPlan, root);
    }

    // chuan hoa goc xoay ve khoang [0, 360) thay vi tu choi cac gia tri am/lon,
    // giu 2 chu so thap phan cho khop scale cua cot DECIMAL(5,2)
    private BigDecimal normalizeRotation(BigDecimal raw) {
        BigDecimal normalized = raw.remainder(FULL_CIRCLE);
        if (normalized.signum() < 0) {
            normalized = normalized.add(FULL_CIRCLE);
        }
        return normalized.setScale(2, RoundingMode.HALF_UP);
    }

    // ==================== Helpers noi bo ====================

    private ObjectNode readRoot(FloorPlan floorPlan) {
        try {
            JsonNode node = objectMapper.readTree(floorPlan.getLayoutData());
            if (!node.isObject()) {
                throw new BusinessException(ZoneErrorCode.FLOOR_PLAN_DATA_CORRUPTED);
            }
            return (ObjectNode) node;
        } catch (JsonProcessingException ex) {
            // KHONG con nuot loi trong im lang nhu code cu: du lieu hong phai duoc bao ngay.
            throw new BusinessException(ZoneErrorCode.FLOOR_PLAN_DATA_CORRUPTED);
        }
    }

    private void writeRoot(FloorPlan floorPlan, ObjectNode root) {
        try {
            floorPlan.setLayoutData(objectMapper.writeValueAsString(root));
        } catch (JsonProcessingException ex) {
            throw new BusinessException(ZoneErrorCode.FLOOR_PLAN_DATA_CORRUPTED);
        }
        // Khong tu tang version thu cong: @Version tren FloorPlan.version duoc Hibernate
        // tu dong quan ly va tang o moi UPDATE thuc su, ke ca khi sync den tu chieu nay.
        floorPlanRepository.save(floorPlan);
    }
}