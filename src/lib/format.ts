export const inr = (n: number | string | null | undefined) =>
  "₹" + Number(n ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });

export const fmtDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export const TA_MONTHS = ["ஜனவரி", "பிப்ரவரி", "மார்ச்", "ஏப்ரல்", "மே", "ஜூன்", "ஜூலை", "ஆகஸ்ட்", "செப்டம்பர்", "அக்டோபர்", "நவம்பர்", "டிசம்பர்"];
export const EN_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const monthLabel = (m: number | null) => (m ? `${TA_MONTHS[m - 1]} (${EN_MONTHS[m - 1]})` : "—");

export const SUB_STATUS: Record<string, { ta: string; en: string; tone: "success" | "warning" | "muted" }> = {
  paid: { ta: "செலுத்தப்பட்டது", en: "Paid", tone: "success" },
  partial: { ta: "பகுதி", en: "Partial", tone: "warning" },
  pending: { ta: "நிலுவையில்", en: "Pending", tone: "muted" },
};
export const MT_STATUS: Record<string, { ta: string; en: string; tone: "success" | "warning" | "muted" }> = {
  active: { ta: "நடப்பில்", en: "Active", tone: "muted" },
  partially_returned: { ta: "பகுதி திருப்பியது", en: "Partially Returned", tone: "warning" },
  fully_returned: { ta: "முழுமையாக திருப்பியது", en: "Fully Returned", tone: "success" },
};

export const today = () => new Date().toISOString().slice(0, 10);

export function downloadCsv(filename: string, rows: (string | number | null | undefined)[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function errMsg(e: unknown) {
  if (e && typeof e === "object" && "message" in e) return String((e as { message: string }).message);
  return "பிழை ஏற்பட்டது (Something went wrong)";
}
