import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";
import mongoose from "mongoose";
import { connectDB } from "./config/db.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { Product } from "./models/Product.js";
import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import orderRoutes from "./routes/orders.js";
import adminRoutes from "./routes/admin.js";
import contactRoutes from "./routes/contact.js";
import newsletterRoutes from "./routes/newsletter.js";
import checkoutRoutes, { webhookHandler } from "./routes/checkout.js";
import galleryRoutes from "./routes/gallery.js";
import { verifyMailer } from "./utils/mailer.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: join(__dirname, "../.env") });

const isProd =
	process.env.NODE_ENV === "production" || Boolean(process.env.RAILWAY_ENVIRONMENT);

function withHttps(url) {
	if (!url) return url;
	return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function resolveClientUrl() {
	const configured = process.env.CLIENT_URL?.trim();
	if (configured && !configured.includes("localhost")) {
		return withHttps(configured);
	}
	if (process.env.RAILWAY_PUBLIC_DOMAIN) {
		return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
	}
	return configured || "http://localhost:5173";
}

const clientUrl = resolveClientUrl();
const app = express();
const port = process.env.PORT || 5000;

function resolveClientDist() {
	const candidates = [
		join(__dirname, "../../client/dist"),
		join(process.cwd(), "client/dist"),
		join(process.cwd(), "../client/dist"),
	];
	return candidates.find((p) => existsSync(join(p, "index.html")));
}

const clientDist = resolveClientDist();
const serveClient = isProd && Boolean(clientDist);

if (isProd) {
	app.set("trust proxy", 1);
}

app.use(
	cors({
		origin: serveClient ? true : clientUrl,
		credentials: true,
	}),
);

app.post(
	"/api/checkout/webhook",
	express.raw({ type: "application/json" }),
	webhookHandler,
);

app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(join(__dirname, "../uploads")));

function mongoState() {
	const states = ["disconnected", "connected", "connecting", "disconnecting"];
	return states[mongoose.connection.readyState] || "unknown";
}

app.get("/api/health", async (_req, res) => {
	let productCount = null;
	try {
		if (mongoose.connection.readyState === 1) {
			productCount = await Product.countDocuments();
		}
	} catch {
		productCount = -1;
	}

	res.json({
		status: mongoose.connection.readyState === 1 ? "ok" : "degraded",
		mongo: mongoState(),
		db: mongoose.connection.name || null,
		products: productCount,
		version: process.env.RAILWAY_GIT_COMMIT_SHA?.slice(0, 7) || "local",
	});
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/gallery", galleryRoutes);

if (serveClient) {
	app.use(express.static(clientDist));
	app.get(/^(?!\/api\/).*/, (_req, res) => {
		res.sendFile(join(clientDist, "index.html"));
	});
	console.log("Serving client from", clientDist);
} else if (isProd) {
	console.warn("Production mode but client/dist not found — API only");
}

app.use(errorHandler);

app.listen(port, "0.0.0.0", () => {
	console.log(`Server running on port ${port} (${isProd ? "production" : "development"})`);
	console.log(`Client URL: ${clientUrl}`);
	if (serveClient) {
		console.log(`App URL: ${clientUrl}`);
	}
});

connectDB()
	.then(() => console.log("MongoDB ready"))
	.catch((err) => {
		console.error("MongoDB connection failed:", err.message);
		console.error("Set MONGODB_URI in Railway Variables and redeploy.");
	});

verifyMailer().catch((err) => {
	console.error("[mailer] verify threw:", err.message);
});
