import React, { useEffect, useRef } from "react";
import { embedDashboard } from "@superset-ui/embedded-sdk";

const SupersetDashboard = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = React.useState<string | null>(null);

  useEffect(() => {
    const embed = async () => {
      if (!containerRef.current) return;

      try {
        setError(null);
        // 1. Fetch Guest Token and Metadata from our backend
        const response = await fetch("http://localhost:5000/api/superset/guest-token");
        if (!response.ok) throw new Error("Backend connection failed (Port 5000)");
        
        const { guestToken, embeddedId } = await response.json();

        // 2. Embed the dashboard
        embedDashboard({
          id: embeddedId,
          supersetDomain: "http://localhost:8088",
          mountPoint: containerRef.current,
          fetchGuestToken: () => Promise.resolve(guestToken),
          dashboardUiConfig: {
            hideTitle: true,
            hideChartControls: true,
            hideTab: true,
          },
        });
      } catch (err) {
        console.error("Failed to embed Superset dashboard:", err);
        setError(err instanceof Error ? err.message : "Connect to Backend failed");
      }
    };

    embed();
    
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, []);

  if (error) {
    return (
      <div style={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center',
        padding: '40px',
        textAlign: 'center',
        color: '#dc3545'
      }}>
        <h3 style={{ margin: '0 0 12px' }}>📊 Dashboard Offline</h3>
        <p style={{ margin: 0, opacity: 0.8 }}>
          Could not communicate with the backend on port 5000.<br/>
          Please check if your node server is running.
        </p>
        <button 
          onClick={() => embed()}
          className="btn-seed"
          style={{ marginTop: '20px' }}
        >
          🔄 Retry Connection
        </button>
      </div>
    );
  }


  return (
    <div
      ref={containerRef}
      className="dashboard-container"
    />
  );
};



export default SupersetDashboard;
