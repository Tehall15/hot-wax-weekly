import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function AuthScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    setLoading(true);
    if (isLogin) {
      await supabase.auth.signInWithPassword({ email, password });
    } else {
      await supabase.auth.signUp({ email, password });
    }
    setLoading(false);
  };

  return (
    <div style={{ display: "flex", height: "100vh", alignItems: "center",
      justifyContent: "center", background: "#0d0d1a" }}>
      <div style={{ background: "#111122", padding: 30, borderRadius: 12, width: 320 }}>
        <h2 style={{ marginBottom: 16, color: "#fff" }}>{isLogin ? "Login" : "Create Account"}</h2>
        <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
          style={{ width: "100%", marginBottom: 10, padding: 10 }} />
        <input type="password" placeholder="Password" value={password}
          onChange={e => setPassword(e.target.value)}
          style={{ width: "100%", marginBottom: 16, padding: 10 }} />
        <button onClick={handleAuth} disabled={loading} style={{ width: "100%", padding: 10 }}>
          {loading ? "Loading..." : isLogin ? "Login" : "Create Account"}
        </button>
        <p onClick={() => setIsLogin(!isLogin)}
          style={{ marginTop: 12, fontSize: 12, cursor: "pointer", color: "#888" }}>
          {isLogin ? "Need an account?" : "Already have an account?"}
        </p>
      </div>
    </div>
  );
}
