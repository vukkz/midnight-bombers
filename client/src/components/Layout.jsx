import { useEffect, useState } from "react";
import { useLocation, Outlet } from "react-router-dom";
import Header from "./Header.jsx";
import Footer from "./Footer.jsx";

export default function Layout() {
	const location = useLocation();
	const [transitioning, setTransitioning] = useState(false);

	// On route change: scroll to top, sweep the progress bar, fade in content.
	useEffect(() => {
		window.scrollTo(0, 0);
		setTransitioning(true);
		const timer = setTimeout(() => setTransitioning(false), 550);
		return () => clearTimeout(timer);
	}, [location.pathname]);

	return (
		<>
			{transitioning && <div className="page-loader" aria-hidden />}
			<Header />
			<main key={location.pathname} className="page-transition">
				<Outlet />
			</main>
			<Footer />
		</>
	);
}
