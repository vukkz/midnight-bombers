import { useEffect, useMemo } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import {
	EmbeddedCheckout,
	EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

export default function Checkout() {
	const location = useLocation();
	const clientSecret = location.state?.clientSecret;

	useEffect(() => {
		if (!publishableKey) {
			console.error(
				"VITE_STRIPE_PUBLISHABLE_KEY is not set — embedded checkout cannot load.",
			);
		}
	}, []);

	const options = useMemo(
		() => (clientSecret ? { clientSecret } : null),
		[clientSecret],
	);

	if (!clientSecret) {
		return <Navigate to="/cart" replace />;
	}

	if (!stripePromise) {
		return (
			<section className="cart-page">
				<div className="cart-empty-card">
					<h2>Payment unavailable</h2>
					<p>
						Stripe is not configured. Please set <code>VITE_STRIPE_PUBLISHABLE_KEY</code>
						and try again.
					</p>
					<Link to="/cart" className="normal">
						Back to cart
					</Link>
				</div>
			</section>
		);
	}

	return (
		<>
			<section id="page-header" className="about-header cart-header">
				<h2>#checkout</h2>
				<p>Complete your payment securely with Stripe</p>
			</section>

			<section className="cart-page">
				<div className="checkout-stripe-wrapper">
					<EmbeddedCheckoutProvider stripe={stripePromise} options={options}>
						<EmbeddedCheckout />
					</EmbeddedCheckoutProvider>
				</div>
			</section>
		</>
	);
}
