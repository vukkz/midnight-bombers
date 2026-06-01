import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Account() {
	const { user, loading } = useAuth();
	const [orders, setOrders] = useState([]);
	const [error, setError] = useState("");

	useEffect(() => {
		if (!user) return;
		api
			.get("/api/orders/my")
			.then((data) => setOrders(data.orders))
			.catch((err) => setError(err.message));
	}, [user]);

	if (loading) return <section className="section-p1">Loading...</section>;
	if (!user) return <Navigate to="/login" replace />;

	return (
		<section className="section-p1 account-page">
			<h2>Hello, {user.name}</h2>
			<p>
				Email: {user.email} · Role: {user.role}
			</p>

			<h3>Your orders</h3>
			{error && <p className="form-error">{error}</p>}
			{orders.length === 0 ? (
				<p>No orders yet. <Link to="/shop">Start shopping</Link></p>
			) : (
				<ul className="order-list">
					{orders.map((order) => (
						<li key={order._id}>
							<strong>#{order._id.slice(-6)}</strong> — {order.status} — {order.total}{" "}
							RSD — {new Date(order.createdAt).toLocaleDateString()}
						</li>
					))}
				</ul>
			)}
		</section>
	);
}
