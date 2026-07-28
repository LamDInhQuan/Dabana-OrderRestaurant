import { useState, useEffect, useRef } from 'react'
import { restaurantApi } from '../../api'

const C = {
  muted: "#6b7280",
};

const S = {
  card: {
    background: "#fff",
    borderRadius: "1rem",
    padding: "1.5rem",
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
  },
  eyebrow: {
    color: "#111827",
    fontSize: "0.875rem",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    marginBottom: "0.5rem",
  },
  label: {
    display: "block",
    marginBottom: "0.5rem",
    fontWeight: 600,
    color: "#374151",
  },
  input: {
    width: "100%",
    padding: "0.75rem 1rem",
    borderRadius: "0.75rem",
    border: "1px solid #d1d5db",
    outline: "none",
    fontSize: "0.95rem",
    boxSizing: "border-box",
  },


  dropdownToggle: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem 1rem',
    borderRadius: '0.75rem',
    border: '1px solid #d1d5db',
    background: '#fff',
    cursor: 'pointer',
    fontSize: '0.95rem',
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: '0.5rem',
    background: '#fff',
    border: '1px solid #d1d5db',
    borderRadius: '0.75rem',
    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
    zIndex: 20,
    maxHeight: '240px',
    overflowY: 'auto',
    padding: '0.75rem',
  },
  checkboxItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    cursor: "pointer",
    marginBottom: "0.5rem",
    userSelect: "none",
  },
};

export default function ExportExcelBar({ branches = [] }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState([]);
  const [exportFromDate, setExportFromDate] = useState("");
  const [exportToDate, setExportToDate] = useState("");
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setBranchDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = async () => {
    setLoading(true);
    setError(null);

    try {
      const branchIds = selected.length ? selected : undefined;
      if (exportFromDate && exportToDate && new Date(exportFromDate) > new Date(exportToDate)) {
        setError("Ngày bắt đầu không thể lớn hơn ngày kết thúc.");
        setLoading(false);
        return;
      }
      const response = await restaurantApi.export(branchIds, exportFromDate || undefined, exportToDate || undefined);

      const disposition = response.headers["content-disposition"];
      let fileName = "reservations.xlsx";
      if (disposition && disposition.includes("filename=")) {
        fileName = disposition
          .split("filename=")[1]
          .replace(/['"]+/g, "")
          .trim();
      }

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export Excel thất bại:", err);
      setError("Xuất file thất bại, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const toggleOption = (branchId) => {
    setSelected((prevSelected) =>
      prevSelected.includes(branchId)
        ? prevSelected.filter((item) => item !== branchId)
        : [...prevSelected, branchId]
    );
  };

  const selectedLabel = selected.length > 0 ? `${selected.length} chi nhánh đã chọn` : 'Chọn chi nhánh';

  return (
    <div style={{ ...S.card, marginBottom: "1.5rem" }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <div style={S.eyebrow}>Xuất báo cáo</div>
          <p style={{ color: C.muted, margin: 0, maxWidth: 520 }}>
            Chọn chi nhánh và khoảng thời gian để tải báo cáo Excel.
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "1rem", marginTop: "1rem" }}>
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <label style={S.label}>Chi nhánh</label>
          <button
            type="button"
            onClick={() => setBranchDropdownOpen((prev) => !prev)}
            style={S.dropdownToggle}
          >
            <span>{selectedLabel}</span>
            <span>{branchDropdownOpen ? '▲' : '▼'}</span>
          </button>

          {branchDropdownOpen && (
            <div style={S.dropdownMenu}>
              {branches.length ? (
                branches.map((branch) => (
                  <label
                    key={branch.id}
                    htmlFor={`branch-${branch.id}`}
                    style={S.checkboxItem}
                  >
                    <input 
                      style={{ width: 30  }}
                      className='checkbox'
                      id={`branch-${branch.id}`}
                      type="checkbox"
                      checked={selected.includes(branch.id)}
                      onChange={() => toggleOption(branch.id)}
                    />
                    <span>{branch.name}</span>
                  </label>
                ))
              ) : (
                <p style={{ margin: 0, color: C.muted }}>Không có chi nhánh để chọn.</p>
              )}
            </div>
          )}
        </div>

        <div>
          <label style={S.label}>Từ ngày</label>
          <input
            type="date"
            value={exportFromDate}
            onChange={(e) => setExportFromDate(e.target.value)}
            style={S.input}
          />
        </div>

        <div>
          <label style={S.label}>Đến ngày</label>
          <input
            type="date"
            value={exportToDate}
            onChange={(e) => setExportToDate(e.target.value)}
            style={S.input}
          />
        </div>
      </div>

      <div style={{ marginTop: "1.25rem", display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center" }}>
        <button
          type="button"
          onClick={handleExport}
          disabled={loading}
          style={{
            ...S.button,
            opacity: loading ? 0.7 : 1,
            pointerEvents: loading ? "none" : "auto",
          }}
        >
          {loading ? "Đang xuất..." : "Xuất báo cáo"}
        </button>
        {error && <div style={{ color: "#dc2626", fontSize: "0.95rem" }}>{error}</div>}
      </div>
    </div>
  );
}
