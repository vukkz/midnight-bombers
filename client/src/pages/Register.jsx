import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Register() {
	const { register } = useAuth();
	const navigate = useNavigate();

	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		try {
			await register(name, email, password);
			navigate("/account");
		} catch (err) {
			setError(err.message);
		}
	};

	return (
		<section className="auth-page">
			<div className="auth-card">
				<div className="auth-card-header">
					<img
						src="/img/logo/midnightbombersblack.png"
						alt="Midnight Bombers"
						className="auth-logo"
					/>
					<h2>Join the crew</h2>
					<p>Create an account to save your cart and place orders.</p>
				</div>

				<form className="auth-form" onSubmit={handleSubmit}>
					<label>
						Name
						<input
							placeholder="Your name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							required
							autoComplete="name"
						/>
					</label>
					<label>
						Email
						<input
							type="email"
							placeholder="you@example.com"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							autoComplete="email"
						/>
					</label>
					<label>
						Password
						<input
							type="password"
							placeholder="Min. 8 characters"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							minLength={8}
							required
							autoComplete="new-password"
						/>
					</label>
					{error && <p className="form-error">{error}</p>}
					<button type="submit" className="normal auth-submit">
						Create account
					</button>
				</form>

				<p className="auth-footer-text">
					Already have an account? <Link to="/login">Sign in</Link>
				</p>
			</div>
		</section>
	);
}
