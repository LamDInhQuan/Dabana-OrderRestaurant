import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Hourglass, CreditCard, Ban, TriangleAlert, X, Library, Eye, Check, MapPin, RefreshCw, Settings, Wrench, ShieldCheck, Circle, Save } from "lucide-react";
import toast from "react-hot-toast";
import { S } from "../../../theme";
import { branchPolicyApi, reservationPolicyApi, branchCancellationPolicyApi } from "../../../../../api";
import { useAuth } from "../../../../../context/AuthContext";
import PolicyFormWithExtras from "../components/PolicyFormWithExtras";

const emptyPolicy = {
  id: null,
  name: "",
  description: "",
  depositRequired: false,
  depositType: "FIXED_AMOUNT",
  depositValue: "",
  freeCancellationHours: 24,
  lateCancellationPenaltyPercent: 50,
  noShowPenaltyPercent: 100,
  terms: "",
};

// Helper render Badge theo scheduleType
const renderScheduleTypeBadge = (scheduleType) => {
  switch (scheduleType) {
    case "ALWAYS":
      return (
        <span
          style={{
            fontSize: "0.75rem",
            fontWeight: 600,
            padding: "0.25rem 0.6rem",
            borderRadius: "4px",
            background: "#FEF3C7",
            color: "#B45309",
            display: "inline-block",
          }}
        >
          Hàng ngày
        </span>
      );
    case "DAY_OF_WEEK":
      return (
        <span
          style={{
            fontSize: "0.75rem",
            fontWeight: 600,
            padding: "0.25rem 0.6rem",
            borderRadius: "4px",
            background: "#E6F4EA",
            color: "#137333",
            display: "inline-block",
          }}
        >
          Theo thứ
        </span>
      );
    case "DATE_RANGE":
      return (
        <span
          style={{
            fontSize: "0.75rem",
            fontWeight: 600,
            padding: "0.25rem 0.6rem",
            borderRadius: "4px",
            background: "#E8F0FE",
            color: "#1A73E8",
            display: "inline-block",
          }}
        >
          Theo khoảng ngày
        </span>
      );
    default:
      return (
        <span
          style={{
            fontSize: "0.75rem",
            fontWeight: 600,
            padding: "0.25rem 0.6rem",
            borderRadius: "4px",
            background: "#F3F4F6",
            color: "#4B5563",
            display: "inline-block",
          }}
        >
          {scheduleType || "Tùy chỉnh"}
        </span>
      );
  }
};

export default function PolicyBranchTab({ branch, isReadOnly = false }) {
  const { auth } = useAuth();
  const branchId = branch?.id;
  const restaurantId = branch?.restaurantId || auth?.restaurantId;

  // --- SubTab State ('deposit' | 'cancellation') ---
  const [subTab, setSubTab] = useState("deposit");

  // --- State danh sách Deposit Policy ---
  const [restaurantTemplates, setRestaurantTemplates] = useState([]);
  const [branchPolicies, setBranchPolicies] = useState([]);

  // --- State Form/Detail Deposit Policy ---
  const [editingPolicy, setEditingPolicy] = useState(emptyPolicy);
  const [selectedBranchPolicyId, setSelectedBranchPolicyId] = useState(null);
  const [viewingTemplate, setViewingTemplate] = useState(null);

  const [loading, setLoading] = useState(true);
  const [loadingPolicyId, setLoadingPolicyId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  // --- Modal Confirm Delete State ---
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    policyId: null,
    policyName: "",
  });

  // --- State Cancellation Policy ---
  const [cancelPolicy, setCancelPolicy] = useState({
    id: null, // Explicit khai báo field id
    freeCancellationHours: 24,
    freeCancellationRefundPercent: 100,
    lateCancellationRefundPercent: 0,
    noShowRefundPercent: 0,
    status: "ACTIVE",
  });
  const [loadingCancel, setLoadingCancel] = useState(false);
  const [savingCancel, setSavingCancel] = useState(false);

  // 1. Fetch danh sách Deposit Policy đang áp dụng tại Chi nhánh
  const fetchBranchPolicies = useCallback(async () => {
    if (!branchId) return;
    try {
      const res = await branchPolicyApi.getAll(branchId);
      if (res.data?.code === "SUCCESS" || res.status === 200) {
        setBranchPolicies(res.data?.data || res.data || []);
      }
    } catch (error) {
      console.error("Lỗi khi tải chính sách chi nhánh:", error);
      setErrorMessage("Không thể tải danh sách chính sách của chi nhánh.");
    }
  }, [branchId]);

  // 2. Fetch danh sách Deposit Policy Template của Nhà hàng
  const fetchRestaurantTemplates = useCallback(async () => {
    if (!restaurantId) return;
    try {
      const res = await reservationPolicyApi.getAll(restaurantId);
      if (res.data?.code === "SUCCESS" || res.status === 200) {
        setRestaurantTemplates(res.data?.data || res.data || []);
      }
    } catch (error) {
      console.error("Lỗi khi tải chính sách mẫu của nhà hàng:", error);
      setErrorMessage("Không thể tải thư viện chính sách mẫu.");
    }
  }, [restaurantId]);

  // 3. Fetch Cancellation Policy của Chi nhánh
  const fetchCancellationPolicy = useCallback(async () => {
    if (!restaurantId || !branchId) return;
    try {
      setLoadingCancel(true);
      const res = await branchCancellationPolicyApi.getByBranch(branchId);
      const data = res.data?.data || res.data;
      if (data) {
        // Nối toàn bộ object từ API (bao gồm id, branchId, v.v.)
        setCancelPolicy(data);
      }

    } catch (err) {
      console.log("Chưa cấu hình chính sách hủy cọc cho chi nhánh");
    } finally {
      setLoadingCancel(false);
    }
  }, [restaurantId, branchId]);

  // Initial Load Deposit Policies
  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      setErrorMessage("");
      await Promise.all([fetchBranchPolicies(), fetchRestaurantTemplates()]);
      setLoading(false);
    };
    if (branchId) loadAllData();
  }, [branchId, fetchBranchPolicies, fetchRestaurantTemplates]);

  // Fetch Cancellation Policy when switching to 'cancellation' subTab
  useEffect(() => {
    if (branchId && subTab === "cancellation") {
      fetchCancellationPolicy();
    }
  }, [branchId, subTab, fetchCancellationPolicy]);

  // Mảng chứa các policyId gốc đã được áp dụng ở chi nhánh
  const assignedPolicyIds = useMemo(() => {
    return branchPolicies
      .map((bp) => bp.policyId || bp.policy?.id)
      .filter(Boolean);
  }, [branchPolicies]);

  // --- Deposit Policy Handlers ---
  const handleSelectBranchPolicy = async (branchPolicyId) => {
    if (!branchPolicyId || !branchId) return;
    try {
      setErrorMessage("");
      setSelectedBranchPolicyId(branchPolicyId);
      const res = await branchPolicyApi.getDetail(branchId, branchPolicyId);
      if (res.data?.code === "SUCCESS" || res.status === 200) {
        setEditingPolicy(res.data?.data || res.data);
      }
    } catch (err) {
      console.error("Lỗi lấy chi tiết chính sách chi nhánh:", err);
      setErrorMessage("Không thể lấy chi tiết chính sách này.");
    }
  };

  const handleViewTemplateDetail = async (templateId) => {
    if (!templateId || !restaurantId) return;
    try {
      setErrorMessage("");
      const res = await reservationPolicyApi.getDetail(restaurantId, templateId);
      if (res.data?.code === "SUCCESS" || res.status === 200) {
        setViewingTemplate(res.data?.data || res.data);
      }
    } catch (err) {
      console.error("Lỗi lấy chi tiết chính sách mẫu:", err);
      setErrorMessage("Không thể tải chi tiết chính sách mẫu.");
    }
  };

  const handleAssignTemplate = async (templateId) => {
    if (!branchId) return;
    setErrorMessage("");
    setLoadingPolicyId(templateId);

    try {
      const res = await branchPolicyApi.create(branchId, { policyId: templateId });
      if (res.data?.code === "SUCCESS" || res.status === 200) {
        await fetchBranchPolicies();
      }
    } catch (error) {
      console.error("Lỗi khi gán chính sách mẫu:", error);
      setErrorMessage(
        error.response?.data?.message || "Không thể áp dụng chính sách này cho chi nhánh!"
      );
    } finally {
      setLoadingPolicyId(null);
    }
  };

  const handleOpenDeleteModal = (policyId, policyName) => {
    setDeleteModal({
      isOpen: true,
      policyId,
      policyName,
    });
  };

  const handleConfirmDelete = async () => {
    const { policyId } = deleteModal;
    if (!branchId || !policyId) return;

    setErrorMessage("");
    setLoadingPolicyId(policyId);
    setDeleteModal({ isOpen: false, policyId: null, policyName: "" });

    try {
      const res = await branchPolicyApi.delete(branchId, policyId);
      if (res.data?.code === "SUCCESS" || res.status === 200) {
        setBranchPolicies((old) =>
          old.filter((x) => (x.policyId || x.id) !== policyId)
        );

        if (selectedBranchPolicyId === policyId) {
          setSelectedBranchPolicyId(null);
          setEditingPolicy(emptyPolicy);
        }
        await fetchBranchPolicies();
      }
    } catch (error) {
      console.error("Lỗi khi xóa chính sách khỏi chi nhánh:", error);
      setErrorMessage(
        error.response?.data?.message || "Không thể gỡ bỏ chính sách này khỏi chi nhánh!"
      );
    } finally {
      setLoadingPolicyId(null);
    }
  };

  // --- Cancellation Policy Handler ---
  const handleSaveCancellation = async (e) => {
    e.preventDefault();
    if (isReadOnly) return;

    try {
      setSavingCancel(true);
      console.log("cancelPolicy", cancelPolicy);

      // Kiểm tra xem policy đã tồn tại (có ID) chưa để gọi đúng API
      if (cancelPolicy?.id) {
        // --- CẬP NHẬT (UPDATE) ---
        await branchCancellationPolicyApi.update(branchId, cancelPolicy);
        toast.success("Cập nhật chính sách hủy cọc thành công!");
      } else {
        // --- TẠO MỚI (CREATE) ---
        // Lưu ý: response trả về thường chứa dữ liệu mới tạo (bao gồm cả ID mới)
        const response = await branchCancellationPolicyApi.create(branchId, cancelPolicy);

        // Cập nhật lại state local để các lần nhấn nút tiếp theo tự chuyển sang flow UPDATE
        if (response?.data) {
          setCancelPolicy(response.data);
        }

        toast.success("Tạo mới chính sách hủy cọc thành công!");
      }

      // Gọi lại hàm load data từ parent nếu cần đồng bộ toàn bộ state
      if (typeof onRefresh === "function") {
        await onRefresh();
      }
    } catch (err) {
      console.error("Lỗi lưu cancellation policy:", err);
      toast.error(err?.response?.data?.message || "Không thể lưu chính sách hủy cọc");
    } finally {
      setSavingCancel(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "2.5rem", textAlign: "center", color: "#8A8272" }}>
        <Hourglass size={16} style={{ verticalAlign: '-2px' }} /> Đang tải dữ liệu chính sách...
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", width: "100%", padding: "0 0.5rem" }}>

      {/* SUB-TAB SWITCHER */}
      <div style={ui.subTabContainer}>
        <button
          type="button"
          onClick={() => setSubTab("deposit")}
          style={{
            ...ui.subTabBtn,
            ...(subTab === "deposit" ? ui.subTabBtnActive : {}),
          }}
        >
          <CreditCard size={16} style={{ verticalAlign: '-2px' }} /> Chính sách Đặt cọc
        </button>
        <button
          type="button"
          onClick={() => setSubTab("cancellation")}
          style={{
            ...ui.subTabBtn,
            ...(subTab === "cancellation" ? ui.subTabBtnActive : {}),
          }}
        >
          <Ban size={16} style={{ verticalAlign: '-2px' }} /> Quy định Hủy cọc & Hoàn tiền
        </button>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div
          style={{
            padding: "0.85rem 1.25rem",
            borderRadius: "8px",
            background: "#FEE2E2",
            border: "1px solid #FCA5A5",
            color: "#991B1B",
            fontSize: "0.88rem",
            display: "flex",
            justify: "space-between",
            alignItems: "center",
          }}
        >
          <span><TriangleAlert size={15} style={{ verticalAlign: '-2px' }} /> {errorMessage}</span>
          <button
            onClick={() => setErrorMessage("")}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#991B1B", fontWeight: 700 }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB 1: CHÍNH SÁCH ĐẶT CỌC                             */}
      {/* ========================================================= */}
      {subTab === "deposit" && (
        <>
          {/* KHU VỰC 1: Thư viện Chính sách Mẫu (Nhà hàng) */}
          <div style={{ background: "#fff", padding: "1.25rem", borderRadius: "12px", border: "1px solid #E7E1D3" }}>
            <div style={{ fontSize: ".85rem", fontWeight: 700, textTransform: "uppercase", color: "#8A8272", marginBottom: "0.25rem" }}>
              <Library size={16} style={{ verticalAlign: '-2px' }} /> Thư viện Chính sách Mẫu (Nhà hàng)
            </div>
            <p style={{ fontSize: "0.8rem", color: "#6B6353", marginTop: 0, marginBottom: "1.25rem" }}>
              Chọn các chính sách mẫu do Nhà hàng thiết lập để áp dụng nhanh cho Chi nhánh này.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
              {restaurantTemplates.map((template) => {
                const isAssigned = assignedPolicyIds.includes(template.id);
                const isProcessing = loadingPolicyId === template.id;
                const templateName = template.policyName || template.name || "Chính sách mẫu";
                const templateCode = template.policyCode || template.code || "";
                const firstChar = templateName.charAt(0).toUpperCase();

                return (
                  <div
                    key={template.id}
                    style={{
                      border: isAssigned ? "1px dashed #D1D5DB" : "1px solid #E5E7EB",
                      borderRadius: "12px",
                      padding: "1.25rem",
                      background: isAssigned ? "#F9FAFB" : "#fff",
                      opacity: isAssigned ? 0.7 : 1,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: "1rem",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                          <div
                            style={{
                              width: "38px",
                              height: "38px",
                              borderRadius: "8px",
                              background: isAssigned ? "#E5E7EB" : "#F5EFE6",
                              color: isAssigned ? "#9CA3AF" : "#B45309",
                              fontWeight: 700,
                              fontSize: "1.1rem",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            {firstChar}
                          </div>
                          <div>
                            <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: isAssigned ? "#6B7280" : "#1F2937" }}>
                              {templateName}
                            </h4>
                            {templateCode && (
                              <span style={{ fontSize: "0.75rem", color: "#9CA3AF" }}>
                                Mã: {templateCode}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div style={{ marginTop: "0.85rem" }}>
                        {renderScheduleTypeBadge(template.policyScheduleType)}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        type="button"
                        onClick={() => handleViewTemplateDetail(template.id)}
                        style={{
                          padding: "0.5rem 0.75rem",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          borderRadius: "8px",
                          border: "1px solid #D1D5DB",
                          background: "#fff",
                          color: "#374151",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.3rem",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <Eye size={14} /> Xem
                      </button>

                      <button
                        type="button"
                        disabled={isAssigned || isProcessing || isReadOnly}
                        onClick={() => handleAssignTemplate(template.id)}
                        style={{
                          ...(isAssigned ? S.btnOutline : S.btnGold),
                          flex: 1,
                          padding: "0.5rem 0.8rem",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          cursor: isAssigned || isProcessing || isReadOnly ? "not-allowed" : "pointer",
                          backgroundColor: isAssigned ? "#E5E7EB" : undefined,
                          color: isAssigned ? "#9CA3AF" : undefined,
                          borderColor: isAssigned ? "#E5E7EB" : undefined,
                          borderRadius: "8px",
                        }}
                      >
                        {isProcessing
                          ? <><Hourglass size={14} style={{ verticalAlign: '-2px' }} /> Đang áp dụng...</>
                          : isAssigned
                            ? <><Check size={14} style={{ verticalAlign: '-2px' }} /> Đã áp dụng</>
                            : "＋ Áp dụng cho CN này"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* KHU VỰC 2: Các Policy ĐANG ÁP DỤNG thực tế tại Chi Nhánh */}
          <div style={{ background: "#fff", padding: "1.25rem", borderRadius: "12px", border: "1px solid #E7E1D3" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <div style={{ fontSize: ".85rem", fontWeight: 700, textTransform: "uppercase", color: "#2E2A25" }}>
                <MapPin size={16} style={{ verticalAlign: '-2px' }} /> Chính sách đang hoạt động tại Chi nhánh ({branchPolicies.length})
              </div>
              <button
                onClick={fetchBranchPolicies}
                style={{
                  background: "none",
                  border: "none",
                  color: "#C9A24B",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <RefreshCw size={14} style={{ verticalAlign: '-2px' }} /> Làm mới
              </button>
            </div>

            {branchPolicies.length === 0 ? (
              <div style={{ padding: "2.5rem", textAlign: "center", color: "#8A8272", background: "#FBF7EE", borderRadius: "8px", border: "1px dashed #E7E1D3" }}>
                Chi nhánh chưa áp dụng chính sách nào. Hãy chọn từ Thư viện chính sách mẫu phía trên.
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.25rem" }}>
                {branchPolicies.map((bp) => {
                  const isSelected = selectedBranchPolicyId === bp.id;
                  const actualPolicyId = bp.policyId || bp.policy?.id;
                  const isDeleting = loadingPolicyId === actualPolicyId;
                  const policyName = bp.policyName || bp.policy?.policyName || bp.name || "Chính sách";
                  const policyCode = bp.policyCode || bp.policy?.policyCode || bp.code || "";
                  const scheduleType = bp.policyScheduleType || bp.policy?.policyScheduleType;
                  const firstChar = policyName.charAt(0).toUpperCase();

                  return (
                    <div
                      key={bp.id || actualPolicyId}
                      style={{
                        background: "#fff",
                        border: isSelected ? "2px solid #C9A24B" : "1px solid #E5E7EB",
                        borderRadius: "12px",
                        padding: "1.25rem",
                        boxShadow: isSelected ? "0 4px 12px rgba(201,162,75,0.12)" : "0 1px 3px rgba(0,0,0,0.04)",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        gap: "1rem",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div style={{ display: "flex", gap: "0.85rem", alignItems: "center" }}>
                            <div
                              style={{
                                width: "42px",
                                height: "42px",
                                borderRadius: "10px",
                                background: "#F5EFE6",
                                color: "#B45309",
                                fontWeight: 700,
                                fontSize: "1.2rem",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              {firstChar}
                            </div>

                            <div>
                              <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "#1F2937" }}>
                                {policyName}
                              </h4>
                              {policyCode && (
                                <span style={{ fontSize: "0.8rem", color: "#6B7280" }}>
                                  Mã: {policyCode}
                                </span>
                              )}
                            </div>
                          </div>

                          {scheduleType === "ALWAYS" && (
                            <span
                              style={{
                                fontSize: "0.72rem",
                                fontWeight: 600,
                                padding: "0.2rem 0.5rem",
                                borderRadius: "4px",
                                background: "#FEF3C7",
                                color: "#D97706",
                              }}
                            >
                              Mặc định
                            </span>
                          )}
                        </div>

                        <div style={{ marginTop: "1rem" }}>
                          {renderScheduleTypeBadge(scheduleType)}
                        </div>
                      </div>

                      <div style={{ borderTop: "1px dashed #F3F4F6", margin: "0.25rem 0" }} />

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <button
                          type="button"
                          disabled={isDeleting || isReadOnly}
                          onClick={() => handleOpenDeleteModal(actualPolicyId, policyName)}
                          style={{
                            background: "none",
                            border: "none",
                            color: isDeleting || isReadOnly ? "#9CA3AF" : "#DC2626",
                            fontSize: "0.8rem",
                            cursor: isDeleting || isReadOnly ? "not-allowed" : "pointer",
                            padding: 0,
                            fontWeight: 600,
                          }}
                        >
                          {isDeleting ? <><Hourglass size={14} style={{ verticalAlign: '-2px' }} /> Đang gỡ...</> : "Gỡ bỏ"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSelectBranchPolicy(bp.id)}
                          style={{
                            background: isSelected ? "#FBF7EE" : "#FFFDF9",
                            border: "1px solid #C9A24B",
                            borderRadius: "8px",
                            padding: "0.5rem 1.2rem",
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            color: "#855D10",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.4rem",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <Settings size={16} /> {isSelected ? "Đang cấu hình" : "Cấu hình chi tiết"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* KHU VỰC 3: Form cấu hình chi tiết khi chọn 1 Branch Policy */}
          {selectedBranchPolicyId && editingPolicy?.id && (
            <div style={{ background: "#fff", padding: "2rem", borderRadius: "12px", border: "1px solid #E7E1D3", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <div style={{ fontSize: ".95rem", fontWeight: 700, textTransform: "uppercase", color: "#6B6353", marginBottom: "1.5rem" }}>
                <Wrench size={16} style={{ verticalAlign: '-2px' }} /> Cấu hình Quy tắc cọc & Lịch trình riêng cho Chi nhánh
              </div>
              <PolicyFormWithExtras
                restaurantId={restaurantId}
                branchId={branchId}
                policy={editingPolicy}
                isReadOnly={isReadOnly}
                onChange={setEditingPolicy}
                onSubmit={async (updatedData) => {
                  await branchPolicyApi.update(branchId, selectedBranchPolicyId, updatedData);
                  await fetchBranchPolicies();
                }}
                onCancel={() => {
                  setSelectedBranchPolicyId(null);
                  setEditingPolicy(emptyPolicy);
                }}
                onRefresh={() => handleSelectBranchPolicy(selectedBranchPolicyId)}
              />
            </div>
          )}
        </>
      )}

      {/* ========================================================= */}
      {/* ========================================================= */}
      {/* SUB-TAB 2: QUY ĐỊNH HỦY CỌC & HOÀN TIỀN                 */}
      {/* ========================================================= */}
      {subTab === "cancellation" && (
        <div style={{ background: "#fff", padding: "1.5rem", borderRadius: "12px", border: "1px solid #E7E1D3" }}>
          <div style={{ marginBottom: "1.5rem" }}>
            <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "#1F2937" }}>
              <ShieldCheck size={18} style={{ verticalAlign: '-3px' }} /> Quy định Hủy đặt bàn & Hoàn tiền cọc
            </h4>
            <p style={{ fontSize: ".82rem", color: "#6B7280", margin: "4px 0 0 0" }}>
              Khách hủy bàn đúng hạn sẽ được <strong>hoàn 100% tiền cọc</strong>. Thiết lập mốc thời gian và tỷ lệ phạt khi hủy muộn bên dưới.
            </p>
          </div>

          {loadingCancel ? (
            <div style={{ padding: "2.5rem", textAlign: "center", color: "#8A8272" }}>
              <Hourglass size={16} style={{ verticalAlign: '-2px' }} /> Đang tải cấu hình hủy cọc...
            </div>
          ) : (
            <form onSubmit={handleSaveCancellation} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

              {/* 1. Mốc thời gian Hủy Miễn Phí (Mặc định 100%) */}
              <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", padding: "1rem", borderRadius: "8px" }}>
                <label style={{ ...ui.label, color: "#166534", display: "block", marginBottom: ".5rem" }}>
                  <Circle size={10} fill="#16A34A" color="#16A34A" style={{ verticalAlign: '0px' }} /> Mốc Hủy Miễn Phí (Hoàn 100% tiền cọc) *
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
                  <span style={ui.unitText}>Khách được hủy và hoàn 100% cọc trước:</span>
                  <input
                    type="number"
                    min="0"
                    disabled={isReadOnly}
                    value={cancelPolicy.freeCancellationHours}
                    onChange={(e) =>
                      setCancelPolicy((p) => ({ ...p, freeCancellationHours: Number(e.target.value) }))
                    }
                    style={{ ...ui.input, width: "90px", fontWeight: 700, textAlign: "center" }}
                    required
                  />
                  <span style={{ ...ui.unitText, fontWeight: 600 }}>giờ (so với giờ nhận bàn)</span>
                </div>
              </div>

              {/* 2. Tỷ lệ hoàn tiền khi Vi phạm (Hủy muộn & No-show) */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginTop: ".5rem" }}>

                {/* Hủy muộn */}
                <div style={ui.formGroup}>
                  <label style={ui.label}>Hoàn tiền khi Hủy Muộn (%) *</label>
                  <div style={{ display: "flex", alignItems: "center", gap: ".4rem" }}>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      disabled={isReadOnly}
                      value={cancelPolicy.lateCancellationRefundPercent}
                      onChange={(e) =>
                        setCancelPolicy((p) => ({ ...p, lateCancellationRefundPercent: Number(e.target.value) }))
                      }
                      style={ui.input}
                      required
                    />
                    <span style={ui.unitText}>%</span>
                  </div>
                  <small style={ui.helpText}>Áp dụng khi hủy sát giờ (dưới {cancelPolicy.freeCancellationHours} tiếng).</small>
                </div>

                {/* No-Show */}
                <div style={ui.formGroup}>
                  <label style={ui.label}>Hoàn tiền Khách Không Đến (%) *</label>
                  <div style={{ display: "flex", alignItems: "center", gap: ".4rem" }}>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      disabled={isReadOnly}
                      value={cancelPolicy.noShowRefundPercent}
                      onChange={(e) =>
                        setCancelPolicy((p) => ({ ...p, noShowRefundPercent: Number(e.target.value) }))
                      }
                      style={ui.input}
                      required
                    />
                    <span style={ui.unitText}>%</span>
                  </div>
                  <small style={ui.helpText}>Áp dụng khi quá giờ hẹn mà khách không đến.</small>
                </div>

              </div>

              {/* Trạng thái áp dụng */}
              <div style={ui.formGroup}>
                <label style={ui.label}>Trạng thái quy định</label>
                <select
                  disabled={isReadOnly}
                  value={cancelPolicy.status}
                  onChange={(e) => setCancelPolicy((p) => ({ ...p, status: e.target.value }))}
                  style={{ ...ui.input, maxWidth: "220px" }}
                >
                  <option value="ACTIVE">Kích hoạt (ACTIVE)</option>
                  <option value="INACTIVE">Tắt (INACTIVE)</option>
                </select>
              </div>

              {/* Action Save Button */}
              {!isReadOnly && (
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem", borderTop: "1px solid #F3F4F6", paddingTop: "1rem" }}>
                  <button type="submit" disabled={savingCancel} style={ui.saveBtn}>
                    {savingCancel
                      ? <><Hourglass size={16} style={{ verticalAlign: '-2px' }} /> Đang lưu...</>
                      : <><Save size={16} style={{ verticalAlign: '-2px' }} /> Lưu chính sách hủy cọc</>}
                  </button>
                </div>
              )}

            </form>
          )}
        </div>
      )}

      {/* MODAL XEM CHI TIẾT TEMPLATE (READ-ONLY) */}
      {viewingTemplate && (
        <PolicyFormWithExtras
          restaurantId={restaurantId}
          policy={viewingTemplate}
          isReadOnly={true}
          onCancel={() => setViewingTemplate(null)}
        />
      )}

      {/* MODAL XÁC NHẬN XÓA */}
      {deleteModal.isOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            backdropFilter: "blur(2px)",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "12px",
              padding: "1.5rem 1.75rem",
              maxWidth: "420px",
              width: "90%",
              boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
              border: "1px solid #E5E7EB",
            }}
          >
            <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.1rem", fontWeight: 700, color: "#1F2937" }}>
              Xác nhận gỡ bỏ chính sách
            </h3>
            <p style={{ margin: "0 0 1.5rem 0", fontSize: "0.9rem", color: "#4B5563", lineHeight: 1.5 }}>
              Bạn có chắc chắn muốn gỡ bỏ chính sách <strong>"{deleteModal.policyName}"</strong> khỏi chi nhánh này không?
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button
                type="button"
                onClick={() => setDeleteModal({ isOpen: false, policyId: null, policyName: "" })}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "6px",
                  border: "1px solid #D1D5DB",
                  background: "#fff",
                  color: "#374151",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                }}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "6px",
                  border: "none",
                  background: "#DC2626",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                }}
              >
                Gỡ bỏ ngay
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

const ui = {
  subTabContainer: {
    display: "flex",
    gap: ".5rem",
    borderBottom: "2px solid #E5E7EB",
    paddingBottom: ".2rem",
  },
  subTabBtn: {
    padding: ".65rem 1.2rem",
    border: "none",
    background: "transparent",
    fontSize: ".88rem",
    fontWeight: 600,
    color: "#6B7280",
    cursor: "pointer",
    borderRadius: "8px 8px 0 0",
    transition: "all 0.2s",
  },
  subTabBtnActive: {
    color: "#855D10",
    background: "#FEF3C7",
    borderBottom: "3px solid #C9A24B",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: ".35rem",
  },
  label: {
    fontSize: ".82rem",
    fontWeight: 600,
    color: "#374151",
  },
  input: {
    width: "100%",
    padding: ".45rem .65rem",
    border: "1px solid #D1D5DB",
    borderRadius: 6,
    fontSize: ".88rem",
    height: "38px",
    boxSizing: "border-box",
  },
  unitText: {
    fontSize: ".85rem",
    color: "#4B5563",
    whiteSpace: "nowrap",
  },
  helpText: {
    fontSize: ".75rem",
    color: "#6B7280",
    fontStyle: "italic",
  },
  saveBtn: {
    padding: ".6rem 1.4rem",
    background: "#C9A24B",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    fontWeight: 700,
    fontSize: ".88rem",
    cursor: "pointer",
  },
};