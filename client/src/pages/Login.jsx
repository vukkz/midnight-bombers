import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
	const { login } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();
	const from = location.state?.from || "/account";

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		try {
			await login(email, password);
			navigate(from);
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
					<h2>Welcome back</h2>
					<p>Sign in to track orders and checkout faster.</p>
				</div>

				<form className="auth-form" onSubmit={handleSubmit}>
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
							placeholder="••••••••"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							autoComplete="current-password"
						/>
					</label>
					{error && <p className="form-error">{error}</p>}
					<button type="submit" className="normal auth-submit">
						Sign in
					</button>
				</form>

				<p className="auth-footer-text">
					No account? <Link to="/register">Create one</Link>
				</p>
			</div>
		</section>
	);
}
