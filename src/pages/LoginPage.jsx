import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function LoginPage({ onSwitch }) {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Login failed");
      else login(data.token, data.user);
    } catch {
      setError("Server connection failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100%",
      background: "linear-gradient(135deg, #080B14 0%, #0F172A 50%, #101828 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 20px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Maroon glow */}
      <div style={{
        position: "absolute", borderRadius: "50%",
        width: "400px", height: "400px",
        background: "#8B1E3F", filter: "blur(120px)",
        opacity: 0.15, top: "-100px", left: "-80px",
        animation: "float1 8s ease-in-out infinite",
      }} />
      {/* Gold glow */}
      <div style={{
        position: "absolute", borderRadius: "50%",
        width: "300px", height: "300px",
        background: "#D4AF37", filter: "blur(120px)",
        opacity: 0.1, bottom: "-80px", right: "-60px",
        animation: "float2 8s ease-in-out infinite",
      }} />

      <style>{`
        @keyframes float1 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-24px)} }
        @keyframes float2 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-18px)} }
        @keyframes slideUp { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spinGradient { from{ --angle: 0deg; } to{ --angle: 360deg; } }

        @property --angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }

        .lp-card-wrap {
          position: relative;
          width: 100%;
          max-width: 400px;
          border-radius: 20px;
          z-index: 1;
        }

        /* Rotating gold/white gradient ring, hidden until hover */
        .lp-card-wrap::before {
          content: "";
          position: absolute;
          inset: -2px;
          border-radius: 22px;
          padding: 2px;
          background: conic-gradient(from var(--angle),
            #FFFFFF, #FFD700, #FFFFFF, #C9A227, #FFFFFF);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          opacity: 0;
          transition: opacity .35s ease;
          animation: spinGradient 4s linear infinite paused;
          pointer-events: none;
        }

        .lp-card-wrap:hover::before {
          opacity: 1;
          animation-play-state: running;
        }

        .lp-card {
          background: rgba(22,25,35,.88);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 40px 36px;
          width: 100%;
          position: relative;
          z-index: 1;
          animation: slideUp 0.5s ease;
          box-shadow: 0 12px 30px rgba(0,0,0,.35);
          transition: box-shadow .35s ease, border-color .35s ease;
        }

        .lp-card-wrap:hover .lp-card {
          box-shadow: 0 16px 40px rgba(212,175,55,.2);
        }

        .lp-field {
          width: 100%;
          padding: 11px 14px;
          background: #131B28;
          border: 1px solid #2E394A;
          border-radius: 10px;
          color: #F5F7FA;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          outline: none;
          box-sizing: border-box;
          transition: .2s;
        }
        .lp-field:focus {
          border-color: #8B1E3F;
          box-shadow: 0 0 0 4px rgba(139,30,63,.18);
        }
        .lp-field::placeholder { color: rgba(245,247,250,0.25); }
        .lp-btn-primary {
          width: 100%; padding: 12px;
          border-radius: 10px; border: none;
          background: #8B1E3F;
          color: #fff; font-size: 15px; font-weight: 600;
          font-family: 'Inter', sans-serif;
          cursor: pointer; margin-bottom: 14px;
          transition: .2s;
          box-shadow: 0 8px 25px rgba(139,30,63,.25);
        }
        .lp-btn-primary:hover:not(:disabled) {
          background: #A83250;
          transform: translateY(-1px);
          box-shadow: 0 10px 30px rgba(139,30,63,.35);
        }
        .lp-btn-primary:disabled { opacity: .5; cursor: not-allowed; }
        .lp-btn-google {
          width: 100%; padding: 11px;
          border-radius: 10px;
          border: 1px solid #384458;
          background: transparent;
          color: #DCE3EE; font-size: 14px; font-weight: 500;
          font-family: 'Inter', sans-serif;
          cursor: pointer; display: flex;
          align-items: center; justify-content: center;
          gap: 10px; margin-bottom: 24px; transition: .2s;
        }
        .lp-btn-google:hover {
          background: #222B3A;
          border-color: #8B1E3F;
        }
        .eye-btn {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: transparent;
          border: none;
          cursor: pointer;
          color: #9AA4B2;
          padding: 4px;
          display: flex;
          align-items: center;
          transition: color 0.2s;
        }
        .eye-btn:hover { color: #F5F7FA; }
      `}</style>

      {/* Card wrapper handles the rotating gradient border on hover */}
      <div className="lp-card-wrap">
        <div className="lp-card">

          {/* Logo */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "20px",
          }}>
            <img
              src="/src/assets/logo.png"
              alt="Pynote"
              style={{
                width: "65px",
                height: "65px",
                objectFit: "contain",
                mixBlendMode: "screen",
              }}
            />
          </div>

          <h2 style={{
            textAlign: "center", fontSize: "32px",
            fontWeight: "800", color: "#F5F7FA",
            margin: "0 0 6px", letterSpacing: "-0.5px",
          }}>
            Welcome back
          </h2>
          <p style={{
            textAlign: "center", fontSize: "14px",
            color: "#9AA4B2", margin: "0 0 28px",
          }}>
            Sign in to your Pynote
          </p>

          {error && (
            <div style={{
              background: "rgba(239,68,68,0.12)",
              border: "1px solid rgba(239,68,68,0.3)",
              color: "#FF5D5D", padding: "10px 14px",
              borderRadius: "10px", marginBottom: "16px", fontSize: "13px",
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <label style={{
              display: "block", fontSize: "13px",
              fontWeight: "500", color: "#9AA4B2", marginBottom: "7px",
            }}>
              Email
            </label>
            <input
              className="lp-field"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              required
              style={{ marginBottom: "16px" }}
            />

            <label style={{
              display: "block", fontSize: "13px",
              fontWeight: "500", color: "#9AA4B2", marginBottom: "7px",
            }}>
              Password
            </label>

            {/* Password field with eye toggle */}
            <div style={{ position: "relative", marginBottom: "20px" }}>
              <input
                className="lp-field"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                required
                style={{ paddingRight: "44px" }}
              />
              <button
                type="button"
                className="eye-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  // Eye OFF icon (hide password)
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  // Eye ON icon (show password)
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>

            <button className="lp-btn-primary" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
            <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.08)" }} />
            <span style={{ fontSize: "12px", color: "#9AA4B2" }}>or</span>
            <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.08)" }} />
          </div>

          <button className="lp-btn-google" onClick={() => window.location.href = `${API}/auth/google`}>
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
              <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
            </svg>
            Continue with Google
          </button>

          <p style={{ textAlign: "center", fontSize: "13px", color: "#9AA4B2", margin: 0 }}>
            Don't have an account?{" "}
            <span onClick={onSwitch} style={{ color: "#D4AF37", cursor: "pointer", fontWeight: "500" }}>
              Sign up
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}