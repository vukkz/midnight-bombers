import { NavLink, Outlet, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const NAV = [
	{ to: "/admin", end: true, label: "Overview", icon: "fa-chart-line" },
	{ to: "/admin/products", label: "Products", icon: "fa-box" },
	{ to: "/admin/inventory", label: "Inventory", icon: "fa-warehouse" },
	{ to: "/admin/orders", label: "Orders", icon: "fa-receipt" },
	{ to: "/admin/users", label: "Users", icon: "fa-users" },
];

export default function AdminLayout() {
	const { user, logout } = useAuth();

	return (
		<div className="admin-shell">
			<aside className="admin-sidebar">
				<div className="admin-sidebar-brand">
					<img
						src="/img/logo/midnightbomberswhite.png"
						alt="Midnight Bombers"
						height="48"
					/>
					<span>Admin</span>
				</div>
				<nav className="admin-nav">
					{NAV.map((item) => (
						<NavLink
							key={item.to}
							to={item.to}
							end={item.end}
							className={({ isActive }) =>
								`admin-nav-link${isActive ? " active" : ""}`
							}
						>
							<i className={`fa-solid ${item.icon}`} aria-hidden />
							{item.label}
						</NavLink>
					))}
				</nav>
				<div className="admin-sidebar-footer">
					<Link to="/" className="admin-nav-link">
						<i className="fa-solid fa-store" aria-hidden />
						View site
					</Link>
				</div>
			</aside>

			<div className="admin-main">
				<header className="admin-topbar">
					<div>
						<p className="admin-topbar-label">Signed in as</p>
						<p className="admin-topbar-name">{user?.name}</p>
					</div>
					<button type="button" className="admin-logout-btn" onClick={() => logout()}>
						Logout
					</button>
				</header>
				<div className="admin-content">
					<Outlet />
				</div>
			</div>
		</div>
	);
}
