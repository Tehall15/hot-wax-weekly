import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function AuthScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [inviteCode, setInviteCode] = useState("");

  const handleAuth = async () => {
    setError(null);
    setLoading(true);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    } else {
      // Validate invite code before creating account
      const code = inviteCode.trim().toLowerCase();
      const { data: codeRow, error: codeErr } = await supabase
        .from("invite_codes")
        .select("code, used_at")
        .eq("code", code)
        .single();

      if (codeErr || !codeRow) {
        setError("Invalid invite code. Please check and try again.");
        setLoading(false);
        return;
      }
      if (codeRow.used_at) {
        setError("That invite code has already been used.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: name.trim() } },
      });
      if (error) {
        setError(error.message);
      } else {
        // Mark code as used
        if (data.user) {
          supabase
            .from("invite_codes")
            .update({ used_at: new Date().toISOString(), used_by: data.user.id })
            .eq("code", code)
            .then(res => { if (res.error) console.error("invite mark failed", res.error); })
            .catch(console.error);
        }
        if (!data.session) {
          setConfirmed(true);
        }
        // if data.session exists, onAuthStateChange in App.jsx handles sign-in
      }
    }

    setLoading(false);
  };

  const inputStyle = {
    width: "100%", marginBottom: 10, padding: "10px 12px", boxSizing: "border-box",
    background: "#1a1a2e", border: "1px solid #2a2a4e", borderRadius: 8,
    color: "#e0e0f0", fontSize: 14, outline: "none",
  };

  const ready = isLogin
    ? (email && password)
    : (email && password && name.trim() && inviteCode.trim());

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

        {!isLogin && (
          <input
            placeholder="Your name"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAuth()}
            style={inputStyle}
            autoFocus
          />
        )}

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
          style={{ ...inputStyle, marginBottom: isLogin ? (error ? 10 : 16) : 10 }}
        />

        {!isLogin && (
          <input
            placeholder="Invite code (e.g. hww-a1b2c3d4)"
            type="text"
            value={inviteCode}
            onChange={e => setInviteCode(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAuth()}
            style={{ ...inputStyle, marginBottom: error ? 10 : 16,
              fontFamily: "monospace", letterSpacing: "0.05em" }}
          />
        )}

        {error && (
          <div style={{ marginBottom: 12, padding: "8px 12px", background: "#2a0a0a",
            border: "1px solid #5a1a1a", borderRadius: 6, color: "#ff6b6b", fontSize: 12 }}>
            {error}
          </div>
        )}

        <button
          onClick={handleAuth}
          disabled={loading || !ready}
          style={{ width: "100%", padding: 11, borderRadius: 8, border: "none",
            background: loading || !ready ? "#2a2a3e" : "#F4C542",
            color: loading || !ready ? "#555" : "#0d0d1a",
            fontWeight: 700, fontSize: 14, cursor: loading || !ready ? "not-allowed" : "pointer",
            transition: "all .18s" }}>
          {loading ? "..." : isLogin ? "Sign in" : "Create account"}
        </button>

        <p onClick={() => { setIsLogin(!isLogin); setError(null); setName(""); setInviteCode(""); }}
          style={{ marginTop: 16, fontSize: 12, cursor: "pointer", color: "#555",
            textAlign: "center", textDecoration: "underline" }}>
          {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
        </p>
      </div>
    </div>
  );
}
