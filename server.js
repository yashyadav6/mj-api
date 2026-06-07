require('dotenv').config(); // Fixed: Lowercase 'r'
const express = require('express');
const cors = require('cors');

const app = express();

// 🟢 CORS BLOCK REMOVED: Now allows requests from ANY origin
app.use(cors());
 
app.use(express.json());

// GET route for browser test
app.get('/', (req, res) => {
    res.send("<h1>StudyParcham Vercel Engine is Online and Upgraded! 🚀</h1>");
});

// 🔒 THE UNIVERSAL ADVANCED PROXY
app.post('/api/v1/proxy', async (req, res) => {
    const { target_url, method, payload, headers: clientHeaders } = req.body;

    if (!target_url) {
        return res.status(400).json({ success: false, error: "Missing target_url" });
    }

    // 🚨 MASTER FIX: We merge the Default headers with the FRONTEND headers.
    // This allows the frontend to send the FRESH TOKEN, completely bypassing stale .env tokens!
    const fetchHeaders = {
        "accept": "application/json, text/plain, */*",
        "content-type": "application/json",
        "origin": "https://missionjeet.in",
        "referer": "https://missionjeet.in/",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
        ...(clientHeaders || {}) // Injects dynamic headers from frontend
    };

    // Emergency Fallback to ENV only if frontend didn't send a token
    if (!fetchHeaders.authorization && process.env.NT_TOKEN) {
        fetchHeaders.authorization = `Bearer ${process.env.NT_TOKEN}`;
        fetchHeaders.app_id = "1772100600";
        fetchHeaders.user_id = process.env.NT_USER_ID;
        fetchHeaders.platform = "3";
        fetchHeaders.version = "1";
    }

    try {
        const options = {
            method: method ? method.toUpperCase() : 'GET',
            headers: fetchHeaders
        };
        
        // Exact strict handling for POST payloads
        if (options.method === 'POST' && payload) {
            options.body = typeof payload === 'string' ? payload : JSON.stringify(payload);
        }

        const response = await fetch(target_url, options);
        const text = await response.text(); // Get raw text to prevent crashing on HTML responses
        
        try {
            // Attempt to parse JSON strictly
            const jsonStart = text.indexOf('{');
            const jsonEnd = text.lastIndexOf('}');
            if (jsonStart !== -1 && jsonEnd !== -1) {
                const data = JSON.parse(text.substring(jsonStart, jsonEnd + 1));
                return res.json(data);
            } else {
                throw new Error("No JSON found");
            }
        } catch (e) {
            console.error("Blocked by Upstream:", text);
            res.json({ 
                success: false, 
                error: "Matrix Firewall Blocked Vercel Request. (Likely expired token)", 
                details: text.substring(0, 150) 
            });
        }
    } catch (error) {
        console.error("Proxy Fetch Error:", error);
        res.json({ success: false, error: "Engine connection failed", details: error.message });
    }
});

module.exports = app;
