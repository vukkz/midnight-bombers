import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./config/db.js";
import { errorHandler } from "./middleware/errorHandler.js";
import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import orderRoutes from "./routes/orders.js";
import adminRoutes from "./routes/admin.js";
import contactRoutes from "./routes/contact.js";
import newsletterRoutes from "./routes/newsletter.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const port = process.env.PORT || 5000;

app.use(
	cors({
		origin: process.env.CLIENT_URL || "http://localhost:5173",
		credentials: true,
	}),
);
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(join(__dirname, "../uploads")));

app.get("/api/health", (req, res) => {
	res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/newsletter", newsletterRoutes);

app.use(errorHandler);

app.listen(port, () => {
	console.log(`API running on http://localhost:${port}`);
});

await connectDB();
