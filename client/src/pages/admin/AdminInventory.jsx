import { useCallback, useEffect, useState } from "react";
import { api } from "../../api/client.js";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";

const LOW_STOCK = 5;

export default function AdminInventory() {
	const [products, setProducts] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [drafts, setDrafts] = useState({});
	const [savingId, setSavingId] = useState(null);

	const load = useCallback(async () => {
		setLoading(true);
		try {
			const data = await api.get("/api/admin/products");
			setProducts(data.products);
			const initial = {};
			for (const p of data.products) initial[p._id] = String(p.stock);
			setDrafts(initial);
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

	const saveStock = async (product) => {
		const stock = parseInt(drafts[product._id], 10);
		if (Number.isNaN(stock) || stock < 0) {
			alert("Enter a valid stock number");
			return;
		}
		setSavingId(product._id);
		try {
			await api.put(`/api/products/${product._id}`, { stock });
			load();
		} catch (err) {
			alert(err.message);
		} finally {
			setSavingId(null);
		}
	};

	const lowCount = products.filter((p) => p.stock <= LOW_STOCK).length;

	return (
		<>
			<h1 className="admin-page-title">Inventory</h1>
			{lowCount > 0 && (
				<p style={{ marginBottom: 16 }}>
					<span className="admin-badge low-stock">{lowCount} products low on stock</span>
				</p>
			)}
			{error && <p className="form-error">{error}</p>}
			{loading ? (
				<LoadingSpinner message="Loading inventory..." />
			) : (
				<div className="admin-panel">
					<div className="admin-table-wrap">
						<table className="admin-table">
							<thead>
								<tr>
									<th>Product</th>
									<th>Category</th>
									<th>Brand</th>
									<th>Current stock</th>
									<th>Update</th>
									<th></th>
								</tr>
							</thead>
							<tbody>
								{products.map((p) => {
									const low = p.stock <= LOW_STOCK;
									return (
										<tr key={p._id}>
											<td>{p.name}</td>
											<td>{p.category}</td>
											<td>{p.brand || "—"}</td>
											<td>
												{low ? (
													<span className="admin-badge low-stock">{p.stock}</span>
												) : (
													p.stock
												)}
											</td>
											<td>
												<input
													type="number"
													min="0"
													className="admin-input stock-input"
													value={drafts[p._id] ?? ""}
													onChange={(e) =>
														setDrafts((d) => ({
															...d,
															[p._id]: e.target.value,
														}))
													}
												/>
											</td>
											<td>
												<button
													type="button"
													className="admin-btn sm primary"
													disabled={savingId === p._id}
													onClick={() => saveStock(p)}
												>
													{savingId === p._id ? "..." : "Save"}
												</button>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				</div>
			)}
		</>
	);
}
