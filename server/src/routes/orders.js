import { Router } from "express";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { protect, requireAdmin } from "../middleware/auth.js";

const router = Router();

router.post("/", protect, async (req, res, next) => {
	try {
		const { items, shippingAddress } = req.body;

		if (!Array.isArray(items) || items.length === 0) {
			return res.status(400).json({ message: "Cart is empty" });
		}

		if (!shippingAddress?.fullName || !shippingAddress?.phone || !shippingAddress?.street || !shippingAddress?.city || !shippingAddress?.postalCode) {
			return res.status(400).json({ message: "Complete shipping address is required" });
		}

		const orderItems = [];
		let total = 0;

		for (const item of items) {
			const product = await Product.findById(item.productId);
			if (!product) {
				return res.status(400).json({ message: `Product not found: ${item.productId}` });
			}
			if (product.stock < item.quantity) {
				return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
			}

			const lineTotal = product.price * item.quantity;
			total += lineTotal;

			const lineName = item.colorName
				? `${product.name} — ${item.colorName} (${item.colorCode})`
				: product.name;

			orderItems.push({
				product: product._id,
				name: lineName,
				image: product.image,
				price: product.price,
				quantity: item.quantity,
				colorCode: item.colorCode,
				colorName: item.colorName,
			});

			product.stock -= item.quantity;
			await product.save();
		}

		const order = await Order.create({
			user: req.user._id,
			items: orderItems,
			total,
			shippingAddress,
		});

		res.status(201).json({ order });
	} catch (err) {
		next(err);
	}
});

router.get("/my", protect, async (req, res, next) => {
	try {
		const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
		res.json({ orders });
	} catch (err) {
		next(err);
	}
});

router.get("/", protect, requireAdmin, async (req, res, next) => {
	try {
		const orders = await Order.find()
			.populate("user", "name email")
			.sort({ createdAt: -1 });
		res.json({ orders });
	} catch (err) {
		next(err);
	}
});

export default router;
