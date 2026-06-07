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
	const [trackingDrafts, setTrackingDrafts] = useState({});

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

	const getTracking = (order) =>
		(trackingDrafts[order._id] ?? order.trackingNumber ?? "").trim();

	const updateStatus = async (orderId, status) => {
		const order = orders.find((o) => o._id === orderId);
		if (!order) return;

		const trackingNumber = getTracking(order);

		if (status === "shipped" && !trackingNumber) {
			setExpanded(orderId);
			alert(
				"Enter a tracking number in the order details below before marking as shipped.",
			);
			return;
		}

		setUpdating(orderId);
		try {
			await api.patch(`/api/orders/${orderId}/status`, {
				status,
				trackingNumber: trackingNumber || undefined,
			});
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
											<td data-label="Date">
												{new Date(order.createdAt).toLocaleString()}
											</td>
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
														<div className="admin-order-detail-grid">
															<div className="admin-order-detail-block">
																<h4>Items</h4>
																<ul>
																	{order.items.map((item, i) => (
																		<li key={i}>
																			<span>{item.quantity}× {item.name}</span>
																			<span>{formatRsd(item.price * item.quantity)}</span>
																		</li>
																	))}
																</ul>
															</div>

															<div className="admin-order-detail-block">
																<h4>Shipping</h4>
																<dl className="admin-order-shipping">
																	<div>
																		<dt>Name</dt>
																		<dd>{order.shippingAddress.fullName}</dd>
																	</div>
																	<div>
																		<dt>Phone number</dt>
																		<dd>{order.shippingAddress.phone}</dd>
																	</div>
																	<div>
																		<dt>Shipping address</dt>
																		<dd>{order.shippingAddress.street}</dd>
																	</div>
																	<div>
																		<dt>City</dt>
																		<dd>{order.shippingAddress.city}</dd>
																	</div>
																	<div>
																		<dt>Postcode</dt>
																		<dd>{order.shippingAddress.postalCode}</dd>
																	</div>
																	<div>
																		<dt>Country</dt>
																		<dd>{order.shippingAddress.country}</dd>
																	</div>
																</dl>
															</div>

															<div className="admin-order-detail-block">
																<h4>Tracking</h4>
																<label className="admin-order-tracking">
																	<span>Tracking number</span>
																	<input
																		type="text"
																		placeholder="e.g. RS123456789"
																		value={
																			trackingDrafts[order._id] ??
																			order.trackingNumber ??
																			""
																		}
																		onChange={(e) =>
																			setTrackingDrafts((prev) => ({
																				...prev,
																				[order._id]: e.target.value,
																			}))
																		}
																	/>
																</label>
																<p className="admin-order-tracking-hint">
																	Required when status is set to{" "}
																	<strong>shipped</strong>. Customer receives
																	it by email.
																</p>
															</div>
														</div>
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
