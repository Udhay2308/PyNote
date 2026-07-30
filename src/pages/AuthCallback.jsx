import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function AuthCallback() {
  const { login } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      fetch(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.user) {
            login(token, data.user);
            window.location.href = "/";
          } else {
            window.location.href = "/login";
          }
        })
        .catch(() => {
          window.location.href = "/login";
        });
    } else {
      window.location.href = "/login";
    }
  }, [login]);

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "100%",
      background: "#141414",
      color: "#fff",
      fontSize: "18px",
    }}>
      Signing you in...
    </div>
  );
}