import React, { useState, useEffect } from "react";
import axios from "axios";

const UnauthorizedAccess = () => {
    const [logs, setLogs] = useState([]);

    // 🔄 Fetch Logs
    const fetchLogs = async () => {
        try {
            const response = await axios.get("http://127.0.0.1:5000/access-logs");
            setLogs(response.data.logs);
        } catch (error) {
            console.error("Error fetching logs:", error);
        }
    };

    useEffect(() => {
        fetchLogs();
        const interval = setInterval(fetchLogs, 5000); // Refresh logs every 5s
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="p-6 bg-gray-100 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-800 mb-4 text-center">🚨 Unauthorized Access Logs</h1>

            <div className="bg-white p-4 shadow-md rounded-lg">
                <h2 className="text-lg font-semibold mb-2">🔍 Recent Login Attempts</h2>
                <table className="w-full border-collapse border border-gray-300">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="border p-2">Timestamp</th>
                            <th className="border p-2">IP Address</th>
                            <th className="border p-2">Username</th>
                            <th className="border p-2">Status</th>
                            <th className="border p-2">Attempts</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map((log, index) => (
                            <tr key={index} className={log.status === "Failed" ? "bg-red-100" : "bg-green-100"}>
                                <td className="border p-2">{log.timestamp}</td>
                                <td className="border p-2">{log.ip_address}</td>
                                <td className="border p-2">{log.username}</td>
                                <td className="border p-2 font-bold">{log.status}</td>
                                <td className="border p-2">{log.attempts}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UnauthorizedAccess;
