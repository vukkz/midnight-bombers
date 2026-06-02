import { Fragment, useCallback, useEffect, useState } from "react";
import { api } from "../../api/client.js";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";

const STATUSES = ["all", "pending", "paid", "shipped", "delivered", "cancelled"];
const STATUS_OPTIONS = ["pending", "paid", "shipped", "delivered", "cancelled"];

function formatRsd(n) {
	return `${Number(n).toLocaleString("sr-RS")} RSD`;
}

export default function AdminOrders() {
	const [orders, setOrders] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [filter, setFilter] = useState("all");
	const [expanded, setExpanded] = useState(null);
	const [updating, setUpdating] = useState(null);

	const load = useCallback(async () => {
		setLoading(true);
		try {
			const data = await api.get("/api/orders");
			setOrders(data.orders);
			setError("");
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		load();
	}, [load]);

	const filtered =
		filter === "all" ? orders : orders.filter((o) => o.status === filter);

	const updateStatus = async (orderId, status) => {
		setUpdating(orderId);
		try {
			await api.patch(`/api/orders/${orderId}/status`, { status });
			load();
		} catch (err) {
			alert(err.message);
		} finally {
			setUpdating(null);
		}
	};

	return (
		<>
			<h1 className="admin-page-title">Orders</h1>

			<div className="admin-tabs" style={{ marginBottom: 20 }}>
				{STATUSES.map((s) => (
					<button
						key={s}
						type="button"
						className={`admin-tab${filter === s ? " active" : ""}`}
						onClick={() => setFilter(s)}
					>
						{s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
						{s !== "all" &&
							` (${orders.filter((o) => o.status === s).length})`}
					</button>
				))}
			</div>

			{error && <p className="form-error">{error}</p>}
			{loading ? (
				<LoadingSpinner message="Loading orders..." />
			) : filtered.length === 0 ? (
				<p className="admin-empty">No orders in this category.</p>
			) : (
				<div className="admin-panel">
					<div className="admin-table-wrap">
						<table className="admin-table admin-table--stack">
							<thead>
								<tr>
									<th>Order</th>
									<th>Customer</th>
									<th>Total</th>
									<th>Status</th>
									<th>Date</th>
									<th>Details</th>
								</tr>
							</thead>
							<tbody>
								{filtered.map((order) => (
									<Fragment key={order._id}>
										<tr>
											<td data-label="Order">#{order._id.slice(-6)}</td>
											<td data-label="Customer">
												{order.user?.name}
												<br />
												<small>{order.user?.email}</small>
											</td>
											<td data-label="Total">{formatRsd(order.total)}</td>
											<td data-label="Status">
												<select
													className="admin-select status-select"
													value={order.status}
													disabled={updating === order._id}
													onChange={(e) =>
														updateStatus(order._id, e.target.value)
													}
												>
													{STATUS_OPTIONS.map((s) => (
														<option key={s} value={s}>
															{s}
														</option>
													))}
												</select>
											</td>
											<td data-label="Date">{new Date(order.createdAt).toLocaleString()}</td>
											<td data-label="Details">
												<button
													type="button"
													className="admin-btn sm"
													onClick={() =>
														setExpanded(
															expanded === order._id ? null : order._id,
														)
													}
												>
													{expanded === order._id ? "Hide" : "Show"}
												</button>
											</td>
										</tr>
										{expanded === order._id && (
											<tr>
												<td colSpan={6}>
													<div className="admin-order-detail">
														<h4>Items</h4>
														<ul>
															{order.items.map((item, i) => (
																<li key={i}>
																	{item.quantity}× {item.name} —{" "}
																	{formatRsd(item.price * item.quantity)}
																</li>
															))}
														</ul>
														<h4>Shipping</h4>
														<p>{order.shippingAddress.fullName}</p>
														<p>{order.shippingAddress.phone}</p>
														<p>
															{order.shippingAddress.street},{" "}
															{order.shippingAddress.city}{" "}
															{order.shippingAddress.postalCode}
														</p>
														<p>{order.shippingAddress.country}</p>
													</div>
												</td>
											</tr>
										)}
									</Fragment>
								))}
							</tbody>
						</table>
					</div>
				</div>
			)}
		</>
	);
}
