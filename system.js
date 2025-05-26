import React, { useState, useEffect } from "react";
import axios from "axios";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

const SystemHealth = () => {
    const [healthData, setHealthData] = useState([]);

    // Fetch System Health Data
    const fetchSystemHealth = async () => {
        try {
            const response = await axios.get("http://127.0.0.1:5000/system-health");
            setHealthData((prevData) => [...prevData.slice(-10), response.data]);
        } catch (error) {
            console.error("Error fetching system health data:", error);
        }
    };

    useEffect(() => {
        fetchSystemHealth();
        const interval = setInterval(fetchSystemHealth, 5000); // Fetch every 5 seconds
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="p-6 bg-gray-100 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">⚙️ Live System Health Monitoring</h1>

            {/* CPU Usage Graph */}
            <div className="bg-white p-4 shadow-md rounded-lg mb-6">
                <h2 className="text-lg font-semibold mb-2">🖥️ CPU Usage</h2>
                <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={healthData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="timestamp" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="cpu_usage" stroke="#FF5733" strokeWidth={2} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Memory Usage Graph */}
            <div className="bg-white p-4 shadow-md rounded-lg mb-6">
                <h2 className="text-lg font-semibold mb-2">💾 Memory Usage</h2>
                <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={healthData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="timestamp" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="memory_usage" stroke="#3498db" strokeWidth={2} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Disk Usage Graph */}
            <div className="bg-white p-4 shadow-md rounded-lg mb-6">
                <h2 className="text-lg font-semibold mb-2">💿 Disk Usage</h2>
                <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={healthData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="timestamp" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="disk_usage" stroke="#27ae60" strokeWidth={2} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Network Usage */}
            <div className="bg-white p-4 shadow-md rounded-lg mb-6">
                <h2 className="text-lg font-semibold mb-2">🌐 Network Usage (MB)</h2>
                <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={healthData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="timestamp" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="network_sent" stroke="#f39c12" strokeWidth={2} />
                        <Line type="monotone" dataKey="network_received" stroke="#8e44ad" strokeWidth={2} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default SystemHealth;
