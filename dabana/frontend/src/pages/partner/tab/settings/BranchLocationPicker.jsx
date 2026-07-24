import React, { useState, useEffect, useRef } from "react";

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
  const [isExpanded, setIsExpanded] = useState(false); // Phóng to dạng Fullscreen
  const debounceRef = useRef(null);

  // Load Leaflet Script
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

  // Khởi tạo Map
  useEffect(() => {
    if (!leafletReady || !mapRef.current || leafletMap.current) return;
    const L = window.L;
    const lat = parseFloat(value.latitude) || 21.0278;
    const lng = parseFloat(value.longitude) || 105.8342;

    const map = L.map(mapRef.current).setView([lat, lng], 15);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
    }).addTo(map);

    const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
    marker.bindPopup("Kéo ghim hoặc click để chọn").openPopup();

    // Event 1: Drag
    marker.on("dragend", (e) => {
      const pos = e.target.getLatLng();
      onChange({ latitude: pos.lat.toFixed(6), longitude: pos.lng.toFixed(6) });
    });

    // Event 2: Click Map
    map.on("click", (e) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      onChange({ latitude: lat.toFixed(6), longitude: lng.toFixed(6) });
    });

    leafletMap.current = map;
    markerRef.current = marker;

    setTimeout(() => map.invalidateSize(), 250);
  }, [leafletReady]);

  // Recalculate Size khi Bật Map hoặc Phóng to / Thu nhỏ
  useEffect(() => {
    if (leafletMap.current) {
      setTimeout(() => {
        leafletMap.current.invalidateSize();
      }, 200);
    }
  }, [showMap, isExpanded]);

  // Sync marker khi value đổi từ ngoài
  useEffect(() => {
    if (!leafletMap.current || !markerRef.current) return;
    if (!value.latitude || !value.longitude) return;
    const latlng = [parseFloat(value.latitude), parseFloat(value.longitude)];
    markerRef.current.setLatLng(latlng);
    leafletMap.current.setView(latlng, 16);
  }, [value.latitude, value.longitude]);

  // Search Address
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

  const hasCoords = Boolean(value.latitude && value.longitude);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", width: "100%" }}>
      {/* Search Bar */}
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
                  📍 {item.display_name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: "flex", gap: ".5rem", alignItems: "center", flexWrap: "wrap" }}>
        <button type="button" onClick={() => setShowMap(v => !v)} style={{ ...S.btnOut, fontSize: ".8rem", padding: "6px 12px" }}>
          {showMap ? "▲ Ẩn bản đồ" : "🗺 Mở bản đồ chọn vị trí"}
        </button>

        {showMap && (
          <button type="button" onClick={() => setIsExpanded(v => !v)} style={{ ...S.btnOut, fontSize: ".8rem", padding: "6px 12px", borderColor: C.gold, color: C.brownMid }}>
            {isExpanded ? "🗗 Thu nhỏ" : "⤢ Phóng to bản đồ"}
          </button>
        )}

        {hasCoords && (
          <span style={{ fontSize: ".75rem", color: C.green, fontWeight: 600 }}>
            ✓ Đã chọn tọa độ
          </span>
        )}
      </div>

      {/* Container Bản Đồ Duy Nhất (Chuyển style khi Phóng To) */}
      {showMap && (
        <div style={
          isExpanded
            ? {
                position: "fixed",
                inset: "20px",
                zIndex: 99999,
                background: "#fff",
                borderRadius: 8,
                boxShadow: "0 0 0 9999px rgba(0,0,0,0.7)",
                display: "flex",
                flexDirection: "column",
                padding: "10px",
              }
            : { position: "relative", width: "100%" }
        }>
          {isExpanded && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, padding: "0 4px" }}>
              <b style={{ color: C.brown }}>Chốt vị trí chi nhánh (Phóng to)</b>
              <button type="button" onClick={() => setIsExpanded(false)} style={S.btnGold}>✓ Xác nhận & Đóng</button>
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
              📍 Click trên bản đồ hoặc kéo ghim để cập nhật kinh/vĩ độ.
            </p>
          )}
        </div>
      )}

      {/* Vĩ độ / Kinh độ */}
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

// ─── Modal Thêm Chi Nhánh (Cấu trúc Layout Chuẩn) ───────────────
export function NewBranchModal({ newBranchModal, setNewBranchModal, createBranch, newBranchForm, setNewBranchForm, creatingBranch }) {
  if (!newBranchModal) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 200,
      display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem"
    }}>
      <div style={{
        background: C.white, borderRadius: 8, width: "100%", maxWidth: 580,
        maxHeight: "85vh", // Giới hạn chiều cao Modal
        display: "flex", flexDirection: "column", overflow: "hidden",
        boxShadow: "0 10px 30px rgba(0,0,0,.3)"
      }}>
        {/* 1. Header cố định */}
        <div style={{ background: `linear-gradient(135deg,${C.brown},${C.brownMid})`, padding: "1rem 1.25rem", flexShrink: 0 }}>
          <h2 style={{ fontWeight: 700, color: "#fff", fontSize: "1.1rem", margin: 0 }}>Thêm chi nhánh mới</h2>
        </div>

        {/* 2. Body LƯỚT ĐƯỢC (overflowY: auto) */}
        <form onSubmit={createBranch} style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem", overflowY: "auto", flex: 1 }}>
          <div>
            <label style={S.label}>Tên chi nhánh *</label>
            <input style={S.input} value={newBranchForm.name} required
              onChange={e => setNewBranchForm(p => ({ ...p, name: e.target.value }))} />
          </div>

          <div>
            <label style={S.label}>Địa chỉ *</label>
            <input style={S.input} value={newBranchForm.address} required
              onChange={e => setNewBranchForm(p => ({ ...p, address: e.target.value }))} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={S.label}>Tỉnh/Thành phố</label>
              <input style={S.input} value={newBranchForm.province || ""}
                onChange={e => setNewBranchForm(p => ({ ...p, province: e.target.value }))} />
            </div>
            <div>
              <label style={S.label}>Số điện thoại</label>
              <input style={S.input} value={newBranchForm.phone || ""}
                onChange={e => setNewBranchForm(p => ({ ...p, phone: e.target.value }))} />
            </div>
          </div>

          {/* Component Bản đồ độc lập 100% width */}
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: "1rem" }}>
            <BranchLocationPicker
              value={{ latitude: newBranchForm.latitude, longitude: newBranchForm.longitude }}
              onChange={({ latitude, longitude }) =>
                setNewBranchForm(p => ({ ...p, latitude, longitude }))
              }
            />
          </div>

          <p style={{ fontSize: ".76rem", color: C.muted, margin: 0 }}>
            Chi nhánh mới sẽ ở trạng thái "Chờ duyệt" cho đến khi quản trị viên xác thực.
          </p>

          {/* 3. Footer Buttons Cố định góc dưới */}
          <div style={{ display: "flex", gap: ".75rem", justifyContent: "flex-end", paddingTop: ".5rem" }}>
            <button type="button" onClick={() => setNewBranchModal(false)} style={S.btnOut}>Huỷ</button>
            <button type="submit" disabled={creatingBranch} style={S.btnGold}>
              {creatingBranch ? "Đang tạo..." : "✦ Tạo chi nhánh"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}