import { useState } from "react";
import { supabase } from "../lib/supabase";
import styles from "./AuthScreen.module.css";

export default function AuthScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const handleAuth = async () => {
    setError(null);
    setLoading(true);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setError(error.message);
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: name.trim() } },
      });
      if (error) {
        setError(error.message);
      } else if (data.session) {
        // Email confirmation disabled — signed in immediately
        // Seed app_data row with display_name so they're discoverable right away
        await supabase.from("app_data").upsert({
          id: data.session.user.id,
          display_name: name.trim(),
          data: {},
        });
      } else {
        setConfirmed(true);
      }
    }

    setLoading(false);
  };

  const ready = isLogin ? email && password : email && password && name.trim();

  if (confirmed)
    return (
      <div className={styles.page}>
        <div className={`${styles.panel} ${styles.confirmation}`}>
          <div className={styles.confirmationIcon}>📬</div>
          <h2 className={styles.confirmationTitle}>Check your email</h2>
          <p className={styles.confirmationText}>
            We sent a confirmation link to{" "}
            <strong className={styles.confirmationEmail}>{email}</strong>. Click it to
            activate your account.
          </p>
          <button
            onClick={() => {
              setConfirmed(false);
              setIsLogin(true);
            }}
            className={styles.backButton}
          >
            Back to login
          </button>
        </div>
      </div>
    );

  return (
    <div className={styles.page}>
      <div className={styles.panel}>
        <h1 className={styles.brand}>🔥 Hot Wax Weekly</h1>
        <p className={styles.tagline}>your album journal</p>

        <h2 className={styles.formTitle}>
          {isLogin ? "Sign in" : "Create account"}
        </h2>

        {!isLogin && (
          <input
            placeholder="Your name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAuth()}
            className={styles.input}
            autoFocus
          />
        )}

        <input
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAuth()}
          className={styles.input}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAuth()}
          className={`${styles.input} ${error ? styles.passwordInputWithError : styles.passwordInput}`}
        />

        {error && <div className={styles.error}>{error}</div>}

        <button
          onClick={handleAuth}
          disabled={loading || !ready}
          className={styles.submitButton}
        >
          {loading ? "..." : isLogin ? "Sign in" : "Create account"}
        </button>

        <p
          onClick={() => {
            setIsLogin(!isLogin);
            setError(null);
            setName("");
          }}
          className={styles.switchMode}
        >
          {isLogin
            ? "Don't have an account? Sign up"
            : "Already have an account? Sign in"}
        </p>
      </div>
    </div>
  );
}
