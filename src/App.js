import { useState } from "react";
import logo from "./bill2.png";

export default function App() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showFull, setShowFull] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL;

  const toSentenceCase = (str) =>
    !str ? "" : str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);

    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(f);
  };

  const handleUpload = async () => {
    if (!file) return alert("Upload an image first!");

    setLoading(true);
    setError(null);
    setResult(null);

    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await fetch(`${API_URL}/analyze`, {
        method: "POST",
        body: fd,
        headers: { Accept: "application/json" },
      });

      const data = await res.json();

      if (data.error) setError(data.error);
      else {
        setResult({
          traits: Array.isArray(data.traits) ? data.traits : [data.traits],
          personality: data.personality,
        });
      }
    } catch (err) {
      setError("Server error — backend may be offline.");
    }

    setLoading(false);
  };

  return (
    <div style={styles.page}>

      {/* ✅ FULLSCREEN CARD VIEW */}
      {showFull && result && (
        <div style={styles.fullscreenOverlay} onClick={() => setShowFull(false)}>
          <div style={styles.fullscreenCard}>
            <NFTCard preview={preview} result={result} />
          </div>
        </div>
      )}

      <div style={styles.container}>
        <h1 style={styles.title}>Billions NFT Scanner</h1>

        {/* ✅ CENTERED LOGO */}
        <img src={logo} alt="billions" style={styles.logo} />

        {/* ✅ CENTERED UPLOAD BUTTON */}
        <div style={styles.uploadWrapper}>
          <label style={styles.uploadBox}>
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
            {preview ? "✅ Replace Image" : "📤 Upload NFT Image"}
          </label>
        </div>

        {preview && <img src={preview} alt="preview" style={styles.preview} />}

        <button style={styles.button} disabled={loading} onClick={handleUpload}>
          {loading ? "Scanning..." : "🔍 Analyze NFT"}
        </button>

        {loading && <div style={styles.loader}></div>}
        {error && <p style={styles.error}>{error}</p>}

        {result && (
          <>
            <NFTCard preview={preview} result={result} />

            <button
              style={styles.fullBtn}
              onClick={() => setShowFull(true)}
            >
              🚀 View NFT Card
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function NFTCard({ preview, result }) {
  const toSentenceCase = (s) =>
    !s ? "" : s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

  return (
    <div style={styles.card}>
      <div style={styles.cardGlow}></div>

      <img src={preview} alt="NFT" style={styles.cardImage} />

      <h3 style={styles.cardHeader}>🧬 Traits</h3>
      <p style={styles.cardText}>
        {result.traits.map((t) => toSentenceCase(t)).join(", ")}
      </p>

      <h3 style={styles.cardHeader}>💫 Personality</h3>
      <p style={styles.cardText}>{toSentenceCase(result.personality)}</p>
    </div>
  );
}

/* ✅ UPDATED FUTURISTIC STYLES */
const styles = {
  page: {
    background: "radial-gradient(circle at top, #140026, #05000d)",
    minHeight: "100vh",
    padding: 25,
    color: "#fff",
    fontFamily: "Inter, Arial",
    display: "flex",
    justifyContent: "center",
  },

  container: {
    maxWidth: 420,
    width: "100%",
    textAlign: "center",
  },

  title: {
    fontSize: 26,
    marginBottom: 10,
    fontWeight: 700,
    color: "#d6b8ff",
    textShadow: "0 0 12px rgba(150,50,255,0.8)",
  },

  // ✅ CENTERED LOGO
  logo: {
    width: 150,
    margin: "0 auto 18px",
    display: "block",
  },

  // ✅ CENTERED UPLOAD BUTTON WRAPPER
  uploadWrapper: {
    display: "flex",
    justifyContent: "center",
    marginBottom: 18,
  },

  uploadBox: {
    padding: "14px 18px",
    background: "rgba(90,0,170,0.5)",
    borderRadius: 12,
    border: "1px solid rgba(200,140,255,0.3)",
    cursor: "pointer",
    backdropFilter: "blur(6px)",
  },

  preview: {
    width: "100%",
    height: 260,
    objectFit: "contain",
    borderRadius: 14,
    border: "2px solid rgba(140,70,255,0.5)",
    marginBottom: 14,
    boxShadow: "0 0 18px rgba(150,70,255,0.4)",
  },

  button: {
    padding: "14px 18px",
    width: "100%",
    background: "linear-gradient(90deg, #7a2cf8, #b86bff)",
    border: "none",
    borderRadius: 10,
    color: "#fff",
    fontSize: 16,
    cursor: "pointer",
    marginTop: 10,
    boxShadow: "0 0 12px rgba(140,60,255,0.5)",
  },

  loader: {
    marginTop: 10,
    width: 28,
    height: 28,
    border: "3px solid #7a2cf8",
    borderTop: "3px solid transparent",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },

  error: { color: "#ff4fa3", marginTop: 10 },

  /* ✅ FUTURISTIC CARD */
  card: {
    marginTop: 22,
    borderRadius: 20,
    padding: 20,
    position: "relative",
    overflow: "hidden",
    background: "rgba(30,0,60,0.55)",
    border: "1px solid rgba(200,150,255,0.18)",
    boxShadow: "0 0 25px rgba(150,70,255,0.5)",
    backdropFilter: "blur(6px)",
  },

  cardGlow: {
    position: "absolute",
    top: -80,
    left: -40,
    width: 200,
    height: 200,
    background: "rgba(160,70,255,0.3)",
    borderRadius: "50%",
    filter: "blur(80px)",
    zIndex: 0,
  },

  cardImage: {
    width: "100%",
    height: 230,
    objectFit: "cover",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.2)",
    marginBottom: 18,
    position: "relative",
    zIndex: 2,
  },

  cardHeader: {
    fontSize: 18,
    fontWeight: 600,
    color: "#E8D7FF",
    textShadow: "0 0 5px rgba(150,80,255,0.5)",
    position: "relative",
    zIndex: 2,
  },

  cardText: {
    fontSize: 14,
    margin: "6px 0 14px",
    color: "#F6EFFF",
    lineHeight: 1.45,
    position: "relative",
    zIndex: 2,
  },

  fullBtn: {
    marginTop: 15,
    padding: "12px 18px",
    width: "100%",
    background: "rgba(100,40,200,0.4)",
    border: "1px solid rgba(180,120,255,0.4)",
    borderRadius: 10,
    color: "#fff",
    cursor: "pointer",
    backdropFilter: "blur(5px)",
  },

  /* ✅ FULLSCREEN MODE */
  fullscreenOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.92)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: 15,
    zIndex: 10000,
  },

  fullscreenCard: {
    width: "100%",
    maxWidth: 450,
    animation: "pop 0.3s ease",
  },
};
