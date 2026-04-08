import React, { useState } from "react";
import SupersetDashboard from "./components/SupersetDashboard";

import "./index.css";

const App = () => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ message: string; type: "success" | "error" | "" }>({
    message: "",
    type: "",
  });

  const handleSeed = async () => {
    setLoading(true);
    setStatus({ message: "Seeding data...", type: "" });
    try {
      const response = await fetch("http://localhost:5000/api/seed", {
        method: "POST",
      });
      const data = await response.json();
      if (response.ok) {
        setStatus({ message: data.message, type: "success" });
      } else {
        setStatus({ message: data.error || "Seeding failed", type: "error" });
      }
    } catch (error) {
      setStatus({ message: "Connection to server failed", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div className="sidebar">
        <div className="sidebar-header">App Store Metrics</div>
        <div className="nav-item active">📊 Superset View</div>
      </div>
      
      <div className="main-content">
        <div className="header">
          <h1>Superset Visualization</h1>
          <div>
            <button className="btn-seed" onClick={handleSeed} disabled={loading}>
              {loading ? "Seeding..." : "Insert Dummy Data to DB"}
            </button>
            {status.message && (
              <div className={`status-message status-${status.type}`}>
                {status.message}
              </div>
            )}
          </div>
        </div>
        
        <div className="card" style={{ padding: 0 }}>
          <SupersetDashboard />
        </div>
      </div>
    </div>
  );
};

export default App;