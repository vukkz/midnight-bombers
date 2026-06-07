import { Router } from "express";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { protect, requireAdmin } from "../middleware/auth.js";
import { deductLineStock, validateLineStock } from "../utils/stock.js";
import { sendOrderStatusEmail } from "../utils/orderEmails.js";

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

			const stockError = validateLineStock(product, {
				quantity: item.quantity,
				colorCode: item.colorCode,
			});
			if (stockError) {
				return res.status(400).json({ message: stockError });
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

			deductLineStock(product, {
				quantity: item.quantity,
				colorCode: item.colorCode,
			});
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

const ORDER_STATUSES = ["pending", "paid", "shipped", "delivered", "cancelled"];

router.patch("/:id/status", protect, requireAdmin, async (req, res, next) => {
	try {
		const { status, trackingNumber } = req.body;
		if (!ORDER_STATUSES.includes(status)) {
			return res.status(400).json({ message: "Invalid order status" });
		}

		const order = await Order.findById(req.params.id).populate("user", "name email");
		if (!order) {
			return res.status(404).json({ message: "Order not found" });
		}

		const previousStatus = order.status;
		const nextTracking =
			typeof trackingNumber === "string" && trackingNumber.trim()
				? trackingNumber.trim()
				: order.trackingNumber;

		if (status === "shipped" && !nextTracking) {
			return res.status(400).json({
				message: "Tracking number is required when marking an order as shipped",
			});
		}

		if (nextTracking) {
			order.trackingNumber = nextTracking;
		}

		order.status = status;
		await order.save();

		if (previousStatus !== status && order.user?.email) {
			await sendOrderStatusEmail(order, order.user.email);
		}

		res.json({ order });
	} catch (err) {
		next(err);
	}
});

export default router;
