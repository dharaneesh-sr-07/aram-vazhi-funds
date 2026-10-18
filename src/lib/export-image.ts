import logoAsset from "@/assets/avk-logo.png.asset.json";

const GREEN = "#14532d";
const GOLD = "#b8860b";
const FONT = '"Noto Sans Tamil", "Noto Sans", sans-serif';

type Cell = string | number | null | undefined;

/** Renders a branded table (logo, group name, tagline, title, rows) to a PNG and downloads it. */
export async function downloadTableImage(filename: string, title: string, head: string[], rows: Cell[][]) {
  await document.fonts?.ready;
  const logo = new Image();
  logo.src = logoAsset.url;
  try { await logo.decode(); } catch { /* draw without logo */ }

  const scale = 2, pad = 40, rowH = 40, headH = 52, top = 230;
  const c = document.createElement("canvas");
  const m = c.getContext("2d")!;
  m.font = `15px ${FONT}`;
  const widths = head.map((h, i) => {
    let w = measure(m, h, `bold 15px ${FONT}`);
    for (const r of rows) w = Math.max(w, measure(m, String(r[i] ?? "—"), `15px ${FONT}`));
    return w + 28;
  });
  const tableW = widths.reduce((a, b) => a + b, 0);
  const W = Math.max(tableW + pad * 2, 820);
  const H = top + headH + Math.max(rows.length, 1) * rowH + 70;
  c.width = W * scale; c.height = H * scale;
  const g = c.getContext("2d")!;
  g.scale(scale, scale);
  g.fillStyle = "#ffffff"; g.fillRect(0, 0, W, H);
  g.fillStyle = GREEN; g.fillRect(0, 0, W, 8);

  if (logo.complete && logo.naturalWidth) g.drawImage(logo, W / 2 - 50, 22, 100, 100);
  g.textAlign = "center"; g.textBaseline = "middle";
  g.fillStyle = GREEN; g.font = `bold 30px ${FONT}`; g.fillText("அறம் வழிக் குழு", W / 2, 148);
  g.fillStyle = GOLD; g.font = `600 16px ${FONT}`; g.fillText("நம்பிக்கை • ஒற்றுமை • வெளிப்படைத்தன்மை", W / 2, 178);
  g.fillStyle = "#111827"; g.font = `bold 18px ${FONT}`; g.fillText(title, W / 2, 208);

  const x0 = (W - tableW) / 2;
  let y = top;
  g.fillStyle = GREEN; g.fillRect(x0, y, tableW, headH);
  g.textAlign = "left"; g.fillStyle = "#ffffff"; g.font = `bold 15px ${FONT}`;
  let x = x0;
  head.forEach((h, i) => { g.fillText(h, x + 14, y + headH / 2); x += widths[i]!; });
  y += headH;
  g.font = `15px ${FONT}`;
  if (rows.length === 0) {
    g.fillStyle = "#6b7280"; g.textAlign = "center"; g.fillText("பதிவுகள் இல்லை (No records)", W / 2, y + rowH / 2); g.textAlign = "left";
  }
  rows.forEach((r, ri) => {
    g.fillStyle = ri % 2 ? "#f0fdf4" : "#ffffff"; g.fillRect(x0, y, tableW, rowH);
    g.fillStyle = "#111827"; x = x0;
    r.forEach((v, i) => { g.fillText(String(v ?? "—"), x + 14, y + rowH / 2); x += widths[i]!; });
    g.strokeStyle = "#e5e7eb"; g.beginPath(); g.moveTo(x0, y + rowH); g.lineTo(x0 + tableW, y + rowH); g.stroke();
    y += rowH;
  });
  g.strokeStyle = GREEN; g.strokeRect(x0, top, tableW, y - top);
  g.textAlign = "center"; g.fillStyle = "#6b7280"; g.font = `13px ${FONT}`;
  g.fillText(`உருவாக்கிய தேதி (Generated): ${new Date().toLocaleDateString("en-IN")}`, W / 2, H - 30);

  const blob = await new Promise<Blob>((res) => c.toBlob((b) => res(b!), "image/png"));
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

function measure(g: CanvasRenderingContext2D, t: string, font: string) {
  g.font = font;
  return g.measureText(t).width;
}
