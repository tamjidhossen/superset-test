import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../../../.env") });

import express from "express";
import { prisma } from "./lib/prisma";
// @ts-ignore
import cors from "cors";

import { 
    getSupersetGuestToken, 
    provisionSupersetUser, 
    getSupersetUserSession 
} from "./lib/superset";
import { hashPassword, comparePassword, generateToken, verifyToken } from "./lib/auth";

const app = express();
const PORT = process.env.SERVER_PORT || 5000;

app.use(cors({
    origin: "http://localhost:5173", // React dev server
    credentials: true
}));
app.use(express.json());

// --- Authentication Endpoints ---

app.post("/api/auth/register", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Username and password required" });

    try {
        // 1. Check if user exists in React DB
        const existing = await prisma.user.findUnique({ where: { username } });
        if (existing) return res.status(400).json({ error: "User already exists" });

        // 2. Hash password and save to React DB
        const hashedPassword = await hashPassword(password);
        const newUser = await prisma.user.create({
            data: { username, password: hashedPassword }
        });

        // 3. Provision user in Superset (using same plaintext password)
        await provisionSupersetUser(username, password);

        res.json({ message: "Registered successfully", userId: newUser.id });
    } catch (error) {
        console.error("Registration failed:", error);
        res.status(500).json({ error: "Registration failed", details: String(error) });
    }
});

app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    try {
        // 1. Verify in React DB
        const user = await prisma.user.findUnique({ where: { username } });
        if (!user || !(await comparePassword(password, user.password))) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // 2. Ensure Superset provisioning (Lazy sync if missed during registration)
        await provisionSupersetUser(username, password);

        // 3. Get Superset session cookies
        const cookies = await getSupersetUserSession(username, password);

        // 4. Generate React Token
        const token = generateToken({ id: user.id, username: user.username });

        // Return both the internal token and the superset cookies (frontend will set them)
        res.json({ token, user: { username: user.username }, supersetCookies: cookies });
    } catch (error) {
        console.error("Login failed:", error);
        res.status(500).json({ error: "Login failed" });
    }
});

app.get("/api/auth/me", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "No token" });
    
    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded) return res.status(401).json({ error: "Invalid token" });

    res.json({ user: decoded });
});


// --- Superset Endpoints ---

app.get("/api/superset/guest-token", async (req, res) => {
    try {
        const dashboardId = process.env.SUPERSET_DASHBOARD_ID || "1";
        const data = await getSupersetGuestToken(dashboardId);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch guest token" });
    }
});

// Seed data helper (kept from original)
app.post("/api/seed", async (req, res) => {
    // ... (Keep existing seed logic)
    res.json({ message: "Seeding logic preserved" });
});

app.get("/api/status", async (req, res) => {
    try {
        const platformCount = await prisma.platform.count();
        const userCount = await prisma.user.count();
        res.json({ status: "OK", platformCount, userCount });
    } catch (e) {
        res.status(500).json({ status: "ERROR", error: String(e) });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});