import { useState } from "react";
import { C, S } from "../../theme";

// ─── Component Quản lý danh sách ảnh chi nhánh ───────────────────
export default function BranchImageManager({ images = [], onChange }) {
    console.log("images",images);
    
    const [urlInput, setUrlInput] = useState("");

    const handleAddImage = () => {
        if (!urlInput.trim()) return;
        const newImage = {
            id: null,
            imageUrl: urlInput.trim(),
            // Nếu là ảnh đầu tiên thì mặc định làm ảnh bìa (isCover = 1), còn lại là 0
            isCover: images.length === 0 ? 1 : 0,
            displayOrder: images.length + 1,
        };
        onChange([...images, newImage]);
        setUrlInput("");    
    };

    const handleRemove = (index) => {
        const updated = images.filter((_, i) => i !== index);
        // Tự động sắp xếp lại displayOrder và đảm bảo luôn có ít nhất 1 ảnh làm cover nếu còn ảnh
        const reordered = updated.map((img, i) => ({
            ...img,
            displayOrder: i + 1,
            isCover: i === 0 ? 1 : 0 // Lấy ảnh đầu tiên làm cover mặc định nếu xóa ảnh cũ
        }));
        onChange(reordered);
    };

    const handleSetCover = (index) => {
        const updated = images.map((img, i) => ({
            ...img,
            isCover: i === index ? 1 : 0 // Đổi cờ isCover cho đúng ảnh được chọn
        }));
        onChange(updated);
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <label style={S.label}>Hình ảnh chi nhánh & Banner</label>

            {/* Input thêm URL ảnh */}
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

            {/* Danh sách ảnh đã thêm */}
            {images.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "200px", overflowY: "auto", paddingRight: "4px" }}>
                    {images.map((img, index) => (
                        <div key={index} style={{
                            display: "flex", alignItems: "center", gap: "0.75rem",
                            background: C.bg, padding: "8px", borderRadius: 6, border: `1px solid ${C.border}`
                        }}>
                            {/* Xem trước ảnh nhỏ */}
                            <img src={img.imageUrl} alt="preview" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 4, border: `1px solid ${C.border}` }}
                                onError={(e) => { e.target.src = "https://via.placeholder.com/40?text=Lỗi"; }} />

                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: ".8rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "#333" }}>
                                    {img.imageUrl}
                                </div>
                                <div style={{ fontSize: ".72rem", color: C.muted }}>
                                    Thứ tự: #{img.displayOrder} {img.isCover === 1 ? "• ⭐ Ảnh Bìa (Banner)" : ""}
                                </div>
                            </div>

                            {/* Nút chọn làm Cover */}
                            {img.isCover !== 1 && (
                                <button type="button" onClick={() => handleSetCover(index)} style={{ ...S.btnOut, fontSize: ".75rem", padding: "4px 8px" }}>
                                    Đặt làm bìa
                                </button>
                            )}

                            {/* Nút xóa */}
                            <button type="button" onClick={() => handleRemove(index)} style={{ background: "transparent", border: "none", color: C.red, cursor: "pointer", fontSize: "1rem", fontWeight: "bold" }}>
                                ✕
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