import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api/client.js";
import { useCart } from "../context/CartContext.jsx";

const MAX_POLLS = 8;
const POLL_INTERVAL_MS = 1500;

export default function CheckoutComplete() {
	const [searchParams] = useSearchParams();
	const sessionId = searchParams.get("session_id");
	const { clearCart } = useCart();
	const cartClearedRef = useRef(false);
	const [state, setState] = useState({
		loading: true,
		status: null,
		paymentStatus: null,
		orderId: null,
		orderStatus: null,
		error: null,
	});

	useEffect(() => {
		if (!sessionId) {
			setState((s) => ({ ...s, loading: false, error: "Missing session id" }));
			return;
		}

		let cancelled = false;
		let attempts = 0;

		const poll = async () => {
			attempts += 1;
			try {
				const data = await api.get(
					`/api/checkout/session-status?session_id=${encodeURIComponent(sessionId)}`,
				);
				if (cancelled) return;

				setState({
					loading: false,
					status: data.status,
					paymentStatus: data.paymentStatus,
					orderId: data.orderId,
					orderStatus: data.orderStatus,
					error: null,
				});

				if (data.status === "complete" && data.orderStatus === "paid") {
					if (!cartClearedRef.current) {
						cartClearedRef.current = true;
						clearCart();
					}
					return;
				}

				if (data.status === "complete" && attempts < MAX_POLLS) {
					setTimeout(poll, POLL_INTERVAL_MS);
				}
			} catch (err) {
				if (cancelled) return;
				setState((s) => ({ ...s, loading: false, error: err.message }));
			}
		};

		poll();
		return () => {
			cancelled = true;
		};
	}, [sessionId, clearCart]);

	const isSuccess =
		state.status === "complete" &&
		(state.paymentStatus === "paid" || state.orderStatus === "paid");
	const isOpen = state.status === "open";
	const isExpired = state.status === "expired";

	return (
		<>
			<section id="page-header" className="about-header cart-header">
				<h2>#checkout</h2>
				<p>
					{state.loading
						? "Confirming your payment..."
						: isSuccess
							? "Thank you for your order"
							: "Payment status"}
				</p>
			</section>

			<section className="cart-page">
				<div className="cart-empty-card">
					{state.loading && <p>Verifying your payment with Stripe...</p>}

					{!state.loading && state.error && (
						<>
							<h2>Something went wrong</h2>
							<p>{state.error}</p>
							<Link to="/cart" className="normal">
								Back to cart
							</Link>
						</>
					)}

					{!state.loading && !state.error && isSuccess && (
						<>
							<i className="fa-solid fa-circle-check" aria-hidden />
							<h2>Payment successful</h2>
							<p>
								Your order has been received and is being processed.
								{state.orderId && (
									<>
										{" "}
										Reference:{" "}
										<code>{String(state.orderId).slice(-8).toUpperCase()}</code>
									</>
								)}
							</p>
							<Link to="/account" className="normal">
								View my orders
							</Link>
						</>
					)}

					{!state.loading && !state.error && !isSuccess && state.status === "complete" && (
						<>
							<h2>Payment received</h2>
							<p>
								Stripe confirmed your payment. We're finalising your order — refresh
								this page in a moment, or check your account.
							</p>
							<Link to="/account" className="normal">
								View my orders
							</Link>
						</>
					)}

					{!state.loading && !state.error && isOpen && (
						<>
							<h2>Payment not completed</h2>
							<p>It looks like your payment wasn't finished. You can try again.</p>
							<Link to="/cart" className="normal">
								Return to cart
							</Link>
						</>
					)}

					{!state.loading && !state.error && isExpired && (
						<>
							<h2>Session expired</h2>
							<p>Your checkout session expired. Please start a new one.</p>
							<Link to="/cart" className="normal">
								Return to cart
							</Link>
						</>
					)}
				</div>
			</section>
		</>
	);
}
