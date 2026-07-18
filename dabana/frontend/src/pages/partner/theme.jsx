// theme.js
// Shared design tokens used across the Dashboard + Policy module.
// Kept as plain JS objects (not CSS-in-JS lib) to match the rest of the codebase.

export const C = {
  gold: "#C9A24B",
  goldBorder: "#E4D3A4",
  cream: "#FBF7EE",
  border: "#E7E1D3",
  text: "#2B2620",
  muted: "#8A8272",
  green: "#3F8F5F",
  red: "#B91C1C",
};

export const S = {
  card: {
    background: "#fff",
    border: `1px solid ${C.border}`,
    borderRadius: 6,
    padding: "1.5rem",
  },
  eyebrow: {
    fontSize: ".72rem",
    letterSpacing: ".08em",
    textTransform: "uppercase",
    color: C.muted,
    fontWeight: 700,
  },
  label: {
    display: "block",
    fontSize: ".78rem",
    fontWeight: 600,
    color: C.text,
    marginBottom: ".4rem",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: ".6rem .75rem",
    border: `1px solid ${C.border}`,
    borderRadius: 4,
    fontSize: ".88rem",
    color: C.text,
    background: "#fff",
    outline: "none",
  },
  btnGold: {
    background: C.gold,
    color: "#fff",
    border: "none",
    borderRadius: 4,
    fontWeight: 600,
    cursor: "pointer",
  },
  btnOutline: {
    background: "#fff",
    color: C.text,
    border: `1px solid ${C.border}`,
    borderRadius: 4,
    padding: ".45rem .9rem",
    fontSize: ".8rem",
    cursor: "pointer",
  },
};

export function GoldDivider() {
  return (
    <div
      style={{
        height: 1,
        background: `linear-gradient(to right, transparent, ${C.goldBorder}, transparent)`,
        margin: "0.25rem 0",
      }}
    />
  );
}