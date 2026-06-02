import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";

export default function Header() {
	const [mobileOpen, setMobileOpen] = useState(false);
	const { user, logout } = useAuth();
	const { count } = useCart();

	const navClass = mobileOpen ? "nav active" : "nav";

	return (
		<section id="header">
			<Link to="/">
				<img
					src="/img/logo/midnightbomberswhite.png"
					className="logo"
					height="100"
					alt="Midnight Bombers"
				/>
			</Link>
			<div>
				<ul id="navbar" className={navClass}>
					<li>
						<NavLink to="/" end>
							Home
						</NavLink>
					</li>
					<li>
						<NavLink to="/shop">Shop</NavLink>
					</li>
					<li>
						<NavLink to="/about">About</NavLink>
					</li>
					<li>
						<NavLink to="/contact">Contact</NavLink>
					</li>
					{user?.role === "admin" && (
						<li>
							<NavLink to="/admin">Admin</NavLink>
						</li>
					)}
					{user ? (
						<li>
							<NavLink to="/account">Account</NavLink>
						</li>
					) : (
						<li>
							<NavLink to="/login">Login</NavLink>
						</li>
					)}
					<li id="lg-bag">
						<NavLink to="/cart">
							<i className="fa-solid fa-bag-shopping" style={{ color: "#fff" }} />
							{count > 0 && <span className="cart-badge">{count}</span>}
						</NavLink>
					</li>
					{user && (
						<li>
							<button type="button" className="nav-logout" onClick={() => logout()}>
								Logout
							</button>
						</li>
					)}
					<a
						href="#"
						id="close"
						onClick={(e) => {
							e.preventDefault();
							setMobileOpen(false);
						}}
					>
						<i className="fa-solid fa-xmark" />
					</a>
				</ul>
			</div>
			<div id="mobile">
				<Link to="/cart">
					<i className="fa-solid fa-bag-shopping" style={{ color: "#ffffff" }} />
				</Link>
				<i
					id="bar"
					className="fas fa-outdent hamburger"
					role="button"
					tabIndex={0}
					onClick={() => setMobileOpen(true)}
					onKeyDown={(e) => e.key === "Enter" && setMobileOpen(true)}
				/>
			</div>
		</section>
	);
}
