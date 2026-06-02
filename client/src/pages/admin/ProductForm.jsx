import { useState } from "react";
import { api } from "../../api/client.js";

const CATEGORIES = [
	{ value: "spray paint", label: "Spray Paint" },
	{ value: "marker", label: "Marker" },
	{ value: "cap", label: "Cap" },
	{ value: "accessory", label: "Accessory" },
];

const EMPTY = {
	name: "",
	price: "",
	category: "spray paint",
	brand: "",
	sizeMl: "",
	stock: "20",
	featured: false,
	description: "",
	descriptionPoints: "",
	image: "",
};

export default function ProductForm({ product, onClose, onSaved }) {
	const isEdit = Boolean(product);
	const [form, setForm] = useState(() =>
		product
			? {
					name: product.name || "",
					price: String(product.price ?? ""),
					category: product.category || "spray paint",
					brand: product.brand || "",
					sizeMl: product.sizeMl != null ? String(product.sizeMl) : "",
					stock: String(product.stock ?? 20),
					featured: Boolean(product.featured),
					description: product.description || "",
					descriptionPoints: (product.descriptionPoints || []).join("\n"),
					image: product.image || "",
				}
			: { ...EMPTY },
	);
	const [uploading, setUploading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");

	const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

	const handleImageChange = async (e) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setUploading(true);
		setError("");
		try {
			const fd = new FormData();
			fd.append("image", file);
			const data = await api.upload("/api/admin/upload", fd);
			set("image", data.url);
		} catch (err) {
			setError(err.message);
		} finally {
			setUploading(false);
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!form.image) {
			setError("Product image is required");
			return;
		}
		setSaving(true);
		setError("");
		try {
			const body = {
				name: form.name.trim(),
				price: Number(form.price),
				category: form.category,
				brand: form.brand.trim() || undefined,
				sizeMl: form.sizeMl ? Number(form.sizeMl) : undefined,
				stock: Number(form.stock),
				featured: form.featured,
				description: form.description.trim(),
				descriptionPoints: form.descriptionPoints
					.split("\n")
					.map((l) => l.trim())
					.filter(Boolean),
				image: form.image,
			};

			if (isEdit) {
				await api.put(`/api/products/${product._id}`, body);
			} else {
				await api.post("/api/products", body);
			}
			onSaved();
		} catch (err) {
			setError(err.message);
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="admin-modal-backdrop" onClick={onClose}>
			<div className="admin-modal" onClick={(e) => e.stopPropagation()}>
				<h2>{isEdit ? "Edit product" : "Add product"}</h2>
				{error && <p className="form-error">{error}</p>}
				<form className="admin-form" onSubmit={handleSubmit}>
					<label>
						Name *
						<input
							className="admin-input"
							value={form.name}
							onChange={(e) => set("name", e.target.value)}
							required
						/>
					</label>
					<div className="admin-form-row">
						<label>
							Price (RSD) *
							<input
								className="admin-input"
								type="number"
								min="0"
								value={form.price}
								onChange={(e) => set("price", e.target.value)}
								required
							/>
						</label>
						<label>
							Stock *
							<input
								className="admin-input"
								type="number"
								min="0"
								value={form.stock}
								onChange={(e) => set("stock", e.target.value)}
								required
							/>
						</label>
					</div>
					<div className="admin-form-row">
						<label>
							Category *
							<select
								className="admin-select"
								value={form.category}
								onChange={(e) => set("category", e.target.value)}
							>
								{CATEGORIES.map((c) => (
									<option key={c.value} value={c.value}>
										{c.label}
									</option>
								))}
							</select>
						</label>
						<label>
							Brand
							<input
								className="admin-input"
								value={form.brand}
								onChange={(e) => set("brand", e.target.value)}
								placeholder="e.g. MTN 94"
							/>
						</label>
					</div>
					<label>
						Size (ml) — spray paint only
						<input
							className="admin-input"
							type="number"
							min="0"
							value={form.sizeMl}
							onChange={(e) => set("sizeMl", e.target.value)}
						/>
					</label>
					<label>
						Description *
						<textarea
							className="admin-input"
							rows={3}
							value={form.description}
							onChange={(e) => set("description", e.target.value)}
							required
						/>
					</label>
					<label>
						Bullet points (one per line)
						<textarea
							className="admin-input"
							rows={4}
							value={form.descriptionPoints}
							onChange={(e) => set("descriptionPoints", e.target.value)}
						/>
					</label>
					<label>
						<input
							type="checkbox"
							checked={form.featured}
							onChange={(e) => set("featured", e.target.checked)}
						/>{" "}
						Featured on homepage
					</label>
					<label>
						Product image *
						<input
							type="file"
							accept="image/*"
							onChange={handleImageChange}
							disabled={uploading}
						/>
						{uploading && <small>Uploading...</small>}
						{form.image && (
							<img
								src={form.image}
								alt="Preview"
								className="admin-image-preview"
							/>
						)}
					</label>
					<div className="admin-form-actions">
						<button type="button" className="admin-btn" onClick={onClose}>
							Cancel
						</button>
						<button
							type="submit"
							className="admin-btn primary"
							disabled={saving || uploading}
						>
							{saving ? "Saving..." : isEdit ? "Save changes" : "Create product"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
