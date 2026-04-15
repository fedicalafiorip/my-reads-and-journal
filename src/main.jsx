import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { auth, signInGoogle, onAuthStateChanged } from "./firebase";
import { signOut } from "firebase/auth";
import "./storage.js";
import "./index.css";
import App from "./App.jsx";

window.firebaseSignOut = () => signOut(auth);

function AuthWrapper() {
  const [user, setUser] = useState(undefined);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      window.firebaseUid = u?.uid || null;
      // Register in community so friends can see this user
      if (u && window.storage?.registerInCommunity) {
        window.storage.registerInCommunity().catch(() => {});
      }
    });
    return unsub;
  }, []);

  const handleLogin = async () => {
    try { setError(""); await signInGoogle(); }
    catch (e) { console.error(e); setError("Erro ao fazer login. Tente novamente."); }
  };

  if (user === undefined) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "#FAF7F5", fontFamily: "'Playfair Display',Georgia,serif", fontSize: 20,
        color: "#C4A0D4", fontStyle: "italic" }}>
        Carregando...
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(135deg, #FAF7F5, #F3EBF8)", fontFamily: "'DM Sans',sans-serif",
        padding: 20 }}>
        <div style={{ textAlign: "center", maxWidth: 360 }}>
          <img src="/logo.svg" alt="My Reads &amp; Journal" style={{ height: 54, marginBottom: 8 }} />
          <p style={{ fontSize: 14, color: "#8A8490", margin: "0 0 40px" }}>
            Seu diário de leituras pessoal
          </p>
          <div style={{ fontSize: 64, marginBottom: 24 }}>📚</div>
          <p style={{ fontSize: 14, color: "#8A8490", margin: "0 0 24px", lineHeight: 1.6 }}>
            Faça login para sincronizar sua biblioteca entre todos os seus dispositivos e participar do Book Club.
          </p>
          <button onClick={handleLogin}
            style={{ width: "100%", padding: "14px 24px", borderRadius: 24,
              background: "#FFFFFF", border: "1.5px solid #EDE8F0", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              fontFamily: "'DM Sans',sans-serif", fontSize: 15, fontWeight: 600,
              color: "#2D2A32", transition: "all .2s",
              boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
            <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
            Entrar com Google
          </button>
          {error && <p style={{ color: "#E05555", fontSize: 12, marginTop: 12 }}>{error}</p>}
          <p style={{ fontSize: 11, color: "#B8B3BD", margin: "32px 0 0" }}>Seus dados ficam seguros e sincronizados ✨</p>
        </div>
      </div>
    );
  }

  return <App />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthWrapper />
  </React.StrictMode>
);
