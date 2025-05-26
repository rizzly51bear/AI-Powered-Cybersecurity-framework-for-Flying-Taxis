import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css"; // Important CSS import
import { 
    LineChart, 
    Line, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Legend, 
    ResponsiveContainer 
} from 'recharts';

// 🚖 Custom Taxi Icon
const taxiIcon = new L.Icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/1995/1995574.png", // Taxi icon URL
    iconSize: [40, 40],  // Adjust size as needed
});

const GpsSpoofing = () => {
    const [gpsData, setGpsData] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [currentGps, setCurrentGps] = useState({ latitude: 37.7749, longitude: -122.4194, altitude: 300, timestamp: new Date().toISOString() });
    const [manualInput, setManualInput] = useState(false);
    const [inputValues, setInputValues] = useState({
        latitude: 37.7749,
        longitude: -122.4194,
        altitude: 300
    });
    const [isSpoofed, setIsSpoofed] = useState(false);
    const [rejectionMessage, setRejectionMessage] = useState("");
    const mapRef = useRef(null);

    // Fetch GPS Spoofing Data from Backend
    const fetchGpsData = async () => {
        try {
            const response = await axios.post("http://127.0.0.1:5000/detect-gps", {
                gps: {
                    latitude: currentGps.latitude,
                    longitude: currentGps.longitude,
                    altitude: currentGps.altitude
                }
            });

            let spoofDetected = false;
            
            if (response.data.alert) {
                // Check if alert contains GPS spoofing information
                if (response.data.alert.details && response.data.alert.details.includes("GPS Spoofing")) {
                    spoofDetected = true;
                    setIsSpoofed(true);
                    setRejectionMessage("SPOOF DETECTED: REJECTING COMMAND");
                    
                    // Reset rejection message after 5 seconds
                    setTimeout(() => {
                        setRejectionMessage("");
                    }, 5000);
                }
                
                setAlerts((prevAlerts) => {
                    if (prevAlerts.length > 0 && prevAlerts[prevAlerts.length - 1].details === response.data.alert.details) {
                        return prevAlerts;
                    }
                    return [...prevAlerts.slice(-5), response.data.alert];
                });
            } else {
                setIsSpoofed(false);
            }

            // Only add new GPS point if not spoofed
            if (!spoofDetected) {
                const newPoint = {
                    ...currentGps,
                    timestamp: new Date().toISOString()
                };
                
                setGpsData((prevData) => [...prevData.slice(-20), newPoint]);
            }

        } catch (error) {
            console.error("Error fetching GPS data:", error);
            // Add simulated data even if server fails
            const newPoint = {
                ...currentGps,
                timestamp: new Date().toISOString()
            };
            setGpsData((prevData) => [...prevData.slice(-20), newPoint]);
        }
    };

    // Handle manual input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setInputValues({
            ...inputValues,
            [name]: parseFloat(value)
        });
    };

    // Apply manual input
    const applyManualInput = () => {
        // Only apply if not currently spoofed
        if (!isSpoofed) {
            setCurrentGps({
                ...currentGps,
                latitude: inputValues.latitude,
                longitude: inputValues.longitude,
                altitude: inputValues.altitude
            });
        } else {
            setRejectionMessage("SPOOF DETECTED: REJECTING COMMAND");
            
            // Reset rejection message after 5 seconds
            setTimeout(() => {
                setRejectionMessage("");
            }, 5000);
        }
    };

    // Simulate Flight Path if Manual Input is Disabled
    const updateFlightPath = () => {
        if (!manualInput && !isSpoofed) {
            setCurrentGps((prevGps) => ({
                latitude: prevGps.latitude + 0.002,  // Simulating smooth flight movement
                longitude: prevGps.longitude + 0.0015,
                altitude: prevGps.altitude + (Math.random() * 10 - 5),
                timestamp: new Date().toISOString()
            }));
        }
    };

    // Format data for altitude graph
    const getGraphData = () => {
        return gpsData.map((point, index) => ({
            name: `Point ${index + 1}`,
            altitude: point.altitude,
            time: new Date(point.timestamp).toLocaleTimeString(),
            latitude: point.latitude,
            longitude: point.longitude
        }));
    };

    useEffect(() => {
        // Initial data fetch
        fetchGpsData();

        const interval = setInterval(() => {
            if (!manualInput) {
                updateFlightPath();
            }
            fetchGpsData();
        }, 5000);

        return () => clearInterval(interval);
    }, [manualInput, currentGps.latitude, currentGps.longitude]); 

    // Get polyline points for the map
    const getPolylinePoints = () => {
        return gpsData.map(point => [point.latitude, point.longitude]);
    };

    // Check if alerts contain GPS spoofing
    const checkForSpoofing = () => {
        if (alerts.length > 0) {
            const latestAlert = alerts[alerts.length - 1];
            return latestAlert.details && latestAlert.details.includes("GPS Spoofing");
        }
        return false;
    };

    return (
        <div className="p-6 bg-gray-100 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">🚀 GPS Spoofing Detection</h1>

            {/* Rejection Message Banner */}
            {rejectionMessage && (
                <div className="bg-red-600 text-white p-3 mb-4 rounded-lg text-center font-bold animate-pulse">
                    {rejectionMessage}
                </div>
            )}

            {/* Toggle for Manual/Auto Input */}
            <div className="flex items-center mb-4">
                <label className="mr-2">🔄 Manual Input:</label>
                <input 
                    type="checkbox" 
                    checked={manualInput} 
                    onChange={() => setManualInput(!manualInput)} 
                    className="mr-4"
                />
                
                {/* Manual GPS Coordinates Input */}
                {manualInput && (
                    <div className="flex flex-wrap gap-4">
                        <div className="flex items-center">
                            <label className="mr-2">Latitude:</label>
                            <input 
                                type="number" 
                                name="latitude"
                                value={inputValues.latitude}
                                onChange={handleInputChange}
                                step="0.001"
                                className="border p-1 w-32"
                            />
                        </div>
                        <div className="flex items-center">
                            <label className="mr-2">Longitude:</label>
                            <input 
                                type="number" 
                                name="longitude"
                                value={inputValues.longitude}
                                onChange={handleInputChange}
                                step="0.001"
                                className="border p-1 w-32"
                            />
                        </div>
                        <div className="flex items-center">
                            <label className="mr-2">Altitude:</label>
                            <input 
                                type="number" 
                                name="altitude"
                                value={inputValues.altitude}
                                onChange={handleInputChange}
                                step="1"
                                className="border p-1 w-32"
                            />
                        </div>
                        <button 
                            onClick={applyManualInput}
                            className={`py-1 px-4 rounded ${isSpoofed ? 'bg-gray-500 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
                            disabled={isSpoofed}
                        >
                            Apply
                        </button>
                    </div>
                )}
            </div>

            {/* Live Map Display */}
            <div className="bg-white p-4 shadow-md rounded-lg mb-6">
                <h2 className="text-lg font-semibold mb-2">🌍 Live Taxi Location</h2>
                <div className="relative">
                    <MapContainer 
                        center={[currentGps.latitude, currentGps.longitude]} 
                        zoom={14} 
                        style={{ height: "400px", width: "100%" }}
                        ref={mapRef}
                    >
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <Marker position={[currentGps.latitude, currentGps.longitude]} icon={taxiIcon}>
                            <Popup>
                                🏎️ Flying Taxi <br />
                                <strong>Latitude:</strong> {currentGps.latitude.toFixed(6)} <br />
                                <strong>Longitude:</strong> {currentGps.longitude.toFixed(6)} <br />
                                <strong>Altitude:</strong> {currentGps.altitude.toFixed(2)}m
                            </Popup>
                        </Marker>
                        {gpsData.length > 1 && (
                            <Polyline 
                                positions={getPolylinePoints()} 
                                color="blue" 
                                weight={3} 
                                opacity={0.7} 
                            />
                        )}
                    </MapContainer>
                    
                    {/* Overlay for spoofed state */}
                    {isSpoofed && (
                        <div className="absolute top-0 left-0 right-0 bottom-0 bg-red-500 bg-opacity-30 flex items-center justify-center pointer-events-none">
                            <div className="bg-red-600 text-white p-4 rounded-lg text-xl font-bold">
                                GPS SPOOFING DETECTED
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Altitude Graph */}
            <div className="bg-white p-4 shadow-md rounded-lg mb-6">
                <h2 className="text-lg font-semibold mb-2">📈 Altitude Graph</h2>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                        data={getGraphData()}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis />
                        <Tooltip content={
                            ({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="bg-white p-2 border rounded shadow">
                                            <p className="text-sm"><strong>Time:</strong> {payload[0].payload.time}</p>
                                            <p className="text-sm"><strong>Altitude:</strong> {payload[0].value.toFixed(2)}m</p>
                                            <p className="text-sm"><strong>Lat/Long:</strong> {payload[0].payload.latitude.toFixed(4)}, {payload[0].payload.longitude.toFixed(4)}</p>
                                        </div>
                                    );
                                }
                                return null;
                            }
                        } />
                        <Legend />
                        <Line 
                            type="monotone" 
                            dataKey="altitude" 
                            stroke="#8884d8" 
                            activeDot={{ r: 8 }} 
                            name="Altitude (m)"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* GPS Spoofing Alerts */}
            <div className="bg-white p-4 shadow-md rounded-lg">
                <h2 className="text-lg font-semibold mb-2">⚠️ GPS Spoofing Alerts</h2>
                {alerts.length > 0 ? (
                    <ul className="list-disc ml-5">
                        {alerts.map((alert, index) => (
                            <li key={index} className="text-red-600 font-semibold">
                                [{new Date(alert.timestamp).toLocaleTimeString()}] <strong>{alert.threat_type}:</strong> {alert.details}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-green-600">✅ No spoofing detected.</p>
                )}
            </div>
        </div>
    );
};

export default GpsSpoofing;