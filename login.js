import React, { useState } from "react";

import axios from "axios";

const Login = ({ setUser }) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleLogin = async () => {
        try {
            const response = await axios.post("http://127.0.0.1:5000/login", { username, password });
            if (response.data.message.includes("✅")) {
                setUser(username);
                setError(""); // Clear error
            } else {
                setError(response.data.message);
            }
        } catch (err) {
            setError("❌ Login Failed");
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100">
            <div className="bg-white p-6 shadow-lg rounded-lg w-96">
                <h2 className="text-2xl font-bold text-gray-800 text-center mb-4">🔑 Secure Login</h2>
                
                {error && <p className="text-red-500 text-center">{error}</p>}

                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full p-2 border rounded mb-3"
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2 border rounded mb-3"
                />

                <button 
                    onClick={handleLogin}
                    className="w-full bg-blue-600 text-white p-2 rounded"
                >
                    🔐 Login
                </button>
            </div>
        </div>
    );
};

export default Login;
