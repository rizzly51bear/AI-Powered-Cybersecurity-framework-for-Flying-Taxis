import React, { useState, useEffect } from "react";
import axios from "axios";

const SecureCommunication = () => {
    const [command, setCommand] = useState("");
    const [encryptedCommand, setEncryptedCommand] = useState("");
    const [tamperedCommand, setTamperedCommand] = useState("");
    const [decryptedResponse, setDecryptedResponse] = useState("");
    const [tamperStatus, setTamperStatus] = useState("");
    const [publicKeyPEM, setPublicKeyPEM] = useState("");
    const [loading, setLoading] = useState(false);
    const [commandHistory, setCommandHistory] = useState([]);
    const [activeTab, setActiveTab] = useState("demo");

    // Fetch Public Key from Backend
    useEffect(() => {
        setLoading(true);
        axios.get("http://127.0.0.1:5000/get-public-key")
            .then(response => {
                setPublicKeyPEM(response.data.public_key);
                setLoading(false);
            })
            .catch(error => {
                console.error("Error fetching public key:", error);
                setLoading(false);
            });
    }, []);

    // Encrypt Command Using Web Crypto API
    const handleEncrypt = async () => {
        try {
            if (!command.trim()) {
                alert("Please enter a command first!");
                return;
            }
            
            if (!publicKeyPEM) {
                alert("Public key not loaded!");
                return;
            }

            setLoading(true);
            const encrypted = await encryptWithPublicKey(publicKeyPEM, command);
            setEncryptedCommand(encrypted);
            setTamperedCommand(encrypted); // Default the attacker's copy to original
            setDecryptedResponse("");
            setTamperStatus("");
            setLoading(false);
        } catch (error) {
            console.error("Encryption error:", error);
            setLoading(false);
        }
    };

    // Validate Command - Sender or Attacker can send it
    const handleValidate = (messageToSend, isTampered = false) => {
        setLoading(true);
        axios.post("http://127.0.0.1:5000/validate-command", { encrypted_command: messageToSend })
            .then(response => {
                const decrypted = response.data.decrypted_command;
                setDecryptedResponse(decrypted);

                // Tamper Detection
                const isTamperedResult = decrypted !== command;
                const status = isTamperedResult
                    ? "❌ Message Tampered! Attack Detected!"
                    : "✅ Message is Authentic!";
                
                setTamperStatus(status);
                
                // Add to history
                setCommandHistory(prev => [
                    {
                        original: command,
                        encrypted: encryptedCommand,
                        decrypted: decrypted,
                        timestamp: new Date().toLocaleTimeString(),
                        isTampered: isTamperedResult,
                        attemptedTamper: isTampered
                    },
                    ...prev
                ].slice(0, 10)); // Keep only last 10 commands
                
                setLoading(false);
            })
            .catch(error => {
                console.error("Error validating command:", error);
                setDecryptedResponse("Invalid or corrupted command");
                setTamperStatus("⚠️ Potential Attack Detected!");
                setLoading(false);
                
                // Add failed attempt to history
                setCommandHistory(prev => [
                    {
                        original: command,
                        encrypted: encryptedCommand,
                        decrypted: "Failed to decrypt",
                        timestamp: new Date().toLocaleTimeString(),
                        isTampered: true,
                        attemptedTamper: isTampered,
                        error: true
                    },
                    ...prev
                ].slice(0, 10));
            });
    };

    // Reset all fields
    const handleReset = () => {
        setCommand("");
        setEncryptedCommand("");
        setTamperedCommand("");
        setDecryptedResponse("");
        setTamperStatus("");
    };

    // Random bit flip function for tampering demo
    const flipRandomBit = () => {
        if (!encryptedCommand) return;
        
        // Convert base64 to binary
        const binary = atob(encryptedCommand);
        
        // Pick a random position
        const pos = Math.floor(Math.random() * binary.length);
        
        // Create a modified binary by flipping one bit at the random position
        const charCode = binary.charCodeAt(pos);
        const bitPos = Math.floor(Math.random() * 8);
        const flippedCharCode = charCode ^ (1 << bitPos);
        
        // Create a new string with the flipped bit
        const modifiedBinary = 
            binary.substring(0, pos) + 
            String.fromCharCode(flippedCharCode) + 
            binary.substring(pos + 1);
        
        // Convert back to base64
        const modifiedBase64 = btoa(modifiedBinary);
        
        setTamperedCommand(modifiedBase64);
    };

    // Calculate success percentage for security analysis
    const calculateStats = () => {
        if (commandHistory.length === 0) return { tamperedDetected: 0, authenticPassed: 0 };
        
        const tamperedCount = commandHistory.filter(c => c.attemptedTamper).length;
        const tamperedDetectedCount = commandHistory.filter(c => c.attemptedTamper && c.isTampered).length;
        
        const authenticCount = commandHistory.filter(c => !c.attemptedTamper).length;
        const authenticPassedCount = commandHistory.filter(c => !c.attemptedTamper && !c.isTampered).length;
        
        return {
            tamperedDetected: tamperedCount > 0 ? Math.round(tamperedDetectedCount / tamperedCount * 100) : 0,
            authenticPassed: authenticCount > 0 ? Math.round(authenticPassedCount / authenticCount * 100) : 0
        };
    };

    const stats = calculateStats();

    return (
        <div className="p-6 bg-gray-100 min-h-screen">
            {/* Header and Navigation */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Secure Communication Simulator</h1>
                <p className="text-gray-600">Demonstrating encryption and message integrity with RSA-OAEP</p>
                
                <div className="mt-4 border-b border-gray-200">
                    <nav className="flex space-x-8">
                        <button 
                            onClick={() => setActiveTab("demo")}
                            className={`py-2 px-1 ${activeTab === "demo" 
                                ? "border-b-2 border-blue-500 text-blue-600" 
                                : "text-gray-500 hover:text-gray-700"}`}
                        >
                            Interactive Demo
                        </button>
                        <button 
                            onClick={() => setActiveTab("analysis")}
                            className={`py-2 px-1 ${activeTab === "analysis" 
                                ? "border-b-2 border-blue-500 text-blue-600" 
                                : "text-gray-500 hover:text-gray-700"}`}
                        >
                            Security Analysis
                        </button>
                        <button 
                            onClick={() => setActiveTab("history")}
                            className={`py-2 px-1 ${activeTab === "history" 
                                ? "border-b-2 border-blue-500 text-blue-600" 
                                : "text-gray-500 hover:text-gray-700"}`}
                        >
                            Command History
                        </button>
                    </nav>
                </div>
            </div>
            
            {/* Loading Indicator */}
            {loading && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                    <div className="bg-white p-4 rounded-lg shadow-lg">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                        <p className="mt-2 text-center">Processing...</p>
                    </div>
                </div>
            )}
            
            {activeTab === "demo" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* ✅ Legitimate Sender Section */}
                    <div className="bg-white p-6 shadow-md rounded-lg border-l-4 border-blue-500">
                        <div className="flex items-center mb-4">
                            <div className="bg-blue-100 rounded-full p-2 mr-3">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h2 className="text-lg font-semibold text-blue-700">Legitimate Sender</h2>
                        </div>
                        
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Command to Send</label>
                            <div className="flex">
                                <input
                                    type="text"
                                    value={command}
                                    onChange={(e) => setCommand(e.target.value)}
                                    className="p-2 border rounded-l flex-1 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="e.g., Takeoff, Land, Move Forward"
                                />
                                <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-r transition-colors" onClick={handleEncrypt}>
                                    🔐 Encrypt
                                </button>
                            </div>
                        </div>

                        {/* Encrypted Message */}
                        {encryptedCommand && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Encrypted Message</label>
                                <div className="p-3 border bg-gray-50 text-sm break-all rounded-md max-h-24 overflow-y-auto">
                                    {encryptedCommand}
                                </div>
                                <button 
                                    className="mt-3 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition-colors w-full"
                                    onClick={() => handleValidate(encryptedCommand, false)}
                                >
                                    ✅ Send Without Tampering
                                </button>
                            </div>
                        )}
                    </div>

                    {/* ⚠️ Attacker Section */}
                    <div className="bg-white p-6 shadow-md rounded-lg border-l-4 border-red-500">
                        <div className="flex items-center mb-4">
                            <div className="bg-red-100 rounded-full p-2 mr-3">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h2 className="text-lg font-semibold text-red-700">Attacker (Man-in-the-Middle)</h2>
                        </div>

                        {/* Modify the Encrypted Command */}
                        {encryptedCommand ? (
                            <div className="mb-4">
                                <div className="flex items-center justify-between mb-1">
                                    <label className="block text-sm font-medium text-gray-700">Intercepted Message</label>
                                    <button 
                                        onClick={flipRandomBit}
                                        className="text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-2 py-1 rounded transition-colors"
                                    >
                                        Randomly Tamper
                                    </button>
                                </div>
                                <textarea
                                    value={tamperedCommand}
                                    onChange={(e) => setTamperedCommand(e.target.value)}
                                    className="p-3 border bg-gray-50 text-sm break-all rounded-md w-full h-24 focus:ring-red-500 focus:border-red-500"
                                />
                                <button 
                                    className="mt-3 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors w-full"
                                    onClick={() => handleValidate(tamperedCommand, true)}
                                >
                                    🚨 Send Tampered Message
                                </button>
                            </div>
                        ) : (
                            <div className="p-4 bg-gray-50 rounded-md text-gray-500 italic text-center">
                                Waiting for message to intercept...
                            </div>
                        )}
                    </div>

                    {/* 🔍 Validation Result */}
                    <div className="lg:col-span-2 bg-white p-6 shadow-md rounded-lg border-t-4 border-purple-500">
                        <div className="flex items-center mb-4">
                            <div className="bg-purple-100 rounded-full p-2 mr-3">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <h2 className="text-lg font-semibold text-purple-700">Decryption Result</h2>
                            <button 
                                onClick={handleReset}
                                className="ml-auto text-sm bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1 rounded transition-colors"
                            >
                                Reset Demo
                            </button>
                        </div>

                        {decryptedResponse ? (
                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="flex-1 p-4 bg-gray-50 rounded-lg">
                                    <h3 className="font-medium text-gray-700 mb-2">Decrypted Command:</h3>
                                    <p className="text-lg font-semibold">{decryptedResponse}</p>
                                </div>
                                <div className="flex-1 p-4 rounded-lg" style={{ 
                                    backgroundColor: tamperStatus.includes("❌") ? "rgba(254, 226, 226, 0.5)" : 
                                                   tamperStatus.includes("✅") ? "rgba(220, 252, 231, 0.5)" : 
                                                   "rgba(254, 249, 195, 0.5)" 
                                }}>
                                    <h3 className="font-medium text-gray-700 mb-2">Security Status:</h3>
                                    <p className={`text-lg font-semibold ${
                                        tamperStatus.includes("❌") ? "text-red-600" : 
                                        tamperStatus.includes("✅") ? "text-green-600" : 
                                        "text-yellow-600"
                                    }`}>
                                        {tamperStatus}
                                    </p>
                                    <p className="text-sm mt-2 text-gray-600">
                                        {tamperStatus.includes("❌") ? 
                                            "The cryptographic validation detected that the message was modified in transit." : 
                                        tamperStatus.includes("✅") ? 
                                            "The message was verified as authentic and unmodified." : 
                                            "The system detected a potential security issue with this message."}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 bg-gray-50 rounded-md text-gray-500 italic text-center">
                                No messages have been processed yet.
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            {activeTab === "analysis" && (
                <div className="bg-white p-6 shadow-md rounded-lg">
                    <h2 className="text-xl font-semibold mb-4">Security Analysis</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="p-4 bg-blue-50 rounded-lg">
                            <h3 className="font-medium text-blue-700 mb-2">Tamper Detection Rate</h3>
                            <div className="flex items-end">
                                <div className="text-3xl font-bold text-blue-800">{stats.tamperedDetected}%</div>
                                <div className="ml-2 text-sm text-blue-600">of tampered messages detected</div>
                            </div>
                            <div className="mt-2 h-4 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-blue-500" 
                                    style={{ width: `${stats.tamperedDetected}%` }}
                                ></div>
                            </div>
                        </div>
                        
                        <div className="p-4 bg-green-50 rounded-lg">
                            <h3 className="font-medium text-green-700 mb-2">Authentic Message Success</h3>
                            <div className="flex items-end">
                                <div className="text-3xl font-bold text-green-800">{stats.authenticPassed}%</div>
                                <div className="ml-2 text-sm text-green-600">of authentic messages validated</div>
                            </div>
                            <div className="mt-2 h-4 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-green-500" 
                                    style={{ width: `${stats.authenticPassed}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="border-t pt-4">
                        <h3 className="font-medium mb-3">How It Works</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <h4 className="font-medium text-gray-700 mb-2">1. Encryption</h4>
                                <p className="text-sm text-gray-600">
                                    The system uses RSA-OAEP encryption with SHA-256 hashing. This asymmetric encryption ensures only the intended recipient can decrypt the message using their private key.
                                </p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <h4 className="font-medium text-gray-700 mb-2">2. Message Integrity</h4>
                                <p className="text-sm text-gray-600">
                                    RSA-OAEP provides built-in message integrity protection. Any modification to the ciphertext will result in decryption failure or an altered plaintext that won't match the original.
                                </p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <h4 className="font-medium text-gray-700 mb-2">3. Authentication</h4>
                                <p className="text-sm text-gray-600">
                                    By comparing the decrypted message with the original, we can verify if the message was tampered with during transmission, providing a basic form of message authentication.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {activeTab === "history" && (
                <div className="bg-white p-6 shadow-md rounded-lg">
                    <h2 className="text-xl font-semibold mb-4">Command History</h2>
                    
                    {commandHistory.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead>
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Original Command</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Decrypted Result</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {commandHistory.map((item, index) => (
                                        <tr key={index} className={item.error ? "bg-red-50" : item.isTampered ? "bg-yellow-50" : "bg-green-50"}>
                                            <td className="px-4 py-3 text-sm text-gray-500">{item.timestamp}</td>
                                            <td className="px-4 py-3 text-sm font-medium">{item.original}</td>
                                            <td className="px-4 py-3 text-sm">{item.decrypted}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    item.error ? "bg-red-100 text-red-800" : 
                                                    item.isTampered ? "bg-yellow-100 text-yellow-800" : 
                                                    "bg-green-100 text-green-800"
                                                }`}>
                                                    {item.error ? "Error" : 
                                                     item.isTampered ? "Tampered" : 
                                                     "Authentic"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center p-6 bg-gray-50 rounded-md text-gray-500 italic">
                            No command history available yet. Send some messages to see them here.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SecureCommunication;

// ✅ Web Crypto API - Encrypt with Public Key
async function encryptWithPublicKey(publicKeyPEM, data) {
    // Convert PEM to Binary
    const binaryDer = convertPEMtoBinary(publicKeyPEM);

    // Import Public Key
    const publicKey = await window.crypto.subtle.importKey(
        "spki",
        binaryDer,
        { name: "RSA-OAEP", hash: "SHA-256" },
        true,
        ["encrypt"]
    );

    // Encode Data and Encrypt
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(data);
    const encryptedBuffer = await window.crypto.subtle.encrypt(
        { name: "RSA-OAEP" },
        publicKey,
        encodedData
    );

    return btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)));  // Convert to Base64
}

// ✅ Convert PEM to Binary DER Format
function convertPEMtoBinary(pem) {
    const base64 = pem.replace(/(-----(BEGIN|END) PUBLIC KEY-----|\n)/g, "");
    const binaryString = atob(base64);
    const binary = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        binary[i] = binaryString.charCodeAt(i);
    }
    return binary.buffer;
}