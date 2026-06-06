import Stripe from "stripe";

let stripeClient = null;

export function getStripe() {
	if (stripeClient) return stripeClient;

	const key = process.env.STRIPE_SECRET_KEY;
	if (!key) {
		throw new Error(
			"STRIPE_SECRET_KEY is not set. Add it to server/.env or Railway Variables.",
		);
	}

	stripeClient = new Stripe(key, {
		apiVersion: "2024-12-18.acacia",
		appInfo: { name: "midnight-bombers", version: "1.0.0" },
	});

	return stripeClient;
}
