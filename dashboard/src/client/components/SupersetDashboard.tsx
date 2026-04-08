import React, { useEffect, useRef } from "react";
import { embedDashboard } from "@superset-ui/embedded-sdk";

const SupersetDashboard = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const embed = async () => {
      if (!containerRef.current) return;

      try {
        // 1. Fetch Guest Token and Metadata from our backend
        const response = await fetch("http://localhost:5000/api/superset/guest-token");
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
      } catch (error) {
        console.error("Failed to embed Superset dashboard:", error);
      }
    };

    embed();
  }, []);

  return (
    <div
      ref={containerRef}
      className="dashboard-container"
    />
  );
};


export default SupersetDashboard;
