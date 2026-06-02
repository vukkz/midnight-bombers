import { Router } from "express";
import multer from "multer";
import { mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { Product } from "../models/Product.js";
import { Order } from "../models/Order.js";
import { User } from "../models/User.js";
import { protect, requireAdmin } from "../middleware/auth.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const uploadsDir = join(__dirname, "../../uploads/products");
mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
	destination: (_req, _file, cb) => cb(null, uploadsDir),
	filename: (_req, file, cb) => {
		const ext = file.originalname.match(/\.[a-zA-Z0-9]+$/)?.[0] || ".jpg";
		const safe = file.originalname
			.replace(/\.[a-zA-Z0-9]+$/, "")
			.replace(/[^a-zA-Z0-9-_]/g, "-")
			.slice(0, 40);
		cb(null, `${Date.now()}-${safe}${ext.toLowerCase()}`);
	},
});

const upload = multer({
	storage,
	limits: { fileSize: 5 * 1024 * 1024 },
	fileFilter: (_req, file, cb) => {
		if (file.mimetype.startsWith("image/")) cb(null, true);
		else cb(new Error("Only image files are allowed"));
	},
});

const router = Router();
router.use(protect, requireAdmin);

router.get("/stats", async (_req, res, next) => {
	try {
		const [
			revenueAgg,
			orderCounts,
			totalUsers,
			totalProducts,
			lowStockCount,
			lowStockProducts,
			recentOrders,
		] = await Promise.all([
			Order.aggregate([
				{ $match: { status: { $ne: "cancelled" } } },
				{ $group: { _id: null, total: { $sum: "$total" } } },
			]),
			Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
			User.countDocuments(),
			Product.countDocuments(),
			Product.countDocuments({ stock: { $lte: 5 } }),
			Product.find({ stock: { $lte: 5 } })
				.sort({ stock: 1 })
				.limit(10)
				.select("name stock category brand"),
			Order.find()
				.populate("user", "name email")
				.sort({ createdAt: -1 })
				.limit(5),
		]);

		const statusCounts = {
			pending: 0,
			paid: 0,
			shipped: 0,
			delivered: 0,
			cancelled: 0,
		};
		for (const row of orderCounts) {
			if (row._id in statusCounts) statusCounts[row._id] = row.count;
		}

		const totalOrders = Object.values(statusCounts).reduce((a, b) => a + b, 0);

		res.json({
			revenue: revenueAgg[0]?.total ?? 0,
			totalOrders,
			statusCounts,
			totalUsers,
			totalProducts,
			lowStockCount,
			lowStockProducts,
			recentOrders,
		});
	} catch (err) {
		next(err);
	}
});

router.get("/products", async (_req, res, next) => {
	try {
		const products = await Product.find().sort({ createdAt: -1 });
		res.json({ products });
	} catch (err) {
		next(err);
	}
});

router.get("/users", async (_req, res, next) => {
	try {
		const users = await User.find()
			.select("name email role createdAt")
			.sort({ createdAt: -1 });
		res.json({ users });
	} catch (err) {
		next(err);
	}
});

router.patch("/users/:id/role", async (req, res, next) => {
	try {
		const { role } = req.body;
		if (!["customer", "admin"].includes(role)) {
			return res.status(400).json({ message: "Invalid role" });
		}
		if (req.params.id === String(req.user._id)) {
			return res.status(400).json({ message: "You cannot change your own role" });
		}

		const user = await User.findByIdAndUpdate(
			req.params.id,
			{ role },
			{ new: true, runValidators: true },
		).select("name email role createdAt");

		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		res.json({ user });
	} catch (err) {
		next(err);
	}
});

router.delete("/users/:id", async (req, res, next) => {
	try {
		if (req.params.id === String(req.user._id)) {
			return res.status(400).json({ message: "You cannot delete your own account" });
		}

		const user = await User.findByIdAndDelete(req.params.id);
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		res.json({ message: "User deleted" });
	} catch (err) {
		next(err);
	}
});

router.post("/upload", (req, res, next) => {
	upload.single("image")(req, res, (err) => {
		if (err) {
			return res.status(400).json({ message: err.message || "Upload failed" });
		}
		if (!req.file) {
			return res.status(400).json({ message: "No file uploaded" });
		}
		res.json({ url: `/uploads/products/${req.file.filename}` });
	});
});

export default router;
