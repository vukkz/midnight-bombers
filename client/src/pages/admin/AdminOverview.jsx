import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client.js";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";

function formatRsd(n) {
	return `${Number(n).toLocaleString("sr-RS")} RSD`;
}

export default function AdminOverview() {
	const [stats, setStats] = useState(null);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		api
			.get("/api/admin/stats")
			.then(setStats)
			.catch((err) => setError(err.message))
			.finally(() => setLoading(false));
	}, []);

	if (loading) return <LoadingSpinner message="Loading dashboard..." />;
	if (error) return <p className="form-error">{error}</p>;
	if (!stats) return null;

	const { statusCounts } = stats;

	return (
		<>
			<h1 className="admin-page-title">Overview</h1>

			<div className="admin-metrics">
				<div className="admin-metric-card">
					<h3>Total revenue</h3>
					<p className="value pink">{formatRsd(stats.revenue)}</p>
					<p className="sub">Excludes cancelled orders</p>
				</div>
				<div className="admin-metric-card">
					<h3>Orders</h3>
					<p className="value">{stats.totalOrders}</p>
					<p className="sub">
						{statusCounts.pending} pending · {statusCounts.paid} paid
					</p>
				</div>
				<div className="admin-metric-card">
					<h3>Users</h3>
					<p className="value">{stats.totalUsers}</p>
				</div>
				<div className="admin-metric-card">
					<h3>Products</h3>
					<p className="value">{stats.totalProducts}</p>
					<p className="sub">
						{stats.lowStockCount > 0 ? (
							<span className="admin-badge low-stock">
								{stats.lowStockCount} low stock
							</span>
						) : (
							"Stock OK"
						)}
					</p>
				</div>
			</div>

			<div className="admin-metrics">
				<div className="admin-metric-card">
					<h3>Pending</h3>
					<p className="value">{statusCounts.pending}</p>
				</div>
				<div className="admin-metric-card">
					<h3>Paid</h3>
					<p className="value">{statusCounts.paid}</p>
				</div>
				<div className="admin-metric-card">
					<h3>Shipped</h3>
					<p className="value">{statusCounts.shipped}</p>
				</div>
				<div className="admin-metric-card">
					<h3>Delivered</h3>
					<p className="value">{statusCounts.delivered}</p>
				</div>
			</div>

			{stats.lowStockProducts?.length > 0 && (
				<div className="admin-panel">
					<h2>Low stock alert</h2>
					<div className="admin-table-wrap">
						<table className="admin-table admin-table--stack">
							<thead>
								<tr>
									<th>Product</th>
									<th>Color</th>
									<th>Stock</th>
								</tr>
							</thead>
							<tbody>
								{stats.lowStockProducts.map((row) => (
									<tr key={`${row.productId}-${row.colorCode || "product"}`}>
										<td data-label="Product">{row.productName}</td>
										<td data-label="Color">
											{row.type === "color"
												? `${row.colorName} (${row.colorCode})`
												: row.category || "—"}
										</td>
										<td data-label="Stock">
											<span className="admin-badge low-stock">{row.stock}</span>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
					<p style={{ marginTop: 12 }}>
						<Link to="/admin/inventory">Manage inventory →</Link>
					</p>
				</div>
			)}

			<div className="admin-panel">
				<h2>Recent orders</h2>
				{stats.recentOrders?.length === 0 ? (
					<p className="admin-empty">No orders yet.</p>
				) : (
					<div className="admin-table-wrap">
						<table className="admin-table admin-table--stack">
							<thead>
								<tr>
									<th>Order</th>
									<th>Customer</th>
									<th>Total</th>
									<th>Status</th>
									<th>Date</th>
								</tr>
							</thead>
							<tbody>
								{stats.recentOrders.map((order) => (
									<tr key={order._id}>
										<td data-label="Order">#{order._id.slice(-6)}</td>
										<td data-label="Customer">
											{order.user?.name || "—"}
											<br />
											<small>{order.user?.email}</small>
										</td>
										<td data-label="Total">{formatRsd(order.total)}</td>
										<td data-label="Status">
											<span className={`admin-badge ${order.status}`}>
												{order.status}
											</span>
										</td>
										<td data-label="Date">{new Date(order.createdAt).toLocaleDateString()}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
				<p style={{ marginTop: 12 }}>
					<Link to="/admin/orders">View all orders →</Link>
				</p>
			</div>
		</>
	);
}
