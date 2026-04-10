import React, { useState } from "react";
import { useAuth } from "./AuthContext";

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
    try {
      const res = await fetch(`http://localhost:5000${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (res.ok) {
        if (isLogin) {
          login(username, data.token);
          // Note: Superset session is handled by the browser when the user
          // accesses the iframe if we use the backend provisioning.
          // For persistent sessions in SQL Lab, we might need a silent login form.
        } else {
          setIsLogin(true);
          setError("Account created! Please log in.");
        }
      } else {
        setError(data.error || "Something went wrong");
      }
    } catch (err) {
      setError("Server connection failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <h2>{isLogin ? "Welcome Back" : "Create Account"}</h2>
          <p>Login to access your personalized Data Pro dashboard</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)}
              required 
              placeholder="Enter your username"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              required 
              placeholder="Enter your password"
            />
          </div>

          {error && <div className="error-box">{error}</div>}

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? "Processing..." : isLogin ? "Sign In" : "Sign Up"}
          </button>
        </form>

        <div className="login-footer">
          <button onClick={() => setIsLogin(!isLogin)} className="btn-toggle">
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
          </button>
        </div>
      </div>

      {/* Silent Login Iframe Trick for Superset */}
      {/* This invisible iframe will attempt to log into Superset via the browser 
          so that cookies are set for the Superset domain. */}
      {isLogin && username && password && (
          <iframe 
            name="superset_login" 
            style={{ display: 'none' }} 
            src={`http://localhost:8088/login/?username=${username}&password=${password}`}
          />
      )}

      <style>{`
        .login-page {
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #f5f5f7;
        }
        .login-card {
          background: white;
          padding: 40px;
          border-radius: 20px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.1);
          width: 100%;
          max-width: 400px;
        }
        .login-header h2 { margin-bottom: 8px; color: #1d1d1f; }
        .login-header p { color: #86868b; margin-bottom: 32px; font-size: 0.9rem; }
        .form-group { margin-bottom: 20px; }
        .form-group label { display: block; margin-bottom: 8px; font-weight: 600; font-size: 0.85rem; }
        .form-group input {
          width: 100%;
          padding: 12px;
          border: 1px solid #d2d2d7;
          border-radius: 8px;
          font-size: 1rem;
        }
        .btn-login {
          width: 100%;
          padding: 14px;
          background: #0071e3;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 10px;
        }
        .btn-toggle {
          background: none;
          border: none;
          color: #0071e3;
          font-size: 0.85rem;
          cursor: pointer;
          margin-top: 20px;
          width: 100%;
        }
        .error-box {
          background: #fff2f2;
          color: #d70015;
          padding: 10px;
          border-radius: 8px;
          font-size: 0.85rem;
          margin-bottom: 20px;
          border: 1px solid #ffcaca;
        }
      `}</style>
    </div>
  );
};

export default Login;
