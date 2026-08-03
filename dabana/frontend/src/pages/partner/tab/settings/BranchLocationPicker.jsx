import React, { useState, useEffect, useRef } from "react";
import { MapPin, ChevronUp, Map, Minimize2, Maximize2, Check, X, Star, Sparkles } from "lucide-react";

const C = {
  brown: "#5C3A1E",
  brownMid: "#7A4F2D",
  gold: "#C9A84C",
  white: "#FFFFFF",
  muted: "#888",
  border: "#E2D9CF",
  bg: "#FAF8F5",
  red: "#C0392B",
  green: "#27AE60",
};

const S = {
  label: { fontSize: ".8rem", fontWeight: 600, color: C.brown, display: "block", marginBottom: 4 },
  input: {
    width: "100%", boxSizing: "border-box", padding: "8px 10px",
    border: `1px solid ${C.border}`, borderRadius: 4, fontSize: ".88rem",
    outline: "none", background: C.white, color: "#333",
  },
  select: {
    width: "100%", boxSizing: "border-box", padding: "8px 10px",
    border: `1px solid ${C.border}`, borderRadius: 4, fontSize: ".88rem",
    outline: "none", background: C.white, color: "#333", cursor: "pointer",
  },
  inputReadonly: {
    width: "100%", boxSizing: "border-box", padding: "8px 10px",
    border: `1px solid ${C.border}`, borderRadius: 4, fontSize: ".82rem",
    outline: "none", background: "#F0EDE8", color: C.muted, fontFamily: "monospace",
  },
  btnGold: {
    padding: "9px 18px", background: `linear-gradient(135deg,${C.gold},#B8932A)`,
    color: "#fff", border: "none", borderRadius: 4, fontWeight: 700,
    cursor: "pointer", fontSize: ".85rem",
  },
  btnOut: {
    padding: "9px 18px", background: "transparent",
    color: C.brown, border: `1px solid ${C.brown}`, borderRadius: 4,
    cursor: "pointer", fontSize: ".85rem",
  },
};

// ─── Component BranchLocationPicker ───────────────────────────
export function BranchLocationPicker({ value, onChange }) {
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const markerRef = useRef(null);

  const [leafletReady, setLeafletReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchErr, setSearchErr] = useState("");
  const [showMap, setShowMap] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!showMap) return;
    if (window.L) {
      setLeafletReady(true);
      return;
    }
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(css);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => setLeafletReady(true);
    document.head.appendChild(script);
  }, [showMap]);

  useEffect(() => {
    if (!leafletReady || !mapRef.current || leafletMap.current) return;
    const L = window.L;
    const lat = parseFloat(value?.latitude) || 21.0278;
    const lng = parseFloat(value?.longitude) || 105.8342;

    const map = L.map(mapRef.current).setView([lat, lng], 15);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
    }).addTo(map);

    const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
    marker.bindPopup("Kéo ghim hoặc click để chọn").openPopup();

    marker.on("dragend", (e) => {
      const pos = e.target.getLatLng();
      onChange({ latitude: pos.lat.toFixed(6), longitude: pos.lng.toFixed(6) });
    });

    map.on("click", (e) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      onChange({ latitude: lat.toFixed(6), longitude: lng.toFixed(6) });
    });

    leafletMap.current = map;
    markerRef.current = marker;

    setTimeout(() => map.invalidateSize(), 250);
  }, [leafletReady]);

  useEffect(() => {
    if (leafletMap.current) {
      setTimeout(() => {
        leafletMap.current.invalidateSize();
      }, 200);
    }
  }, [showMap, isExpanded]);

  useEffect(() => {
    if (!leafletMap.current || !markerRef.current) return;
    if (!value?.latitude || !value?.longitude) return;
    const latlng = [parseFloat(value.latitude), parseFloat(value.longitude)];
    markerRef.current.setLatLng(latlng);
    leafletMap.current.setView(latlng, 16);
  }, [value?.latitude, value?.longitude]);

  const handleSearchInput = (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    setSearchErr("");
    clearTimeout(debounceRef.current);
    if (q.length < 3) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&countrycodes=vn`, {
          headers: { "Accept-Language": "vi" }
        });
        const results = await res.json();
        setSuggestions(results.slice(0, 5));
        if (results.length === 0) setSearchErr("Không tìm thấy địa điểm.");
      } catch {
        setSearchErr("Lỗi kết nối.");
      } finally { setSearching(false); }
    }, 500);
  };

  const selectSuggestion = (item) => {
    const lat = parseFloat(item.lat).toFixed(6);
    const lng = parseFloat(item.lon).toFixed(6);
    onChange({ latitude: lat, longitude: lng });
    setSearchQuery(item.display_name);
    setSuggestions([]);
    if (!showMap) setShowMap(true);
  };

  const hasCoords = Boolean(value?.latitude && value?.longitude);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", width: "100%" }}>
      <div>
        <label style={S.label}>Tìm kiếm vị trí trên bản đồ</label>
        <div style={{ position: "relative", width: "100%" }}>
          <input
            style={{ ...S.input, width: "100%", paddingRight: 36 }}
            placeholder="Nhập tên địa điểm, đường..."
            value={searchQuery}
            onChange={handleSearchInput}
          />
          {suggestions.length > 0 && (
            <div style={{
              position: "absolute", top: "100%", left: 0, right: 0, zIndex: 999,
              background: C.white, border: `1px solid ${C.border}`, borderRadius: 4,
              boxShadow: "0 4px 12px rgba(0,0,0,.15)", maxHeight: 180, overflowY: "auto",
            }}>
              {suggestions.map((item, i) => (
                <div key={i} onClick={() => selectSuggestion(item)}
                  style={{ padding: "8px 12px", cursor: "pointer", fontSize: ".82rem", borderBottom: `1px solid ${C.border}` }}
                >
                  <MapPin size={14} style={{ verticalAlign: "-2px" }} /> {item.display_name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: ".5rem", alignItems: "center", flexWrap: "wrap" }}>
        <button type="button" onClick={() => setShowMap(v => !v)} style={{ ...S.btnOut, fontSize: ".8rem", padding: "6px 12px" }}>
          {showMap ? <><ChevronUp size={14} style={{ verticalAlign: "-2px" }} /> Ẩn bản đồ</> : <><Map size={14} style={{ verticalAlign: "-2px" }} /> Mở bản đồ chọn vị trí</>}
        </button>

        {showMap && (
          <button type="button" onClick={() => setIsExpanded(v => !v)} style={{ ...S.btnOut, fontSize: ".8rem", padding: "6px 12px", borderColor: C.gold, color: C.brownMid }}>
            {isExpanded ? <><Minimize2 size={14} style={{ verticalAlign: "-2px" }} /> Thu nhỏ</> : <><Maximize2 size={14} style={{ verticalAlign: "-2px" }} /> Phóng to bản đồ</>}
          </button>
        )}

        {hasCoords && (
          <span style={{ fontSize: ".75rem", color: C.green, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "3px" }}>
            <Check size={13} /> Đã chọn tọa độ
          </span>
        )}
      </div>

      {showMap && (
        <div style={
          isExpanded
            ? {
              position: "fixed", inset: "20px", zIndex: 99999, background: "#fff",
              borderRadius: 8, boxShadow: "0 0 0 9999px rgba(0,0,0,0.7)",
              display: "flex", flexDirection: "column", padding: "10px",
            }
            : { position: "relative", width: "100%" }
        }>
          {isExpanded && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, padding: "0 4px" }}>
              <b style={{ color: C.brown }}>Chốt vị trí chi nhánh (Phóng to)</b>
              <button type="button" onClick={() => setIsExpanded(false)} style={S.btnGold}><Check size={14} style={{ verticalAlign: "-2px" }} /> Xác nhận & Đóng</button>
            </div>
          )}

          <div
            ref={mapRef}
            style={{
              width: "100%",
              height: isExpanded ? "calc(100% - 40px)" : "280px",
              borderRadius: 6,
              border: `1px solid ${C.border}`,
            }}
          />

          {!isExpanded && (
            <p style={{ fontSize: ".72rem", color: C.muted, marginTop: 4 }}>
              <MapPin size={13} style={{ verticalAlign: "-2px" }} /> Click trên bản đồ hoặc kéo ghim để cập nhật kinh/vĩ độ.
            </p>
          )}
        </div>
      )}

      {hasCoords && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <div>
            <label style={{ ...S.label, color: C.muted }}>Vĩ độ (Latitude)</label>
            <input style={S.inputReadonly} readOnly value={value.latitude} />
          </div>
          <div>
            <label style={{ ...S.label, color: C.muted }}>Kinh độ (Longitude)</label>
            <input style={S.inputReadonly} readOnly value={value.longitude} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Component Quản lý danh sách ảnh chi nhánh ───────────────────
function BranchImageManager({ images = [], onChange }) {
  const [urlInput, setUrlInput] = useState("");

  const handleAddImage = () => {
    if (!urlInput.trim()) return;
    const newImage = {
      id: null,
      imageUrl: urlInput.trim(),
      isCover: images.length === 0 ? 1 : 0,
      displayOrder: images.length + 1,
    };
    onChange([...images, newImage]);
    setUrlInput("");
  };

  const handleRemove = (index) => {
    const updated = images.filter((_, i) => i !== index);
    const reordered = updated.map((img, i) => ({
      ...img,
      displayOrder: i + 1,
      isCover: i === 0 ? 1 : 0
    }));
    onChange(reordered);
  };

  const handleSetCover = (index) => {
    const updated = images.map((img, i) => ({
      ...img,
      isCover: i === index ? 1 : 0
    }));
    onChange(updated);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <label style={S.label}>Hình ảnh chi nhánh & Banner</label>

      <div style={{ display: "flex", gap: "0.5rem" }}>
        <input
          style={{ ...S.input, flex: 1 }}
          placeholder="Dán đường dẫn URL hình ảnh vào đây..."
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddImage(); } }}
        />
        <button type="button" onClick={handleAddImage} style={S.btnGold}>
          + Thêm ảnh
        </button>
      </div>

      {images.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "200px", overflowY: "auto", paddingRight: "4px" }}>
          {images.map((img, index) => (
            <div key={index} style={{
              display: "flex", alignItems: "center", gap: "0.75rem",
              background: C.bg, padding: "8px", borderRadius: 6, border: `1px solid ${C.border}`
            }}>
              <img src={img.imageUrl} alt="preview" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 4, border: `1px solid ${C.border}` }}
                onError={(e) => { e.target.src = "https://via.placeholder.com/40?text=Lỗi"; }} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: ".8rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "#333" }}>
                  {img.imageUrl}
                </div>
                <div style={{ fontSize: ".72rem", color: C.muted }}>
                  Thứ tự: #{img.displayOrder} {img.isCover === 1 ? <span style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}>• <Star size={12} /> Ảnh Bìa (Banner)</span> : ""}
                </div>
              </div>

              {img.isCover !== 1 && (
                <button type="button" onClick={() => handleSetCover(index)} style={{ ...S.btnOut, fontSize: ".75rem", padding: "4px 8px" }}>
                  Đặt làm bìa
                </button>
              )}

              <button type="button" onClick={() => handleRemove(index)} style={{ background: "transparent", border: "none", color: C.red, cursor: "pointer", fontSize: "1rem", fontWeight: "bold", display: "inline-flex" }}>
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ fontSize: ".75rem", color: C.muted, fontStyle: "italic", margin: 0 }}>
          Chưa có hình ảnh nào được thêm. (Khuyến nghị thêm ít nhất 1 ảnh làm banner chi nhánh).
        </p>
      )}
    </div>
  );
}

// ─── Modal Thêm Chi Nhánh ───────────────
export function NewBranchModal({ newBranchModal, setNewBranchModal, createBranch, newBranchForm, setNewBranchForm, creatingBranch }) {
  const [provinces, setProvinces] = useState([]);

  useEffect(() => {
    if (!newBranchModal) return;
    fetch('https://provinces.open-api.vn/api/p/')
      .then(res => res.json())
      .then(data => setProvinces(data))
      .catch(err => console.error("Lỗi tải tỉnh thành:", err));
  }, [newBranchModal]);

  if (!newBranchModal) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 200,
      display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem"
    }}>
      <div style={{
        background: C.white, borderRadius: 8, width: "100%", maxWidth: 620,
        maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden",
        boxShadow: "0 10px 30px rgba(0,0,0,.3)"
      }}>
        <div style={{ background: `linear-gradient(135deg,${C.brown},${C.brownMid})`, padding: "1rem 1.25rem", flexShrink: 0 }}>
          <h2 style={{ fontWeight: 700, color: "#fff", fontSize: "1.1rem", margin: 0 }}>Thêm chi nhánh mới</h2>
        </div>

        <form onSubmit={createBranch} style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem", overflowY: "auto", flex: 1 }}>
          <div>
            <label style={S.label}>Tên chi nhánh * (Tối đa 150 ký tự)</label>
            <input style={S.input} value={newBranchForm.name} required maxLength={150}
              onChange={e => setNewBranchForm(p => ({ ...p, name: e.target.value }))} />
          </div>

          <div>
            <label style={S.label}>Địa chỉ *</label>
            <input style={S.input} value={newBranchForm.address} required
              onChange={e => setNewBranchForm(p => ({ ...p, address: e.target.value }))} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={S.label}>Tỉnh/Thành phố *</label>
              <select 
                style={S.select} 
                value={newBranchForm.province || ""} 
                required
                onChange={e => setNewBranchForm(p => ({ ...p, province: e.target.value }))}
              >
                <option value="">-- Chọn Tỉnh/Thành phố --</option>
                {provinces.map(prov => (
                  <option key={prov.code} value={prov.name}>{prov.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={S.label}>Số điện thoại</label>
              <input style={S.input} value={newBranchForm.phone || ""} maxLength={20}
                onChange={e => setNewBranchForm(p => ({ ...p, phone: e.target.value }))} />
            </div>
          </div>

          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: "1rem" }}>
            <BranchImageManager
              images={newBranchForm.branchImages || []}
              onChange={(updatedImages) => setNewBranchForm(p => ({ ...p, branchImages: updatedImages }))}
            />
          </div>

          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: "1rem" }}>
            <BranchLocationPicker
              value={{ latitude: newBranchForm.latitude, longitude: newBranchForm.longitude }}
              onChange={({ latitude, longitude }) => setNewBranchForm(p => ({ ...p, latitude, longitude }))}
            />
          </div>

          <p style={{ fontSize: ".76rem", color: C.muted, margin: 0 }}>
            Chi nhánh mới sẽ ở trạng thái "Chờ duyệt" cho đến khi quản trị viên xác thực.
          </p>

          <div style={{ display: "flex", gap: ".75rem", justifyContent: "flex-end", paddingTop: ".5rem" }}>
            <button type="button" onClick={() => setNewBranchModal(false)} style={S.btnOut}>Huỷ</button>
            <button type="submit" disabled={creatingBranch} style={S.btnGold}>
              {creatingBranch ? "Đang tạo..." : <span style={{ display: "inline-flex", alignItems: "center", gap: ".4rem" }}><Sparkles size={14} /> Tạo chi nhánh</span>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal Sửa Chi Nhánh (Đã tích hợp API Tỉnh/Thành phố & Sửa lỗi ImageManager) ───────────────
export function EditBranchModal({ editBranchModal, setEditBranchModal, updateBranch, editBranchForm, setEditBranchForm, updatingBranch }) {
  const [provinces, setProvinces] = useState([]);

  // 1. Chỉ fetch khi modal mở và form đã có dữ liệu
  useEffect(() => {
    console.log("vao day");
    
    if (!editBranchModal || !editBranchForm) return;
    
    console.log("vao day - Đang tải danh sách tỉnh thành...");
    fetch('https://provinces.open-api.vn/api/p/')
      .then(res => res.json())
      .then(data => setProvinces(data))
      .catch(err => console.error("Lỗi tải tỉnh thành:", err));
  }, [editBranchModal, editBranchForm]);

  // 2. Chặn render ngay từ đầu nếu modal đóng hoặc form chưa có dữ liệu (tránh lỗi crash ngầm)
  if (!editBranchModal || !editBranchForm) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 200,
      display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem"
    }}>
      <div style={{
        background: C.white, borderRadius: 8, width: "100%", maxWidth: 620,
        maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden",
        boxShadow: "0 10px 30px rgba(0,0,0,.3)"
      }}>
        <div style={{ background: `linear-gradient(135deg,${C.brown},${C.brownMid})`, padding: "1rem 1.25rem", flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontWeight: 700, color: "#fff", fontSize: "1.1rem", margin: 0 }}>
            Sửa chi nhánh — {editBranchForm?.name || ""}
          </h2>
          {editBranchForm?.id && <span style={{ color: C.gold, fontSize: "0.85rem", fontWeight: 600 }}>ID #{editBranchForm.id}</span>}
        </div>

        <form onSubmit={updateBranch} style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem", overflowY: "auto", flex: 1 }}>
          <div>
            <label style={S.label}>Tên chi nhánh * (Tối đa 150 ký tự)</label>
            <input style={S.input} value={editBranchForm.name || ""} required maxLength={150}
              onChange={e => setEditBranchForm(p => ({ ...p, name: e.target.value }))} />
          </div>

          <div>
            <label style={S.label}>Địa chỉ *</label>
            <input style={S.input} value={editBranchForm.address || ""} required
              onChange={e => setEditBranchForm(p => ({ ...p, address: e.target.value }))} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={S.label}>Tỉnh/Thành phố *</label>
              <select 
                style={S.select} 
                value={editBranchForm.province || ""} 
                required
                onChange={e => setEditBranchForm(p => ({ ...p, province: e.target.value }))}
              >
                <option value="">-- Chọn Tỉnh/Thành phố --</option>
                {provinces.map(prov => (
                  <option key={prov.code} value={prov.name}>{prov.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={S.label}>Số điện thoại</label>
              <input style={S.input} value={editBranchForm.phone || ""} maxLength={20}
                onChange={e => setEditBranchForm(p => ({ ...p, phone: e.target.value }))} />
            </div>
          </div>

          <div>
            <label style={S.label}>Trạng thái hoạt động</label>
            <select 
              style={S.select}
              value={editBranchForm.status ?? 1}
              onChange={e => setEditBranchForm(p => ({ ...p, status: Number(e.target.value) }))}
            >
              <option value={1}>Hoạt động</option>
              <option value={0}>Tạm ngưng</option>
            </select>
          </div>

          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: "1rem" }}>
            <BranchImageManager
              images={editBranchForm?.branchImages || []}
              onChange={(updatedImages) => setEditBranchForm(p => ({ ...p, branchImages: updatedImages }))}
            />
          </div>

          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: "1rem" }}>
            <BranchLocationPicker
              value={{ latitude: editBranchForm.latitude, longitude: editBranchForm.longitude }}
              onChange={({ latitude, longitude }) => setEditBranchForm(p => ({ ...p, latitude, longitude }))}
            />
          </div>

          <div style={{ display: "flex", gap: ".75rem", justifyContent: "flex-end", paddingTop: ".5rem" }}>
            <button type="button" onClick={() => setEditBranchModal(false)} style={S.btnOut}>Huỷ</button>
            <button type="submit" disabled={updatingBranch} style={S.btnGold}>
              {updatingBranch ? "Đang lưu..." : <span style={{ display: "inline-flex", alignItems: "center", gap: ".4rem" }}><Sparkles size={14} /> Lưu thay đổi</span>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}