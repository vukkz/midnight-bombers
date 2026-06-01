import { useEffect, useState } from "react";

// `scale` is an optional per-logo nudge (1 = default). Bump it for logos
// that have extra transparent padding baked into the PNG so they look small.
const BRANDS = [
	{ name: "MTN", logo: "/img/brands/mtn.png", scale: 1 },
	{ name: "Molotow", logo: "/img/brands/molotow.png", scale: 1 },
	{ name: "Loop", logo: "/img/brands/loop.png", scale: 1 },
	{ name: "Kobra", logo: "/img/brands/kobra.png", scale: 1 },
	{ name: "Grog", logo: "/img/brands/grog.png", scale: 2.3 },
	{ name: "Montana", logo: "/img/brands/montana.png", scale: 2.3 },
];

function getVisible(width) {
	if (width <= 576) return 2;
	if (width <= 991) return 3;
	return 4;
}

export default function BrandCarousel() {
	const [visible, setVisible] = useState(() =>
		typeof window === "undefined" ? 5 : getVisible(window.innerWidth),
	);
	const [index, setIndex] = useState(0);
	const [animate, setAnimate] = useState(true);

	// Clone the first `visible` logos at the end so the loop has no gap.
	const slides = [...BRANDS, ...BRANDS.slice(0, visible)];
	const itemBasis = 100 / visible;

	useEffect(() => {
		const onResize = () => {
			setVisible(getVisible(window.innerWidth));
			setIndex(0);
			setAnimate(true);
		};
		window.addEventListener("resize", onResize);
		return () => window.removeEventListener("resize", onResize);
	}, []);

	useEffect(() => {
		const reduced = window.matchMedia(
			"(prefers-reduced-motion: reduce)",
		).matches;
		if (reduced) return;
		const id = setInterval(() => setIndex((i) => i + 1), 2000);
		return () => clearInterval(id);
	}, []);

	// When we reach the cloned region, snap back to the start without animating.
	useEffect(() => {
		if (index !== BRANDS.length) return;
		const timer = setTimeout(() => {
			setAnimate(false);
			setIndex(0);
		}, 650);
		return () => clearTimeout(timer);
	}, [index]);

	useEffect(() => {
		if (animate) return;
		const raf = requestAnimationFrame(() =>
			requestAnimationFrame(() => setAnimate(true)),
		);
		return () => cancelAnimationFrame(raf);
	}, [animate]);

	return (
		<div className="brand-carousel">
			<div
				className="brand-track"
				style={{
					transform: `translateX(-${index * itemBasis}%)`,
					transition: animate ? "transform 0.6s ease" : "none",
				}}
			>
				{slides.map((brand, i) => (
					<div
						className="brand-slide"
						key={`${brand.name}-${i}`}
						style={{
							flexBasis: `${itemBasis}%`,
							"--logo-scale": brand.scale ?? 1,
						}}
					>
						<img
							src={brand.logo}
							alt={brand.name}
							onError={(e) => {
								e.currentTarget.style.display = "none";
								if (e.currentTarget.nextSibling) {
									e.currentTarget.nextSibling.style.display = "block";
								}
							}}
						/>
						<span className="brand-fallback" style={{ display: "none" }}>
							{brand.name}
						</span>
					</div>
				))}
			</div>
		</div>
	);
}
