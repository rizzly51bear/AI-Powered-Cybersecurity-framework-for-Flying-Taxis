import React, { useState, useEffect } from "react";
import GpsSpoofing from "./components/GpsSpoofing";
import IntrusionDetection from "./components/IntrusionDetection";
import SecureFlightCommands from "./components/SecureCommunication";
import UnauthorizedAccess from "./components/Logintrack";
import SystemHealth from "./components/system";
import Login from "./components/login"; 
import axios from "axios";
import { FaSatelliteDish, FaShieldAlt, FaPlaneDeparture, FaUserShield, FaTachometerAlt, FaBars } from "react-icons/fa";

const App = () => {
    const [selectedComponent, setSelectedComponent] = useState("GpsSpoofing");
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [user, setUser] = useState(null);

    // ✅ Check if User is Logged In
    useEffect(() => {
      axios.get("http://127.0.0.1:5000/check-session")
          .then(response => {
              if (response.data.logged_in) {
                  setUser(response.data.user);
              }
          })
          .catch(() => setUser(null));
    }, []);

    const components = {
        GpsSpoofing: <GpsSpoofing />,
        IntrusionDetection: <IntrusionDetection />,
        SecureFlightCommands: <SecureFlightCommands />,
        UnauthorizedAccess: <UnauthorizedAccess />,
        SystemHealth: <SystemHealth />,
    };

    const toggleMobileSidebar = () => {
        setIsMobileSidebarOpen(!isMobileSidebarOpen);
    };


    // ✅ If User is Not Logged In, Show Login Page
    if (!user) {
      return <Login setUser={setUser} />;
    }


    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 text-gray-800">
            {/* Mobile Header */}
            <div className="md:hidden bg-blue-900 p-4 flex items-center justify-between">
                <h1 className="text-xl font-bold text-white">Flying Taxi Security</h1>
                <button onClick={toggleMobileSidebar} className="text-white">
                    <FaBars size={24} />
                </button>
            </div>

            {/* Sidebar */}
            <div className={`${isMobileSidebarOpen ? 'block' : 'hidden'} md:block w-full md:w-64 bg-gradient-to-b from-blue-900 to-blue-800 text-white p-6 flex flex-col justify-between shadow-xl z-10`}>
                <div>
                    <div className="hidden md:block mb-8">
                        <h1 className="text-2xl font-bold text-center">
                            <span className="mr-2">🚁</span>
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-100 to-white">
                                Flying Taxi
                            </span>
                        </h1>
                        <p className="text-center text-blue-200 font-medium mt-1">Security Dashboard</p>
                    </div>
                    <nav className="space-y-2">
                        <SidebarItem
                            icon={<FaSatelliteDish />}
                            label="GPS Spoofing"
                            isSelected={selectedComponent === "GpsSpoofing"}
                            onClick={() => {
                                setSelectedComponent("GpsSpoofing");
                                setIsMobileSidebarOpen(false);
                            }}
                        />
                        <SidebarItem
                            icon={<FaShieldAlt />}
                            label="Intrusion Detection"
                            isSelected={selectedComponent === "IntrusionDetection"}
                            onClick={() => {
                                setSelectedComponent("IntrusionDetection");
                                setIsMobileSidebarOpen(false);
                            }}
                        />
                        <SidebarItem
                            icon={<FaPlaneDeparture />}
                            label="Secure Commands"
                            isSelected={selectedComponent === "SecureFlightCommands"}
                            onClick={() => {
                                setSelectedComponent("SecureFlightCommands");
                                setIsMobileSidebarOpen(false);
                            }}
                        />
                        <SidebarItem
                            icon={<FaUserShield />}
                            label="Unauthorized Access"
                            isSelected={selectedComponent === "UnauthorizedAccess"}
                            onClick={() => {
                                setSelectedComponent("UnauthorizedAccess");
                                setIsMobileSidebarOpen(false);
                            }}
                        />
                        <SidebarItem
                            icon={<FaTachometerAlt />}
                            label="System Health"
                            isSelected={selectedComponent === "SystemHealth"}
                            onClick={() => {
                                setSelectedComponent("SystemHealth");
                                setIsMobileSidebarOpen(false);
                            }}
                        />
                    </nav>
                </div>
                <div className="mt-8 border-t border-blue-700 pt-4">
                    <p className="text-sm text-center text-blue-200">Flying Taxi Security Platform</p>
                    <p className="text-xs text-center text-blue-300 mt-1">© 2025</p>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 md:overflow-y-auto">
                <header className="hidden md:flex items-center justify-between bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
                    <h2 className="text-xl font-semibold">
                        {selectedComponent === "GpsSpoofing" && "GPS Spoofing Detection"}
                        {selectedComponent === "IntrusionDetection" && "Intrusion Detection System"}
                        {selectedComponent === "SecureFlightCommands" && "Secure Flight Commands"}
                        {selectedComponent === "UnauthorizedAccess" && "Unauthorized Access Monitoring"}
                        {selectedComponent === "SystemHealth" && "System Health Analytics"}
                    </h2>
                    <div className="flex items-center text-gray-600">
                        <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                        <span className="text-sm">All systems operational</span>
                    </div>
                </header>
                <main className="p-6">
                    <div className="bg-white rounded-lg shadow-md p-6">
                        {components[selectedComponent]}
                    </div>
                </main>
            </div>
        </div>
    );
};

// Enhanced Sidebar Item Component
const SidebarItem = ({ icon, label, isSelected, onClick }) => (
    <button
        className={`flex items-center p-3 rounded-lg w-full text-sm font-medium transition-all duration-200 ${
            isSelected 
                ? "bg-blue-700 text-white shadow-md" 
                : "text-blue-100 hover:bg-blue-700/50"
        }`}
        onClick={onClick}
    >
        <span className={`mr-3 text-lg ${isSelected ? "text-blue-200" : "text-blue-300"}`}>{icon}</span>
        {label}
    </button>
);

export default App