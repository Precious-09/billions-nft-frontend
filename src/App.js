import { useState, useRef } from "react";
import * as htmlToImage from "html-to-image";
import logo from "./bill2.png";

export default function App() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const cardRef = useRef(null);

  const API_URL = process.env.REACT_APP_API_URL;

  // ✅ Convert to Sentence Case
  const toSentenceCase = (str) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  // ✅ Handle file upload and convert to base64 for mobile compatibility
  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) {
      setFile(null);
      setPreview(null);
      return;
    }
    setFile(f);

    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result); // base64 string
    };
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

  const downloadCard = () => {
    if (!cardRef.current) return;

    // Ensure images are loaded before generating PNG
    const img = cardRef.current.querySelector("img");
    if (img && !img.complete) {
      img.onload = downloadCard;
      return;
    }

    htmlToImage.toPng(cardRef.current).then((dataUrl) => {
      const link = document.createElement("a");
      link.download = "billions-nft-card.png";
      link.href = dataUrl;
      link.click();
    });
  };

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
              <img src={preview} alt="NFT" style={styles.cardImage} />

              <h3 style={styles.cardHeader}>🧬 Traits</h3>
              <p style={styles.cardText}>
                {result.traits.map((t) => toSentenceCase(t)).join(", ")}
              </p>

              <h3 style={styles.cardHeader}>💫 Personality</h3>
              <p style={styles.cardText}>{toSentenceCase(result.personality)}</p>
            </div>

            <div style={styles.actions}>
              <button onClick={downloadCard} style={styles.actionBtn}>
                📥 Download
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
    border: "3px solid #8a2be2",
    borderTop: "3px solid transparent",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  error: { color: "#ff4fa3", marginTop: 10 },
  card: {
    background: "rgba(34,0,68,0.85)",
    borderRadius: 12,
    padding: 16,
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
