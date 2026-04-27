import dotenv from "dotenv";
dotenv.config(); // MUST be first

import express from "express";
import cors from "cors";
import helmet from "helmet";

import authRoutes from "./routes/auth.js";
import botsRoutes from "./routes/bots.js";
import chatRoutes from "./routes/chat.js";

const app = express();

// -----------------------------
// CORS MUST BE FIRST
// -----------------------------
app.use(
  cors({
    origin: [
      "https://supportbot-frontend.vercel.app",
      "http://localhost:5173"
    ],
    credentials: true
  })
);

// Allow OPTIONS preflight
app.options("*", cors());

// -----------------------------
// Security
// -----------------------------
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);

// -----------------------------
// Body parser
// -----------------------------
app.use(express.json());

// -----------------------------
// Routes
// -----------------------------
app.use("/api/auth", authRoutes);
app.use("/api/bots", botsRoutes);   // embed route lives here
app.use("/api/chat", chatRoutes);

// -----------------------------
// Root test route
// -----------------------------
app.get("/", (req, res) => {
  res.json({ message: "SupportBot API running" });
});

// -----------------------------
// Start server
// -----------------------------
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
