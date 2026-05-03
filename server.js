require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// 🛑 1. THE STRICT BOUNCcER (Allowed Domains)
const allowedDomains = [
    'https://nt.studyparcham.qzz.io', 
    'http://studyparcham.kesug.com',
    'https://missionjeet.studyparcham.qzz.io' // Tumhara naya MJ domain add kar diya
];

// 🛑 2. CUSTOM CORS MIDDLEWARE
app.use(cors({
    origin: function(origin, callback) {
        if(!origin || allowedDomains.includes(origin)){
            return callback(null, true);
        }
        return callback(new Error('Access Denied by StudyParcham Security.'), false);
    },
    optionsSuccessStatus: 200
}));
 
app.use(express.json());

// GET route for browser test
app.get('/', (req, res) => {
    res.send("<h1>Mission Jeet Universal Vercel Engine is Online! 🚀</h1>");
});

// 🔒 THE MISSION JEET ADVANCED PROXY
app.post('/api/v1/proxy', async (req, res) => {
    const { target_url, method, payload, headers: clientHeaders } = req.body;

    if (!target_url) {
        return res.status(400).json({ success: false, error: "Missing target_url" });
    }

    // 🚨 SMART HEADER NORMALIZER: 
    // Converts all incoming headers from core-engine to lowercase. 
    // This prevents sending duplicate headers like "Origin" AND "origin" which triggers Cloudfront Blocks!
    const normalizedClientHeaders = {};
    if (clientHeaders) {
        for (const [key, value] of Object.entries(clientHeaders)) {
            normalizedClientHeaders[key.toLowerCase()] = value;
        }
    }

    // 🚨 MASTER FIX FOR MISSION JEET: We set MJ defaults.
    const fetchHeaders = {
        "accept": "application/json, text/plain, */*",
        "content-type": "application/json",
        "origin": "https://missionjeet.in",     // Changed to Mission Jeet
        "referer": "https://missionjeet.in/",   // Changed to Mission Jeet
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
        ...normalizedClientHeaders 
    };

    // Emergency Fallback to ENV (MJ Specific)
    if (!fetchHeaders.authorization && process.env.MJ_TOKEN) {
        fetchHeaders.authorization = `Bearer ${process.env.MJ_TOKEN}`;
        fetchHeaders.app_id = "1772100600"; // Exact Mission Jeet App ID
        fetchHeaders.user_id = process.env.MJ_USER_ID;
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
        const text = await response.text(); 
        
        try {
            // Attempt to parse JSON strictly (Ignores WAF HTML)
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
                error: "Matrix Firewall Blocked Vercel Request. (Likely expired token or Origin mismatch)", 
                details: text.substring(0, 150) 
            });
        }
    } catch (error) {
        console.error("Proxy Fetch Error:", error);
        res.json({ success: false, error: "Engine connection failed", details: error.message });
    }
});

module.exports = app;
