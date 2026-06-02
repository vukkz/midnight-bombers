import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../../api/client.js";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import { displayCode } from "../../utils/color.js";
import { hasColorVariants } from "../../utils/stock.js";

const LOW_STOCK = 5;

export default function AdminInventory() {
	const [products, setProducts] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [drafts, setDrafts] = useState({});
	const [colorDrafts, setColorDrafts] = useState({});
	const [savingId, setSavingId] = useState(null);
	const [expandedId, setExpandedId] = useState(null);
	const [colorSearch, setColorSearch] = useState("");

	const load = useCallback(async () => {
		setLoading(true);
		try {
			const data = await api.get("/api/admin/products");
			setProducts(data.products);
			const initial = {};
			const colorInitial = {};
			for (const p of data.products) {
				if (!hasColorVariants(p)) {
					initial[p._id] = String(p.stock ?? 0);
				} else {
					for (const c of p.colorVariants) {
						colorInitial[`${p._id}::${c.code}`] = String(c.stock ?? 0);
					}
				}
			}
			setDrafts(initial);
			setColorDrafts(colorInitial);
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

	const saveColorStock = async (productId, colorCode) => {
		const key = `${productId}::${colorCode}`;
		const stock = parseInt(colorDrafts[key], 10);
		if (Number.isNaN(stock) || stock < 0) {
			alert("Enter a valid stock number");
			return;
		}
		setSavingId(key);
		try {
			await api.patch(
				`/api/admin/products/${productId}/colors/${encodeURIComponent(colorCode)}/stock`,
				{ stock },
			);
			load();
		} catch (err) {
			alert(err.message);
		} finally {
			setSavingId(null);
		}
	};

	const simpleProducts = products.filter((p) => !hasColorVariants(p));
	const colorProducts = products.filter((p) => hasColorVariants(p));

	const expandedProduct = colorProducts.find((p) => p._id === expandedId);

	const filteredColors = useMemo(() => {
		if (!expandedProduct) return [];
		const q = colorSearch.trim().toLowerCase();
		if (!q) return expandedProduct.colorVariants;
		return expandedProduct.colorVariants.filter(
			(c) =>
				c.code.toLowerCase().includes(q) ||
				c.name.toLowerCase().includes(q) ||
				displayCode(c.code).toLowerCase().includes(q),
		);
	}, [expandedProduct, colorSearch]);

	const lowSimple = simpleProducts.filter((p) => (p.stock ?? 0) <= LOW_STOCK).length;
	const lowColors = colorProducts.reduce(
		(n, p) => n + p.colorVariants.filter((c) => (c.stock ?? 0) <= LOW_STOCK).length,
		0,
	);

	return (
		<>
			<h1 className="admin-page-title">Inventory</h1>
			{(lowSimple > 0 || lowColors > 0) && (
				<p style={{ marginBottom: 16 }}>
					{lowSimple > 0 && (
						<span className="admin-badge low-stock" style={{ marginRight: 8 }}>
							{lowSimple} products low on stock
						</span>
					)}
					{lowColors > 0 && (
						<span className="admin-badge low-stock">
							{lowColors} color variants low on stock
						</span>
					)}
				</p>
			)}
			{error && <p className="form-error">{error}</p>}
			{loading ? (
				<LoadingSpinner message="Loading inventory..." />
			) : (
				<>
					<div className="admin-panel">
						<h2>Standard products</h2>
						<div className="admin-table-wrap">
							<table className="admin-table admin-table--stack">
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
									{simpleProducts.map((p) => {
										const low = (p.stock ?? 0) <= LOW_STOCK;
										return (
											<tr key={p._id}>
												<td data-label="Product">{p.name}</td>
												<td data-label="Category">{p.category}</td>
												<td data-label="Brand">{p.brand || "—"}</td>
												<td data-label="Current stock">
													{low ? (
														<span className="admin-badge low-stock">{p.stock}</span>
													) : (
														p.stock
													)}
												</td>
												<td data-label="Update">
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
												<td data-label="">
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

					{colorProducts.length > 0 && (
						<div className="admin-panel">
							<h2>Spray & marker colors (per-shade stock)</h2>
							<p className="admin-hint">
								Stock is tracked per color. Product total stock updates automatically.
							</p>
							<div className="admin-table-wrap">
								<table className="admin-table admin-table--stack">
									<thead>
										<tr>
											<th>Product</th>
											<th>Colors</th>
											<th>Total in stock</th>
											<th></th>
										</tr>
									</thead>
									<tbody>
										{colorProducts.map((p) => {
											const outColors = p.colorVariants.filter(
												(c) => (c.stock ?? 0) === 0,
											).length;
											return (
												<tr key={p._id}>
													<td data-label="Product">{p.name}</td>
													<td data-label="Colors">{p.colorVariants.length}</td>
													<td data-label="Total in stock">
														{p.stock}
														{outColors > 0 && (
															<>
																{" "}
																<small>({outColors} shades out)</small>
															</>
														)}
													</td>
													<td data-label="">
														<button
															type="button"
															className="admin-btn sm"
															onClick={() => {
																setExpandedId(expandedId === p._id ? null : p._id);
																setColorSearch("");
															}}
														>
															{expandedId === p._id ? "Close" : "Manage colors"}
														</button>
													</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							</div>

							{expandedProduct && (
								<div className="admin-color-inventory">
									<div className="admin-toolbar">
										<h3>{expandedProduct.name}</h3>
										<input
											type="search"
											className="admin-input admin-color-search"
											placeholder="Search by code or name..."
											value={colorSearch}
											onChange={(e) => setColorSearch(e.target.value)}
										/>
									</div>
									<div className="admin-table-wrap">
										<table className="admin-table admin-table--stack">
											<thead>
												<tr>
													<th>Code</th>
													<th>Name</th>
													<th>Stock</th>
													<th>Update</th>
													<th></th>
												</tr>
											</thead>
											<tbody>
												{filteredColors.map((c) => {
													const key = `${expandedProduct._id}::${c.code}`;
													const low = (c.stock ?? 0) <= LOW_STOCK;
													return (
														<tr key={c.code}>
															<td data-label="Code">{displayCode(c.code)}</td>
															<td data-label="Name">{c.name}</td>
															<td data-label="Stock">
																{low ? (
																	<span className="admin-badge low-stock">
																		{c.stock ?? 0}
																	</span>
																) : (
																	(c.stock ?? 0)
																)}
															</td>
															<td data-label="Update">
																<input
																	type="number"
																	min="0"
																	className="admin-input stock-input"
																	value={colorDrafts[key] ?? ""}
																	onChange={(e) =>
																		setColorDrafts((d) => ({
																			...d,
																			[key]: e.target.value,
																		}))
																	}
																/>
															</td>
															<td data-label="">
																<button
																	type="button"
																	className="admin-btn sm primary"
																	disabled={savingId === key}
																	onClick={() =>
																		saveColorStock(expandedProduct._id, c.code)
																	}
																>
																	{savingId === key ? "..." : "Save"}
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
						</div>
					)}
				</>
			)}
		</>
	);
}
