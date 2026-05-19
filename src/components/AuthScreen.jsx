import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function AuthScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [confirmed, setConfirmed] = useState(false);

  const handleAuth = async () => {
    setError(null);
    setLoading(true);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else if (data.session) {
        // Email confirmation disabled — user is signed in immediately, nothing to do
      } else {
        // Email confirmation required — show check-your-email message
        setConfirmed(true);
      }
    }

    setLoading(false);
  };

  const inputStyle = {
    width: "100%", marginBottom: 10, padding: "10px 12px", boxSizing: "border-box",
    background: "#1a1a2e", border: "1px solid #2a2a4e", borderRadius: 8,
    color: "#e0e0f0", fontSize: 14, outline: "none",
  };

  if (confirmed) return (
    <div style={{ display: "flex", height: "100vh", alignItems: "center",
      justifyContent: "center", background: "#0d0d1a" }}>
      <div style={{ background: "#111122", padding: 30, borderRadius: 12, width: 320, textAlign: "center" }}>
        <div style={{ fontSize: 36, marginBottom: 16 }}>📬</div>
        <h2 style={{ color: "#fff", marginBottom: 8 }}>Check your email</h2>
        <p style={{ color: "#666", fontSize: 13, lineHeight: 1.6 }}>
          We sent a confirmation link to <strong style={{ color: "#aaa" }}>{email}</strong>.
          Click it to activate your account.
        </p>
        <button onClick={() => { setConfirmed(false); setIsLogin(true); }}
          style={{ marginTop: 20, background: "none", border: "none", color: "#F4C542",
            cursor: "pointer", fontSize: 13 }}>
          Back to login
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", height: "100vh", alignItems: "center",
      justifyContent: "center", background: "#0d0d1a" }}>
      <div style={{ background: "#111122", padding: 30, borderRadius: 12, width: 320 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#fff", margin: "0 0 4px" }}>🔥 Hot Wax Weekly</h1>
        <p style={{ color: "#444", fontSize: 12, marginTop: 0, marginBottom: 24, fontStyle: "italic" }}>your album journal</p>

        <h2 style={{ marginBottom: 16, color: "#fff", fontSize: 16 }}>
          {isLogin ? "Sign in" : "Create account"}
        </h2>

        <input
          placeholder="Email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleAuth()}
          style={inputStyle}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleAuth()}
          style={{ ...inputStyle, marginBottom: error ? 10 : 16 }}
        />

        {error && (
          <div style={{ marginBottom: 12, padding: "8px 12px", background: "#2a0a0a",
            border: "1px solid #5a1a1a", borderRadius: 6, color: "#ff6b6b", fontSize: 12 }}>
            {error}
          </div>
        )}

        <button
          onClick={handleAuth}
          disabled={loading || !email || !password}
          style={{ width: "100%", padding: 11, borderRadius: 8, border: "none",
            background: loading || !email || !password ? "#2a2a3e" : "#F4C542",
            color: loading || !email || !password ? "#555" : "#0d0d1a",
            fontWeight: 700, fontSize: 14, cursor: loading || !email || !password ? "not-allowed" : "pointer",
            transition: "all .18s" }}>
          {loading ? "..." : isLogin ? "Sign in" : "Create account"}
        </button>

        <p onClick={() => { setIsLogin(!isLogin); setError(null); }}
          style={{ marginTop: 16, fontSize: 12, cursor: "pointer", color: "#555",
            textAlign: "center", textDecoration: "underline" }}>
          {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
        </p>
      </div>
    </div>
  );
}
