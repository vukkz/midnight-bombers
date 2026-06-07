import { useState } from "react";
import { api } from "../api/client.js";

const INSTAGRAM_URL =
	import.meta.env.VITE_INSTAGRAM_URL || "https://www.instagram.com/midnightbombers/";

export default function GallerySubmit({ sectionRef, onClose, isClosing = false }) {
	const [form, setForm] = useState({
		name: "",
		instagramHandle: "",
		email: "",
		caption: "",
	});
	const [photo, setPhoto] = useState(null);
	const [preview, setPreview] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [message, setMessage] = useState("");

	const handlePhotoChange = (e) => {
		const file = e.target.files?.[0];
		setPhoto(file || null);
		if (preview) URL.revokeObjectURL(preview);
		setPreview(file ? URL.createObjectURL(file) : "");
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!photo) {
			setMessage("✗ Please choose a photo to upload.");
			return;
		}

		setSubmitting(true);
		setMessage("");

		const formData = new FormData();
		formData.append("name", form.name);
		formData.append("instagramHandle", form.instagramHandle);
		formData.append("email", form.email);
		formData.append("caption", form.caption);
		formData.append("photo", photo);

		try {
			const data = await api.upload("/api/gallery/submit", formData);
			setMessage(`✓ ${data.message || "Photo submitted! We'll review it soon."}`);
			setForm({ name: "", instagramHandle: "", email: "", caption: "" });
			setPhoto(null);
			if (preview) URL.revokeObjectURL(preview);
			setPreview("");
			e.target.reset();
			setTimeout(() => onClose?.(), 2500);
		} catch (err) {
			setMessage(`✗ ${err.message}`);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<section
			id="submit-photo"
			ref={sectionRef}
			className={`gallery-submit-section section-p1 section-concrete${isClosing ? " gallery-submit-section--closing" : ""}`}
		>
			<div className="gallery-submit-section-head reveal">
				<div className="section-head">
					<h2>Get featured</h2>
					<p>Share your wall with the Midnight Bombers community</p>
				</div>
				<button type="button" className="gallery-submit-close" onClick={onClose} aria-label="Close">
					<i className="fa-solid fa-xmark" aria-hidden />
				</button>
			</div>

			<div className="gallery-submit-options reveal reveal-d1">
				<a
					className="gallery-submit gallery-submit--instagram"
					href={INSTAGRAM_URL}
					target="_blank"
					rel="noopener noreferrer"
				>
					<i className="fa-brands fa-instagram" aria-hidden /> Share on Instagram
				</a>
				<span className="gallery-submit-divider">or</span>
				<span className="gallery-submit-hint">Fill in the form below</span>
			</div>

			<div className="gallery-submit-steps reveal reveal-d2">
				<div className="gallery-step">
					<span className="gallery-step-num">1</span>
					<p>
						Post on Instagram and tag{" "}
						<span className="neon-pink">@midnightbombers</span> +{" "}
						<span className="neon-pink">#NotForToyz</span>
					</p>
				</div>
				<div className="gallery-step">
					<span className="gallery-step-num">2</span>
					<p>Or upload your photo below — we review every submission</p>
				</div>
				<div className="gallery-step">
					<span className="gallery-step-num">3</span>
					<p>If selected, we feature you on the homepage and our socials</p>
				</div>
			</div>

			<form
				id="gallery-submit-form"
				className="gallery-submit-form reveal reveal-d3"
				onSubmit={handleSubmit}
			>
				<div className="gallery-form-grid">
					<label>
						Your name
						<input
							type="text"
							value={form.name}
							onChange={(e) => setForm({ ...form, name: e.target.value })}
							placeholder="Writer name or real name"
							required
						/>
					</label>
					<label>
						Instagram handle
						<input
							type="text"
							value={form.instagramHandle}
							onChange={(e) => setForm({ ...form, instagramHandle: e.target.value })}
							placeholder="@yourhandle"
						/>
					</label>
					<label>
						Email <span className="label-optional">(optional)</span>
						<input
							type="email"
							value={form.email}
							onChange={(e) => setForm({ ...form, email: e.target.value })}
							placeholder="For confirmation only"
						/>
					</label>
					<label className="gallery-form-full">
						Caption / location
						<textarea
							rows={3}
							value={form.caption}
							onChange={(e) => setForm({ ...form, caption: e.target.value })}
							placeholder="Wall spot, city, cans used, crew name..."
						/>
					</label>
					<label className="gallery-form-full">
						Photo
						<input
							type="file"
							accept="image/*"
							onChange={handlePhotoChange}
							required
						/>
					</label>
				</div>

				{preview && (
					<div className="gallery-preview">
						<img src={preview} alt="Preview of your submission" />
					</div>
				)}

				<button type="submit" className="normal gallery-form-btn" disabled={submitting}>
					{submitting ? "Uploading..." : "Send submission"}
				</button>

				{message && (
					<p
						className={
							message.startsWith("✓") ? "gallery-form-success" : "gallery-form-error"
						}
					>
						{message}
					</p>
				)}

				<p className="gallery-form-note">
					Click anywhere outside this section, press Escape, or use Close form to hide
					this panel.
				</p>
			</form>
		</section>
	);
}
