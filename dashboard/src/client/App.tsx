import React, { useState } from "react";
import SupersetDashboard from "./components/SupersetDashboard";
import { AuthProvider, useAuth } from "./components/AuthContext";
import Login from "./components/Login";

import "./index.css";

const MainApp = () => {
   const [activeTab, setActiveTab] = useState("dashboard");
   const [loading, setLoading] = useState(false);
   const [status, setStatus] = useState<{ message: string; type: "success" | "error" | "" }>({
     message: "",
     type: "",
   });

   const { user, logout } = useAuth();
 
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
 
   const renderContent = () => {
     switch (activeTab) {
       case "dashboard":
         return <SupersetDashboard />;
       case "sqllab":
         return (
           <iframe 
             src="http://localhost:8088/sqllab/?standalone=true" 
             className="full-iframe"
             title="SQL Lab"
           />
         );
       case "explorer":
         return (
           <iframe 
             src="http://localhost:8088/chart/add?standalone=true" 
             className="full-iframe"
             title="Chart Builder"
           />
         );
 
       default:
         return <SupersetDashboard />;
     }
   };
 
   return (
     <div className="app-container">
       <div className="sidebar">
         <div className="sidebar-header">Data Pro</div>
         <div 
           className={`nav-item ${activeTab === "dashboard" ? "active" : ""}`}
           onClick={() => setActiveTab("dashboard")}
         >
           📊 Dashboard
         </div>
         <div 
           className={`nav-item ${activeTab === "sqllab" ? "active" : ""}`}
           onClick={() => setActiveTab("sqllab")}
         >
           💻 SQL Lab
         </div>
         <div 
           className={`nav-item ${activeTab === "explorer" ? "active" : ""}`}
           onClick={() => setActiveTab("explorer")}
         >
           🎨 Chart Builder
         </div>

         <div style={{ marginTop: 'auto', padding: '20px' }}>
            <div style={{ fontSize: '0.8rem', color: '#86868b', marginBottom: '10px' }}>
                Signed in as <strong>{user?.username}</strong>
            </div>
            <button className="btn-seed" style={{ background: '#f5f5f7', color: '#d70015', width: '100%' }} onClick={logout}>
                Sign Out
            </button>
         </div>
       </div>
       
       <div className="main-content">
         <div className="header">
           <h1>{
             activeTab === "dashboard" ? "Metrics Dashboard" : 
             activeTab === "sqllab" ? "SQL Lab (Raw Data)" : 
             "Chart Explorer"
           }</h1>
           <div>
             <button className="btn-seed" onClick={handleSeed} disabled={loading}>
               {loading ? "Seeding..." : "Quick Seed DB"}
             </button>
             {status.message && (
               <div className={`status-message status-${status.type}`}>
                 {status.message}
               </div>
             )}
           </div>
         </div>
         
         <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
           {renderContent()}
         </div>
       </div>
     </div>
   );
};

const App = () => {
  return (
    <AuthProvider>
      <AuthWrapper />
    </AuthProvider>
  );
};

const AuthWrapper = () => {
    const { user, isLoading } = useAuth();
    if (isLoading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
    return user ? <MainApp /> : <Login />;
};

export default App;