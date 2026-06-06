import { useState } from "react";
import { api } from "../api/client.js";

export default function Newsletter() {
	const [email, setEmail] = useState("");
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState("");

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setMessage("");

		try {
			const data = await api.post("/api/newsletter/subscribe", { email });

			if (data.success) {
				setMessage("✓ " + data.message);
				setEmail("");
			} else {
				setMessage("✗ " + data.message);
			}
		} catch (error) {
			console.error("Error subscribing:", error);
			setMessage("✗ An error occurred. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<section id="newletter" className="section-p1 section-m1">
			<div className="newstext">
				<h4>Sign Up For Newsletters</h4>
				<p>
					Get E-mail updates about our latest shop and{" "}
					<span>special offers.</span>
				</p>
			</div>
			<form className="form" onSubmit={handleSubmit}>
				<input
					type="email"
					placeholder="Your email address"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					required
				/>
				<button type="submit" className="normal" disabled={loading}>
					{loading ? "Signing Up..." : "Sign Up"}
				</button>
			</form>
			{message && (
				<p
					style={{
						marginTop: "10px",
						color: message.includes("✓") ? "#28a745" : "#dc3545",
						fontWeight: "bold",
						textAlign: "center",
						fontSize: "14px",
					}}
				>
					{message}
				</p>
			)}
		</section>
	);
}
