import { useState, useRef } from "react";
import logo from "./bill2.png";

export default function App() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showFullscreen, setShowFullscreen] = useState(false); // ✅ NEW
  const cardRef = useRef(null);

  const API_URL = process.env.REACT_APP_API_URL;

  const toSentenceCase = (str) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "";

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;

    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(f);

    setFile(f);
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

      if (data.error) setError(data.error);
      else {
        setResult({
          traits: Array.isArray(data.traits) ? data.traits : [data.traits],
          personality: data.personality || "No personality text generated",
        });
      }
    } catch (err) {
      setError("Server Error — check backend deployment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>Billions NFT Personality Scanner</h1>

        <img src={logo} alt="billions" style={{ width: 120 }} />

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
              <img src={preview} alt="NFT" style={styles.cardImage} />

              <h3 style={styles.cardHeader}>🧬 Traits</h3>
              <p style={styles.cardText}>
                {result.traits.map((t) => toSentenceCase(t)).join(", ")}
              </p>

              <h3 style={styles.cardHeader}>💫 Personality</h3>
              <p style={styles.cardText}>{toSentenceCase(result.personality)}</p>
            </div>

            <div style={styles.actions}>
              <button
                onClick={() => setShowFullscreen(true)}
                style={styles.actionBtn}
              >
                📸 Screenshot NFT Card
              </button>
            </div>
          </>
        )}
      </div>

      {/* ✅ Fullscreen screenshot popup */}
      {showFullscreen && (
        <div style={styles.fullscreenOverlay} onClick={() => setShowFullscreen(false)}>
          <div style={styles.fullscreenCard}>
            <div style={styles.card}>
              <img src={preview} alt="NFT" style={styles.cardImage} />

              <h3 style={styles.cardHeader}>🧬 Traits</h3>
              <p style={styles.cardText}>
                {result.traits.map((t) => toSentenceCase(t)).join(", ")}
              </p>

              <h3 style={styles.cardHeader}>💫 Personality</h3>
              <p style={styles.cardText}>{toSentenceCase(result.personality)}</p>
            </div>
          </div>
        </div>
      )}
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
    borderRadius: 8,
    color: "#fff",
    width: "100%",
    border: "none",
    fontSize: 15,
  },
  loader: {
    width: 28,
    height: 28,
    margin: "10px auto",
    border: "4px solid #8a2be2",
    borderTop: "4px solid transparent",
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
    width: "100%",
  },
  cardImage: {
    width: "100%",
    height: 200,
    objectFit: "contain",
    borderRadius: 10,
    border: "1px solid #9a51ff",
  },
  cardHeader: {
    color: "#D5B7FF",
    marginTop: 10,
    fontSize: 16,
  },
  cardText: {
    fontSize: 13,
    margin: "5px 0",
    lineHeight: 1.3,
  },
  actions: {
    marginTop: 12,
    display: "flex",
    justifyContent: "center",
  },
  actionBtn: {
    background: "#3A187A",
    padding: "10px 14px",
    borderRadius: 8,
    cursor: "pointer",
    border: "none",
    color: "#fff",
  },

  // ✅ Fullscreen popup
  fullscreenOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    background: "rgba(0,0,0,0.9)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  fullscreenCard: {
    width: "90%",
    maxWidth: 420,
  },
};
