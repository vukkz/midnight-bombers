import { getDefaultFrom, sendMail } from "./mailer.js";

function formatRsd(amount) {
	return `${Number(amount).toLocaleString("sr-RS")} RSD`;
}

function orderRef(orderId) {
	return String(orderId).slice(-8).toUpperCase();
}

const STATUS_COPY = {
	pending: {
		subject: "Order pending",
		heading: "Your order is awaiting payment",
		body: "We're waiting for payment confirmation. Once received, we'll start preparing your order.",
	},
	paid: {
		subject: "Order confirmed",
		heading: "Your order is confirmed and being packed",
		body: "We've received your payment and your items are being prepared for shipment.",
	},
	shipped: {
		subject: "Order shipped",
		heading: "Your order has been shipped",
		body: "Great news — your package is on its way. Use the tracking number below to follow delivery.",
	},
	delivered: {
		subject: "Order delivered",
		heading: "Your order has been delivered",
		body: "Your package has been delivered. We hope you enjoy your new gear!",
	},
	cancelled: {
		subject: "Order cancelled",
		heading: "Your order has been cancelled",
		body: "This order was cancelled. If you have questions, reply to this email.",
	},
};

export async function sendOrderStatusEmail(order, customerEmail) {
	if (!customerEmail) {
		console.warn("[order-email] no customer email for order", order._id);
		return;
	}

	const copy = STATUS_COPY[order.status];
	if (!copy) return;

	const ref = orderRef(order._id);
	const trackingBlock = order.trackingNumber
		? `<p style="margin-top:16px;padding:14px 16px;background:#f5f5f5;border-radius:8px;">
				<strong>Tracking number:</strong><br>
				<span style="font-size:16px;letter-spacing:0.04em;">${order.trackingNumber}</span>
		   </p>`
		: "";

	const itemsList = order.items
		.map((it) => `<li style="padding:6px 0;border-bottom:1px solid #eee;">${it.quantity}× ${it.name}</li>`)
		.join("");

	const html = `
		<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#222;">
			<h2 style="color:#000;">${copy.heading}</h2>
			<p>${copy.body}</p>
			<p><strong>Order reference:</strong> ${ref}</p>
			<p><strong>Status:</strong> ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</p>
			${trackingBlock}
			<h3 style="margin-top:24px;font-size:15px;">Items</h3>
			<ul style="list-style:none;padding:0;margin:0 0 16px;">${itemsList}</ul>
			<p><strong>Total:</strong> ${formatRsd(order.total)}</p>
			<hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
			<p style="color:#666;font-size:13px;">Questions? Reply to this email.</p>
			<p>— Midnight Bombers</p>
		</div>
	`;

	try {
		await sendMail({
			from: getDefaultFrom(),
			to: customerEmail,
			subject: `${copy.subject} #${ref} — Midnight Bombers`,
			html,
		});
	} catch (err) {
		console.error("[order-email] status update failed:", err.message);
	}
}
