import { useCallback, useEffect, useState } from "react";
import { api } from "../../api/client.js";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";

export default function AdminGallery() {
	const [photos, setPhotos] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [saving, setSaving] = useState(null);
	const [form, setForm] = useState({ artist: "", sortOrder: "0", imageUrl: "" });
	const [newImage, setNewImage] = useState(null);

	const load = useCallback(async () => {
		setLoading(true);
		try {
			const data = await api.get("/api/admin/gallery");
			setPhotos(data.photos);
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

	const handleAdd = async (e) => {
		e.preventDefault();
		if (!form.artist.trim()) {
			alert("Artist handle is required");
			return;
		}
		if (!newImage && !form.imageUrl.trim()) {
			alert("Upload an image or paste an image URL");
			return;
		}

		setSaving("new");
		try {
			const fd = new FormData();
			fd.append("artist", form.artist);
			fd.append("sortOrder", form.sortOrder);
			if (form.imageUrl.trim()) fd.append("imageUrl", form.imageUrl.trim());
			if (newImage) fd.append("image", newImage);
			await api.upload("/api/admin/gallery", fd);
			setForm({ artist: "", sortOrder: "0", imageUrl: "" });
			setNewImage(null);
			load();
		} catch (err) {
			alert(err.message);
		} finally {
			setSaving(null);
		}
	};

	const updatePhoto = async (id, patch, file) => {
		setSaving(id);
		try {
			const fd = new FormData();
			Object.entries(patch).forEach(([k, v]) => fd.append(k, String(v)));
			if (file) fd.append("image", file);
			await api.uploadPatch(`/api/admin/gallery/${id}`, fd);
			load();
		} catch (err) {
			alert(err.message);
		} finally {
			setSaving(null);
		}
	};

	const deletePhoto = async (id) => {
		if (!window.confirm("Remove this photo from the homepage gallery?")) return;
		try {
			await api.delete(`/api/admin/gallery/${id}`);
			load();
		} catch (err) {
			alert(err.message);
		}
	};

	return (
		<>
			<h1 className="admin-page-title">Gallery</h1>
			<p className="admin-page-desc">
				Manage photos on the homepage Street Gallery. Customer submissions arrive by
				email — add approved photos here.
			</p>

			{error && <p className="form-error">{error}</p>}

			<div className="admin-panel admin-gallery-add">
				<h2>Add photo</h2>
				<form className="admin-gallery-form" onSubmit={handleAdd}>
					<label>
						Artist / handle
						<input
							value={form.artist}
							onChange={(e) => setForm({ ...form, artist: e.target.value })}
							placeholder="@writer"
							required
						/>
					</label>
					<label>
						Sort order
						<input
							type="number"
							value={form.sortOrder}
							onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
						/>
					</label>
					<label>
						Image URL <span className="label-optional">(optional if uploading)</span>
						<input
							value={form.imageUrl}
							onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
							placeholder="/uploads/gallery/... or /img/banners/..."
						/>
					</label>
					<label>
						Upload image
						<input
							type="file"
							accept="image/*"
							onChange={(e) => setNewImage(e.target.files?.[0] || null)}
						/>
					</label>
					<button type="submit" className="admin-btn primary" disabled={saving === "new"}>
						{saving === "new" ? "Adding..." : "Add to gallery"}
					</button>
				</form>
			</div>

			{loading ? (
				<LoadingSpinner message="Loading gallery..." />
			) : (
				<div className="admin-gallery-grid">
					{photos.map((photo) => (
						<article key={photo._id} className="admin-gallery-card">
							<img src={photo.image} alt={photo.artist} className="admin-gallery-thumb" />
							<div className="admin-gallery-card-body">
								<label>
									Handle
									<input
										defaultValue={photo.artist}
										onBlur={(e) => {
											if (e.target.value !== photo.artist) {
												updatePhoto(photo._id, { artist: e.target.value });
											}
										}}
									/>
								</label>
								<label>
									Sort
									<input
										type="number"
										defaultValue={photo.sortOrder}
										onBlur={(e) => {
											if (Number(e.target.value) !== photo.sortOrder) {
												updatePhoto(photo._id, { sortOrder: e.target.value });
											}
										}}
									/>
								</label>
								<label className="admin-gallery-check">
									<input
										type="checkbox"
										checked={photo.active}
										onChange={(e) =>
											updatePhoto(photo._id, { active: e.target.checked })
										}
									/>
									Visible on homepage
								</label>
								<label>
									Replace image
									<input
										type="file"
										accept="image/*"
										disabled={saving === photo._id}
										onChange={(e) => {
											const file = e.target.files?.[0];
											if (file) updatePhoto(photo._id, {}, file);
										}}
									/>
								</label>
								<p className="admin-gallery-path">
									<code>{photo.image}</code>
								</p>
								<button
									type="button"
									className="admin-btn danger sm"
									onClick={() => deletePhoto(photo._id)}
								>
									Delete
								</button>
							</div>
						</article>
					))}
				</div>
			)}
		</>
	);
}
