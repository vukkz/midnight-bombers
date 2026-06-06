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

const __dirname = dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: join(__dirname, "../.env") });

const isProd =
	process.env.NODE_ENV === "production" || Boolean(process.env.RAILWAY_ENVIRONMENT);
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
		origin: serveClient
			? true
			: process.env.CLIENT_URL || "http://localhost:5173",
		credentials: true,
	}),
);
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(join(__dirname, "../uploads")));

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
		status: "ok",
		db: mongoose.connection.name || null,
		products: productCount,
	});
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/newsletter", newsletterRoutes);

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

await connectDB();

app.listen(port, "0.0.0.0", () => {
	console.log(`Server running on port ${port} (${isProd ? "production" : "development"})`);
});
