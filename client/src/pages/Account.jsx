import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";

const STATUS_LABELS = {
	pending: "Pending",
	paid: "Paid",
	shipped: "Shipped",
	delivered: "Delivered",
	cancelled: "Cancelled",
};

function formatRsd(amount) {
	return `${Number(amount).toLocaleString("sr-RS")} RSD`;
}

function formatDate(iso) {
	return new Date(iso).toLocaleDateString("sr-RS", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}

function orderRef(id) {
	return String(id).slice(-8).toUpperCase();
}

export default function Account() {
	const { user, loading } = useAuth();
	const [orders, setOrders] = useState([]);
	const [ordersLoading, setOrdersLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		if (!user) return;
		setOrdersLoading(true);
		api
			.get("/api/orders/my")
			.then((data) => {
				setOrders(data.orders);
				setError("");
			})
			.catch((err) => setError(err.message))
			.finally(() => setOrdersLoading(false));
	}, [user]);

	if (loading) {
		return (
			<section className="account-page account-page--loading">
				<LoadingSpinner message="Loading your account..." />
			</section>
		);
	}

	if (!user) return <Navigate to="/login" replace />;

	const firstName = user.name.split(" ")[0];

	return (
		<>
			<section id="page-header" className="about-header cart-header">
				<h2>#account</h2>
				<p>Manage your profile and order history</p>
			</section>

			<section className="account-page">
				<div className="account-layout">
					<aside className="account-profile-card">
						<div className="account-avatar" aria-hidden>
							{user.name.charAt(0).toUpperCase()}
						</div>
						<h2>Hello, {firstName}</h2>
						<p className="account-email">{user.email}</p>
						<div className="account-profile-actions">
							<Link to="/shop" className="normal account-shop-btn">
								Continue shopping
							</Link>
							{user.role === "admin" && (
								<Link to="/admin" className="account-admin-link">
									Admin dashboard →
								</Link>
							)}
						</div>
					</aside>

					<div className="account-orders-panel">
						<div className="account-orders-header">
							<h3>Your orders</h3>
							{orders.length > 0 && (
								<span className="account-orders-count">
									{orders.length} order{orders.length !== 1 ? "s" : ""}
								</span>
							)}
						</div>

						{error && <p className="form-error">{error}</p>}

						{ordersLoading ? (
							<div className="account-orders-loading">
								<LoadingSpinner message="Loading orders..." />
							</div>
						) : orders.length === 0 ? (
							<div className="account-empty-orders">
								<i className="fa-solid fa-box-open" aria-hidden />
								<h4>No orders yet</h4>
								<p>When you place an order, it will show up here.</p>
								<Link to="/shop" className="normal">
									Browse the shop
								</Link>
							</div>
						) : (
							<ul className="account-order-list">
								{orders.map((order) => (
									<li key={order._id} className="account-order-card">
										<div className="account-order-top">
											<div>
												<span className="account-order-ref">
													#{orderRef(order._id)}
												</span>
												<span className="account-order-date">
													{formatDate(order.createdAt)}
												</span>
											</div>
											<span
												className={`account-order-status account-order-status--${order.status}`}
											>
												{STATUS_LABELS[order.status] || order.status}
											</span>
										</div>

										<ul className="account-order-items">
											{order.items.map((item, idx) => (
												<li key={`${order._id}-${idx}`}>
													<span className="account-order-item-name">
														{item.name}
													</span>
													<span className="account-order-item-qty">
														×{item.quantity}
													</span>
												</li>
											))}
										</ul>

										{order.shippingAddress && (
											<p className="account-order-shipping">
												<i className="fa-solid fa-location-dot" aria-hidden />
												{order.shippingAddress.city},{" "}
												{order.shippingAddress.country || "Serbia"}
											</p>
										)}

										<div className="account-order-footer">
											<span className="account-order-total">
												{formatRsd(order.total)}
											</span>
											<span className="account-order-item-count">
												{order.items.length} item
												{order.items.length !== 1 ? "s" : ""}
											</span>
										</div>
									</li>
								))}
							</ul>
						)}
					</div>
				</div>
			</section>
		</>
	);
}
