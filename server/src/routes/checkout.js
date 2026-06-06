import { Router } from "express";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { protect } from "../middleware/auth.js";
import { deductLineStock, validateLineStock } from "../utils/stock.js";
import { getStripe } from "../utils/stripe.js";

const router = Router();

function withHttps(url) {
	if (!url) return url;
	return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function resolveClientUrl(req) {
	const configured = process.env.CLIENT_URL?.trim();
	if (configured && !configured.includes("localhost")) {
		return withHttps(configured);
	}
	if (process.env.RAILWAY_PUBLIC_DOMAIN) {
		return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
	}
	if (configured) return configured;
	const origin = req.get("origin") || req.get("referer");
	if (origin) {
		try {
			return new URL(origin).origin;
		} catch {
			// ignore
		}
	}
	return "http://localhost:5173";
}

function buildLineName(product, item) {
	return item.colorName
		? `${product.name} — ${item.colorName} (${item.colorCode})`
		: product.name;
}

function toAbsoluteHttpsUrl(maybeUrl, baseUrl) {
	if (!maybeUrl || typeof maybeUrl !== "string") return null;
	try {
		const resolved = new URL(maybeUrl, baseUrl);
		if (resolved.protocol !== "https:") return null;
		return resolved.toString();
	} catch {
		return null;
	}
}

router.post("/session", protect, async (req, res, next) => {
	try {
		const { items, shippingAddress } = req.body;

		if (!Array.isArray(items) || items.length === 0) {
			return res.status(400).json({ message: "Cart is empty" });
		}

		if (
			!shippingAddress?.fullName ||
			!shippingAddress?.phone ||
			!shippingAddress?.street ||
			!shippingAddress?.city ||
			!shippingAddress?.postalCode
		) {
			return res
				.status(400)
				.json({ message: "Complete shipping address is required" });
		}

		const clientUrl = resolveClientUrl(req);

		const orderItems = [];
		const lineItems = [];
		let total = 0;

		for (const item of items) {
			const product = await Product.findById(item.productId);
			if (!product) {
				return res
					.status(400)
					.json({ message: `Product not found: ${item.productId}` });
			}

			const stockError = validateLineStock(product, {
				quantity: item.quantity,
				colorCode: item.colorCode,
			});
			if (stockError) {
				return res.status(400).json({ message: stockError });
			}

			const lineName = buildLineName(product, item);
			const lineTotal = product.price * item.quantity;
			total += lineTotal;

			orderItems.push({
				product: product._id,
				name: lineName,
				image: product.image,
				price: product.price,
				quantity: item.quantity,
				colorCode: item.colorCode,
				colorName: item.colorName,
			});

			const absoluteImage = toAbsoluteHttpsUrl(product.image, clientUrl);
			const productData = { name: lineName };
			if (absoluteImage) {
				productData.images = [absoluteImage];
			}

			lineItems.push({
				price_data: {
					currency: "rsd",
					product_data: productData,
					unit_amount: Math.round(product.price * 100),
				},
				quantity: item.quantity,
			});
		}

		const order = await Order.create({
			user: req.user._id,
			items: orderItems,
			total,
			shippingAddress,
			status: "pending",
		});

		const stripe = getStripe();
		const returnUrl = `${clientUrl.replace(/\/$/, "")}/checkout/complete?session_id={CHECKOUT_SESSION_ID}`;
		try {
			new URL(returnUrl.replace("{CHECKOUT_SESSION_ID}", "test"));
		} catch {
			return res.status(500).json({
				message: `Server misconfiguration: invalid return URL "${returnUrl}". Set CLIENT_URL in Railway Variables.`,
			});
		}

		const session = await stripe.checkout.sessions.create({
			ui_mode: "embedded",
			mode: "payment",
			line_items: lineItems,
			return_url: returnUrl,
			metadata: {
				orderId: order._id.toString(),
				userId: req.user._id.toString(),
			},
			payment_intent_data: {
				metadata: {
					orderId: order._id.toString(),
					userId: req.user._id.toString(),
				},
			},
		});

		order.stripeSessionId = session.id;
		await order.save();

		res.json({ clientSecret: session.client_secret, orderId: order._id });
	} catch (err) {
		next(err);
	}
});

router.get("/session-status", protect, async (req, res, next) => {
	try {
		const { session_id: sessionId } = req.query;
		if (!sessionId) {
			return res.status(400).json({ message: "session_id is required" });
		}

		const stripe = getStripe();
		const session = await stripe.checkout.sessions.retrieve(sessionId);

		const order = await Order.findOne({ stripeSessionId: sessionId });

		res.json({
			status: session.status,
			paymentStatus: session.payment_status,
			orderId: order?._id ?? null,
			orderStatus: order?.status ?? null,
		});
	} catch (err) {
		next(err);
	}
});

async function fulfillOrder(session) {
	const orderId = session.metadata?.orderId;
	if (!orderId) {
		console.warn("[stripe] checkout.session.completed missing orderId metadata");
		return;
	}

	const order = await Order.findById(orderId);
	if (!order) {
		console.warn(`[stripe] order not found for session ${session.id}`);
		return;
	}

	if (order.status === "paid") {
		return;
	}

	for (const item of order.items) {
		const product = await Product.findById(item.product);
		if (!product) continue;
		try {
			deductLineStock(product, {
				quantity: item.quantity,
				colorCode: item.colorCode,
			});
			await product.save();
		} catch (err) {
			console.error(
				`[stripe] stock deduction failed for product ${item.product}:`,
				err.message,
			);
		}
	}

	order.status = "paid";
	order.paidAt = new Date();
	if (typeof session.payment_intent === "string") {
		order.stripePaymentIntentId = session.payment_intent;
	}
	await order.save();
}

async function cancelOrder(session) {
	const orderId = session.metadata?.orderId;
	if (!orderId) return;
	const order = await Order.findById(orderId);
	if (!order || order.status === "paid") return;
	order.status = "cancelled";
	await order.save();
}

export async function webhookHandler(req, res) {
	const signature = req.headers["stripe-signature"];
	const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

	if (!webhookSecret) {
		console.error("[stripe] STRIPE_WEBHOOK_SECRET not configured");
		return res.status(500).send("Webhook secret not configured");
	}

	let event;
	try {
		const stripe = getStripe();
		event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
	} catch (err) {
		console.error("[stripe] webhook signature verification failed:", err.message);
		return res.status(400).send(`Webhook Error: ${err.message}`);
	}

	try {
		switch (event.type) {
			case "checkout.session.completed":
			case "checkout.session.async_payment_succeeded":
				await fulfillOrder(event.data.object);
				break;
			case "checkout.session.expired":
			case "checkout.session.async_payment_failed":
				await cancelOrder(event.data.object);
				break;
			default:
				break;
		}
	} catch (err) {
		console.error(`[stripe] handler failed for ${event.type}:`, err);
		return res.status(500).send("Webhook handler error");
	}

	res.json({ received: true });
}

export default router;
