import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";

export default function Cart() {
	const { items, updateQuantity, removeItem, total } = useCart();
	const { user } = useAuth();
	const navigate = useNavigate();
	const [submitting, setSubmitting] = useState(false);
	const [message, setMessage] = useState("");
	const [address, setAddress] = useState({
		fullName: "",
		phone: "",
		street: "",
		city: "",
		postalCode: "",
		country: "Serbia",
	});

	const handleCheckout = async (e) => {
		e.preventDefault();
		if (!user) {
			navigate("/login", { state: { from: "/cart" } });
			return;
		}

		setSubmitting(true);
		setMessage("");
		try {
			const { clientSecret, orderId } = await api.post("/api/checkout/session", {
				items: items.map((i) => ({
					productId: i.productId,
					quantity: i.quantity,
					colorCode: i.colorCode,
					colorName: i.colorName,
				})),
				shippingAddress: address,
			});

			if (!clientSecret) {
				throw new Error("Could not start payment session");
			}

			navigate("/checkout", { state: { clientSecret, orderId } });
		} catch (err) {
			setMessage(err.message);
		} finally {
			setSubmitting(false);
		}
	};

	if (items.length === 0) {
		return (
			<>
				<section id="page-header" className="about-header cart-header">
					<h2>#cart</h2>
					<p>Your bag is waiting to be filled</p>
				</section>
				<section className="cart-page cart-empty">
					<div className="cart-empty-card">
						<i className="fa-solid fa-bag-shopping" aria-hidden />
						<h2>Your cart is empty</h2>
						<p>Add spray cans, markers, or caps from the shop.</p>
						<Link to="/shop" className="normal">
							Continue shopping
						</Link>
					</div>
				</section>
			</>
		);
	}

	return (
		<>
			<section id="page-header" className="about-header cart-header">
				<h2>#cart</h2>
				<p>
					{items.length} item{items.length !== 1 ? "s" : ""} in your bag
				</p>
			</section>

			<section className="cart-page">
				<div className="cart-layout">
					<div className="cart-items-panel">
						<ul className="cart-item-list">
							{items.map((item) => (
								<li key={item.cartKey || item.productId} className="cart-item">
									<Link to={`/product/${item.productId}`} className="cart-item-image">
										<img src={item.image} alt={item.name} />
									</Link>
									<div className="cart-item-body">
										<div className="cart-item-top">
											<Link to={`/product/${item.productId}`} className="cart-item-name">
												{item.name}
												{item.colorCode && (
													<span className="cart-item-color-tag">{item.colorCode}</span>
												)}
											</Link>
											<button
												type="button"
												className="cart-remove"
												onClick={() => removeItem(item.cartKey || item.productId)}
												aria-label={`Remove ${item.name} from cart`}
											>
												<i className="fa-solid fa-xmark" aria-hidden />
											</button>
										</div>
										<div className="cart-item-meta">
											<span className="cart-item-price">{item.price} RSD</span>
											<div className="cart-qty">
												<label htmlFor={`qty-${item.cartKey}`}>Qty</label>
												<input
													id={`qty-${item.cartKey}`}
													type="number"
													min={1}
													value={item.quantity}
													onChange={(e) =>
														updateQuantity(
															item.cartKey || item.productId,
															Number(e.target.value),
														)
													}
												/>
											</div>
											<span className="cart-item-subtotal">
												{item.price * item.quantity} RSD
											</span>
										</div>
									</div>
								</li>
							))}
						</ul>
					</div>

					<aside className="cart-checkout-panel">
						<div className="cart-summary">
							<h3>Order summary</h3>
							<div className="cart-summary-row">
								<span>Subtotal</span>
								<span>{total} RSD</span>
							</div>
							<div className="cart-summary-row cart-summary-total">
								<span>Total</span>
								<span>{total} RSD</span>
							</div>
						</div>

						<form className="checkout-form" onSubmit={handleCheckout}>
							<h3>Shipping address</h3>
							<input
								placeholder="Full name"
								value={address.fullName}
								onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
								required
							/>
							<input
								placeholder="Phone"
								value={address.phone}
								onChange={(e) => setAddress({ ...address, phone: e.target.value })}
								required
							/>
							<input
								placeholder="Street"
								value={address.street}
								onChange={(e) => setAddress({ ...address, street: e.target.value })}
								required
							/>
							<input
								placeholder="City"
								value={address.city}
								onChange={(e) => setAddress({ ...address, city: e.target.value })}
								required
							/>
							<input
								placeholder="Postal code"
								value={address.postalCode}
								onChange={(e) =>
									setAddress({ ...address, postalCode: e.target.value })
								}
								required
							/>
							{message && (
								<p
									className={
										message.includes("success") ? "form-success" : "form-error"
									}
								>
									{message}
								</p>
							)}
							<button type="submit" className="normal cart-checkout-btn" disabled={submitting}>
								{user
									? submitting
										? "Starting payment..."
										: "Continue to payment"
									: "Sign in to checkout"}
							</button>
							{!user && (
								<p className="cart-login-hint">
									<Link to="/login" state={{ from: "/cart" }}>
										Sign in
									</Link>{" "}
									or{" "}
									<Link to="/register">create an account</Link> to complete your order.
								</p>
							)}
						</form>
					</aside>
				</div>
			</section>
		</>
	);
}
