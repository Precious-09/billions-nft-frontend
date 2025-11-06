// App.js — Canvas export (pixel-perfect) — no html-to-image needed
import { useState, useRef } from "react";
import logo from "./bill2.png";

export default function App() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);       // base64 or URL for <img> + canvas
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const cardRef = useRef(null);

  const API_URL = process.env.REACT_APP_API_URL;

  const toSentenceCase = (str) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  // Keep local preview (works fine for Canvas drawing)
  const handleFileChange = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);

    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(f);
  };

  const handleUpload = async () => {
    if (!file) return alert("Upload an image first");

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch(`${API_URL}/analyze`, {
        method: "POST",
        body: fd,
        headers: { Accept: "application/json" },
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        setResult({
          traits: Array.isArray(data.traits) ? data.traits : [data.traits],
          personality: data.personality || "No personality text generated",
        });
      }
    } catch (e) {
      setError("Server Error — check backend deployment");
    } finally {
      setLoading(false);
    }
  };

  // ----- CANVAS EXPORT (Option A: match UI exactly) -----

  const downloadCard = async () => {
    if (!result || !preview) return;

    // UI constants (match your styles)
    const CARD_W = 400;                 // container max width
    const PADDING = 20;                 // styles.card padding
    const BG = "#220044";               // styles.card background
    const SHADOW = "#7a2cf8";           // glow
    const RADIUS = 12;                  // styles.card borderRadius
    const IMG_W = 160;                  // styles.cardImage width/height
    const IMG_H = 160;
    const IMG_BORDER = "#9a51ff";
    const GAP_SMALL = 10;               // marginBottom between elements
    const HDR_COLOR = "#D5B7FF";        // styles.cardHeader
    const TXT_COLOR = "#FFFFFF";        // styles.cardText
    const FONT = "Arial";
    const HDR_SIZE = 16;                // slightly larger than 15 for clarity
    const TXT_SIZE = 13;                // styles.cardText 13px

    // Build text content
    const traitsText = (result.traits || [])
      .map((t) => toSentenceCase(String(t)))
      .join(", ");

    const personalityText = toSentenceCase(result.personality || "");

    // For text wrapping we need inner width
    const innerW = CARD_W - PADDING * 2;

    // Helper: measure + wrap text to lines
    const wrapText = (ctx, text, maxWidth) => {
      const words = text.split(/\s+/);
      const lines = [];
      let line = "";
      for (let i = 0; i < words.length; i++) {
        const test = line ? line + " " + words[i] : words[i];
        const w = ctx.measureText(test).width;
        if (w <= maxWidth) {
          line = test;
        } else {
          if (line) lines.push(line);
          line = words[i];
        }
      }
      if (line) lines.push(line);
      return lines;
    };

    // Create a scratch canvas context to pre-wrap text and compute height
    const scratch = document.createElement("canvas");
    const sctx = scratch.getContext("2d");

    sctx.font = `bold ${HDR_SIZE}px ${FONT}`;
    const traitsHdrH = HDR_SIZE + 4;
    const personalityHdrH = HDR_SIZE + 4;

    sctx.font = `${TXT_SIZE}px ${FONT}`;
    const lineH = Math.round(TXT_SIZE * 1.35);

    const traitLines = wrapText(sctx, traitsText, innerW);
    const personalityLines = wrapText(sctx, personalityText, innerW);

    // Compute total card height:
    // padding top
    // image + GAP_SMALL
    // "🧬 Traits" header + small gap
    // traits text lines + GAP_SMALL
    // "💫 Personality" header + small gap
    // personality text lines
    // padding bottom
    const contentH =
      IMG_H +
      GAP_SMALL +
      traitsHdrH +
      6 +
      traitLines.length * lineH +
      GAP_SMALL +
      personalityHdrH +
      6 +
      personalityLines.length * lineH;

    const CARD_H = PADDING + contentH + PADDING;

    // HiDPI scale for crisp export
    const SCALE = 3; // 3x for HD
    const canvas = document.createElement("canvas");
    canvas.width = CARD_W * SCALE;
    canvas.height = CARD_H * SCALE;
    const ctx = canvas.getContext("2d");
    ctx.scale(SCALE, SCALE);

    // Draw nice outer glow (approximate)
    ctx.save();
    ctx.shadowColor = SHADOW;
    ctx.shadowBlur = 14;
    roundRect(ctx, 0 + 6, 0 + 6, CARD_W - 12, CARD_H - 12, RADIUS); // subtle inner glow
    ctx.fillStyle = BG;
    ctx.fill();
    ctx.restore();

    // Draw card background (rounded)
    roundRect(ctx, 0, 0, CARD_W, CARD_H, RADIUS);
    ctx.fillStyle = BG;
    ctx.fill();

    // Draw content
    let x = PADDING;
    let y = PADDING;

    // NFT image box border
    ctx.save();
    roundRect(ctx, x, y, IMG_W, IMG_H, 10);
    ctx.clip();

    // Fill transparent background for "contain" effect (keeps look clean)
    ctx.fillStyle = "rgba(0,0,0,0)"; // transparent
    ctx.fillRect(x, y, IMG_W, IMG_H);

    // Load the NFT image
    const img = await loadImage(preview);

    // Draw the image with "contain" behavior inside 160x160
    const fit = containRect(img.width, img.height, IMG_W, IMG_H);
    ctx.drawImage(img, x + fit.x, y + fit.y, fit.w, fit.h);
    ctx.restore();

    // Border around image box
    ctx.lineWidth = 1;
    ctx.strokeStyle = IMG_BORDER;
    roundRect(ctx, x, y, IMG_W, IMG_H, 10);
    ctx.stroke();

    y += IMG_H + GAP_SMALL;

    // Headers + text
    ctx.fillStyle = HDR_COLOR;
    ctx.font = `bold ${HDR_SIZE}px ${FONT}`;
    ctx.fillText("🧬 Traits", x, y + HDR_SIZE);
    y += traitsHdrH + 6;

    ctx.fillStyle = TXT_COLOR;
    ctx.font = `${TXT_SIZE}px ${FONT}`;
    drawLines(ctx, traitLines, x, y, lineH);
    y += traitLines.length * lineH + GAP_SMALL;

    ctx.fillStyle = HDR_COLOR;
    ctx.font = `bold ${HDR_SIZE}px ${FONT}`;
    ctx.fillText("💫 Personality", x, y + HDR_SIZE);
    y += personalityHdrH + 6;

    ctx.fillStyle = TXT_COLOR;
    ctx.font = `${TXT_SIZE}px ${FONT}`;
    drawLines(ctx, personalityLines, x, y, lineH);

    // Export PNG
    const dataUrl = canvas.toDataURL("image/png", 1.0);
    triggerDownload(dataUrl, "billions-nft-card.png");
  };

  // Helpers
  function roundRect(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function drawLines(ctx, lines, x, y, lineH) {
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], x, y + (i + 1) * lineH);
    }
  }

  function containRect(srcW, srcH, maxW, maxH) {
    const ratio = Math.min(maxW / srcW, maxH / srcH);
    const w = Math.round(srcW * ratio);
    const h = Math.round(srcH * ratio);
    const x = Math.round((maxW - w) / 2);
    const y = Math.round((maxH - h) / 2);
    return { x, y, w, h };
    }

  function triggerDownload(dataUrl, filename) {
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function loadImage(src) {
    return new Promise((resolve) => {
      const im = new Image();
      // crossOrigin not needed for data: URLs, harmless otherwise
      im.crossOrigin = "anonymous";
      im.onload = () => resolve(im);
      im.onerror = () => resolve(im); // fail-soft; still render frame
      im.src = src;
    });
  }

  // ---------- UI (unchanged, matches your styles) ----------

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>Billions NFT Personality Scanner</h1>

        <img src={logo} alt="billions" style={{ width: "120px", height: "auto" }} />

        <label style={styles.uploadBox}>
          <input
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
          {preview ? "✅ Image Selected — Tap to Replace" : "📤 Upload NFT Image"}
        </label>

        {preview && <img src={preview} alt="NFT" style={styles.preview} />}

        <button onClick={handleUpload} style={styles.button} disabled={loading}>
          {loading ? "Scanning..." : "🔍 Analyze NFT"}
        </button>

        {loading && <div style={styles.loader}></div>}
        {error && <p style={styles.error}>{error}</p>}

        {result && (
          <>
            <div ref={cardRef} style={styles.card}>
              <img
                className="nft-img-box"
                src={preview}
                alt="NFT"
                style={styles.cardImage}
              />

              <h3 style={styles.cardHeader}>🧬 Traits</h3>
              <p style={styles.cardText}>
                {result.traits.map((t) => toSentenceCase(t)).join(", ")}
              </p>

              <h3 style={styles.cardHeader}>💫 Personality</h3>
              <p style={styles.cardText}>{toSentenceCase(result.personality)}</p>
            </div>

            <div style={styles.actions}>
              <button onClick={downloadCard} style={styles.actionBtn}>
                📥 Download (HD)
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    background: "#080013",
    minHeight: "100vh",
    padding: 25,
    color: "#fff",
    fontFamily: "Arial",
    display: "flex",
    justifyContent: "center",
  },
  container: {
    maxWidth: 400,
    width: "100%",
    textAlign: "center",
  },
  title: {
    fontSize: 24,
    marginBottom: 15,
    color: "#d9baff",
  },
  uploadBox: {
    display: "block",
    padding: 14,
    background: "#3A187A",
    borderRadius: 10,
    cursor: "pointer",
    marginBottom: 12,
  },
  preview: {
    width: 200,
    height: 200,
    objectFit: "contain",
    borderRadius: 12,
    border: "2px solid #7a2cf8",
    marginBottom: 12,
  },
  button: {
    padding: "12px 18px",
    background: "#8a2be2",
    border: "none",
    color: "#fff",
    borderRadius: 8,
    cursor: "pointer",
    width: "100%",
    fontSize: 15,
  },
  loader: {
    width: 28,
    height: 28,
    margin: "10px auto",
    border: "3px solid "#8a2be2",
    borderTop: "3px solid transparent",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  error: { color: "#ff4fa3", marginTop: 10 },
  card: {
    background: "#220044",
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    boxShadow: "0 0 14px #7a2cf8",
  },
  cardImage: {
    width: 160,
    height: 160,
    objectFit: "contain",
    borderRadius: 10,
    marginBottom: 10,
    border: "1px solid #9a51ff",
  },
  cardHeader: { color: "#D5B7FF", marginTop: 10 },
  cardText: { fontSize: 13, margin: "5px 0" },
  actions: {
    marginTop: 12,
    display: "flex",
    gap: 10,
    justifyContent: "center",
  },
  actionBtn: {
    background: "#3A187A",
    padding: "8px 12px",
    borderRadius: 8,
    cursor: "pointer",
    border: "none",
    color: "#fff",
  },
};
