import React, { useState } from "react";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";

const IntrusionDetection = () => {
    const [attackData, setAttackData] = useState(null);
    const [alert, setAlert] = useState(null);
    const [loading, setLoading] = useState(false);
    const [threatAnalysis, setThreatAnalysis] = useState(null);

    const simulateAttack = async () => {
        setLoading(true);
        try {
            const response = await axios.post("http://127.0.0.1:5000/simulate-intrusion");
            setAttackData(response.data.attack_data);
            setAlert(response.data.alert);
            
            // Generate threat analysis based on attack data
            if (response.data.attack_data) {
                analyzeThreat(response.data.attack_data);
            }
        } catch (error) {
            console.error("Error simulating attack:", error);
        }
        setLoading(false);
    };

    const analyzeThreat = (data) => {
        // Calculate threat scores based on key metrics
        const threatScores = {
            networkActivity: calculateScore([
                data.serror_rate, data.rerror_rate, 
                data.srv_serror_rate, data.srv_rerror_rate
            ], 0.25),
            accessAttempts: calculateScore([
                data.num_failed_logins / 15, data.su_attempted,
                data.root_shell, (data.num_compromised / 50)
            ], 0.25),
            systemImpact: calculateScore([
                data.num_root / 50, data.num_file_creations / 20,
                data.num_shells / 5, data.num_access_files / 20
            ], 0.25),
            trafficPattern: calculateScore([
                data.count / 1000, data.diff_srv_rate,
                data.dst_host_diff_srv_rate, data.dst_host_srv_diff_host_rate
            ], 0.25)
        };

        // Overall threat score
        const overallScore = (
            threatScores.networkActivity +
            threatScores.accessAttempts +
            threatScores.systemImpact +
            threatScores.trafficPattern
        ) / 4;

        // Attack vector analysis
        const attackVectors = [
            {
                name: "Port Scanning",
                value: Math.round(data.diff_srv_rate * 100),
                description: "Attempts to identify open network ports"
            },
            {
                name: "Brute Force",
                value: Math.round((data.num_failed_logins / 15) * 100),
                description: "Repeated login attempts"
            },
            {
                name: "Privilege Escalation",
                value: Math.round(((data.root_shell + data.su_attempted) / 2) * 100),
                description: "Attempts to gain admin access"
            },
            {
                name: "Data Exfiltration",
                value: Math.round((data.dst_bytes / 200000) * 100),
                description: "Unusual amounts of outbound data"
            }
        ];

        setThreatAnalysis({
            scores: threatScores,
            overallScore,
            attackVectors,
            recommendation: generateRecommendation(overallScore, threatScores)
        });
    };

    const calculateScore = (values, weight) => {
        return Math.min(
            1, 
            values.reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0) * weight
        );
    };

    const generateRecommendation = (score, scores) => {
        if (score > 0.8) {
            return "CRITICAL: Immediate isolation of affected systems required. Implement full security protocol.";
        } else if (score > 0.6) {
            return "HIGH RISK: Enhanced monitoring required. Check firewall configurations and access logs.";
        } else if (score > 0.4) {
            return "MODERATE RISK: Investigate suspicious activities. Consider temporary access restrictions.";
        } else {
            return "LOW RISK: Continue monitoring. Update security definitions.";
        }
    };

    const getThreatLevel = (score) => {
        if (score > 0.8) return { color: "#d32f2f", label: "Critical" };
        if (score > 0.6) return { color: "#f57c00", label: "High" };
        if (score > 0.4) return { color: "#fbc02d", label: "Moderate" };
        return { color: "#388e3c", label: "Low" };
    };

    const COLORS = ['#ff6b6b', '#ffa06b', '#ffd46b', '#6bff8a'];

    // Extract key metrics for radar chart
    const getRadarData = () => {
        if (!attackData) return [];
        
        return [
            {
                subject: 'Login Failures',
                A: (attackData.num_failed_logins / 15) * 100,
                fullMark: 100,
            },
            {
                subject: 'Error Rate',
                A: attackData.serror_rate * 100,
                fullMark: 100,
            },
            {
                subject: 'Root Access',
                A: (attackData.num_root / 50) * 100,
                fullMark: 100,
            },
            {
                subject: 'File Creation',
                A: (attackData.num_file_creations / 20) * 100,
                fullMark: 100,
            },
            {
                subject: 'Shell Access',
                A: (attackData.num_shells / 5) * 100,
                fullMark: 100,
            },
        ];
    };

    return (
        <div className="max-w-6xl mx-auto p-6 bg-slate-50 min-h-screen">
            <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
                <h1 className="text-3xl font-bold text-center mb-6 text-blue-800 flex items-center justify-center">
                    <span className="mr-2">🛡️</span> Network Intrusion Detection System
                </h1>
                
                <div className="flex justify-center mb-8">
                    <button
                        onClick={simulateAttack}
                        disabled={loading}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 flex items-center text-lg"
                    >
                        <span className="mr-2">⚠️</span> 
                        {loading ? "Simulating..." : "Simulate Cyberattack"}
                    </button>
                </div>

                {loading && (
                    <div className="text-center p-4 bg-blue-50 rounded-lg animate-pulse mb-6">
                        <p className="text-blue-700 font-semibold">Running attack simulation...</p>
                        <p className="text-blue-600">Analyzing network traffic patterns and detecting anomalies...</p>
                    </div>
                )}

                {attackData && threatAnalysis && (
                    <div className="space-y-8">
                        {/* Alert Banner */}
                        {alert && (
                            <div className={`p-4 rounded-lg shadow mb-6 ${getThreatLevel(threatAnalysis.overallScore).color === "#d32f2f" ? "bg-red-100 border-l-4 border-red-600" : "bg-yellow-100 border-l-4 border-yellow-600"}`}>
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <span className="text-2xl">🚨</span>
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-lg font-bold text-gray-800">Security Alert</h3>
                                        <p className="mt-1">{alert.details}</p>
                                        <p className="mt-2 font-semibold">{threatAnalysis.recommendation}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Threat Score Overview */}
                        <div className="bg-white shadow rounded-lg p-6">
                            <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
                                <span className="mr-2">📊</span> Threat Assessment
                            </h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                {/* Overall Threat Score */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h3 className="text-lg font-semibold mb-2">Overall Threat Score</h3>
                                    <div className="flex items-center">
                                        <div 
                                            className="w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-xl"
                                            style={{ backgroundColor: getThreatLevel(threatAnalysis.overallScore).color }}
                                        >
                                            {Math.round(threatAnalysis.overallScore * 100)}%
                                        </div>
                                        <div className="ml-4">
                                            <p className="text-lg font-bold" style={{ color: getThreatLevel(threatAnalysis.overallScore).color }}>
                                                {getThreatLevel(threatAnalysis.overallScore).label} Risk
                                            </p>
                                            <p className="text-sm mt-1">{threatAnalysis.recommendation}</p>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Attack Vector Chart */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h3 className="text-lg font-semibold mb-2">Attack Vectors</h3>
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={threatAnalysis.attackVectors}
                                                    cx="50%"
                                                    cy="50%"
                                                    outerRadius={80}
                                                    dataKey="value"
                                                    label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                                >
                                                    {threatAnalysis.attackVectors.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip formatter={(value) => `${value}%`} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Threat Category Breakdown */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                {Object.entries(threatAnalysis.scores).map(([key, value]) => {
                                    const threatLevel = getThreatLevel(value);
                                    return (
                                        <div key={key} className="bg-white border rounded-lg p-3 shadow-sm">
                                            <h4 className="font-medium text-gray-700 capitalize">
                                                {key.replace(/([A-Z])/g, ' $1').trim()}
                                            </h4>
                                            <div className="flex items-center mt-2">
                                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                    <div
                                                        className="h-2.5 rounded-full"
                                                        style={{
                                                            width: `${Math.round(value * 100)}%`,
                                                            backgroundColor: threatLevel.color
                                                        }}
                                                    ></div>
                                                </div>
                                                <span className="ml-2 font-semibold" style={{ color: threatLevel.color }}>
                                                    {Math.round(value * 100)}%
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Attack Patterns Analysis */}
                        <div className="bg-white shadow rounded-lg p-6">
                            <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
                                <span className="mr-2">🔍</span> Attack Pattern Analysis
                            </h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Radar Chart */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h3 className="text-lg font-semibold mb-2">Attack Pattern Radar</h3>
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={getRadarData()}>
                                                <PolarGrid />
                                                <PolarAngleAxis dataKey="subject" />
                                                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                                                <Radar name="Attack Metrics" dataKey="A" stroke="#ff4d6d" fill="#ff4d6d" fillOpacity={0.6} />
                                                <Tooltip formatter={(value) => `${Math.round(value)}%`} />
                                            </RadarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                
                                {/* Key Metrics */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h3 className="text-lg font-semibold mb-2">Key Attack Metrics</h3>
                                    <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                                        {[
                                            { label: "Duration", value: `${attackData.duration} sec` },
                                            { label: "Data Transfer", value: `${(attackData.src_bytes + attackData.dst_bytes).toLocaleString()} bytes` },
                                            { label: "Connection Count", value: attackData.count },
                                            { label: "Error Rate", value: `${(attackData.serror_rate * 100).toFixed(1)}%` },
                                            { label: "Login Failures", value: attackData.num_failed_logins },
                                            { label: "Root Access Attempts", value: attackData.num_root },
                                            { label: "Shell Commands", value: attackData.num_shells },
                                            { label: "File Creations", value: attackData.num_file_creations }
                                        ].map((item, index) => (
                                            <div key={index} className="flex justify-between items-center border-b pb-2">
                                                <span className="font-medium text-gray-700">{item.label}:</span>
                                                <span className="font-semibold text-gray-900">{item.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Raw Attack Data */}
                        <div className="bg-white shadow rounded-lg p-6">
                            <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
                                <span className="mr-2">📄</span> Raw Attack Data
                            </h2>
                            
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-2 max-h-64 overflow-y-auto">
                                    {Object.entries(attackData).map(([key, value], index) => (
                                        <div key={index} className="flex justify-between">
                                            <span className="text-sm font-medium text-gray-600">
                                                {key.replace(/_/g, " ")}:
                                            </span>
                                            <span className="text-sm font-semibold text-gray-900">
                                                {typeof value === 'number' && value % 1 !== 0
                                                    ? value.toFixed(4)
                                                    : value}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Initial State */}
                {!attackData && !loading && (
                    <div className="text-center p-8 bg-blue-50 rounded-lg">
                        <div className="text-6xl mb-4">🔐</div>
                        <h2 className="text-xl font-semibold text-blue-800 mb-2">Network Monitoring Active</h2>
                        <p className="text-blue-600">System is ready to detect and analyze potential network intrusions.</p>
                        <p className="text-blue-600 mt-2">Click the "Simulate Cyberattack" button to test the detection system.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default IntrusionDetection;