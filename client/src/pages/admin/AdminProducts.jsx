import { useCallback, useEffect, useState } from "react";
import { api } from "../../api/client.js";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";
import ProductForm from "./ProductForm.jsx";

export default function AdminProducts() {
	const [products, setProducts] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [modal, setModal] = useState(null);

	const load = useCallback(async () => {
		setLoading(true);
		try {
			const data = await api.get("/api/admin/products");
			setProducts(data.products);
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

	const handleDelete = async (id, name) => {
		if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
		try {
			await api.delete(`/api/products/${id}`);
			load();
		} catch (err) {
			alert(err.message);
		}
	};

	return (
		<>
			<div className="admin-toolbar">
				<h1 className="admin-page-title" style={{ marginBottom: 0 }}>
					Products
				</h1>
				<button
					type="button"
					className="admin-btn primary"
					onClick={() => setModal("new")}
				>
					+ Add product
				</button>
			</div>

			{error && <p className="form-error">{error}</p>}
			{loading ? (
				<LoadingSpinner message="Loading products..." />
			) : (
				<div className="admin-panel">
					<div className="admin-table-wrap">
						<table className="admin-table admin-table--stack">
							<thead>
								<tr>
									<th>Image</th>
									<th>Name</th>
									<th>Category</th>
									<th>Brand</th>
									<th>Price</th>
									<th>Stock</th>
									<th>Featured</th>
									<th>Actions</th>
								</tr>
							</thead>
							<tbody>
								{products.map((p) => (
									<tr key={p._id}>
										<td data-label="Image">
											<img src={p.image} alt="" className="thumb" />
										</td>
										<td data-label="Name">{p.name}</td>
										<td data-label="Category">{p.category}</td>
										<td data-label="Brand">{p.brand || "—"}</td>
										<td data-label="Price">{p.price} RSD</td>
										<td data-label="Stock">{p.stock}</td>
										<td data-label="Featured">{p.featured ? "Yes" : "No"}</td>
										<td data-label="Actions">
											<button
												type="button"
												className="admin-btn sm"
												onClick={() => setModal(p)}
											>
												Edit
											</button>{" "}
											<button
												type="button"
												className="admin-btn sm danger"
												onClick={() => handleDelete(p._id, p.name)}
											>
												Delete
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			)}

			{modal && (
				<ProductForm
					product={modal === "new" ? null : modal}
					onClose={() => setModal(null)}
					onSaved={() => {
						setModal(null);
						load();
					}}
				/>
			)}
		</>
	);
}
