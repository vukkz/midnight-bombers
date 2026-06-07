import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import Newsletter from "../components/Newsletter.jsx";
import ProductCard from "../components/ProductCard.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import StarRating from "../components/StarRating.jsx";
import BrandCarousel from "../components/BrandCarousel.jsx";
import GallerySubmit from "../components/GallerySubmit.jsx";
import { useReveal } from "../hooks/useReveal.js";

const REVIEWS = [
	{
		name: "Marko P.",
		text: "Finally a real graffiti store in Serbia. Huge color selection, fair prices and the staff actually paint themselves. They know exactly what you need.",
	},
	{
		name: "Ana J.",
		text: "Ordered caps and a few cans, arrived next day. The Montana and MTN range is the best I've found locally. My go-to spot now.",
	},
	{
		name: "Stefan M.",
		text: "These guys support the local scene like nobody else. Quality gear, good advice, and they hooked me up with everything for my first wall.",
	},
];

const SUBMIT_CLOSE_MS = 780;

export default function Home() {
	const [featured, setFeatured] = useState([]);
	const [gallery, setGallery] = useState([]);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(true);
	const [showSubmitForm, setShowSubmitForm] = useState(false);
	const [isClosingSubmit, setIsClosingSubmit] = useState(false);
	const submitSectionRef = useRef(null);
	const submitToggleRef = useRef(null);
	const submitCloseTimerRef = useRef(null);

	const closeSubmitForm = useCallback(() => {
		if (!showSubmitForm || isClosingSubmit) return;

		const prefersReduced = window.matchMedia(
			"(prefers-reduced-motion: reduce)",
		).matches;

		if (prefersReduced) {
			setShowSubmitForm(false);
			setIsClosingSubmit(false);
			return;
		}

		const section = submitSectionRef.current;
		setIsClosingSubmit(true);
		section?.classList.add("gallery-submit-section--closing");
		section?.querySelectorAll(".reveal.is-visible").forEach((el) => {
			el.classList.remove("is-visible");
		});

		submitCloseTimerRef.current = window.setTimeout(() => {
			setShowSubmitForm(false);
			setIsClosingSubmit(false);
			section?.classList.remove("gallery-submit-section--closing");
			submitCloseTimerRef.current = null;
		}, SUBMIT_CLOSE_MS);
	}, [showSubmitForm, isClosingSubmit]);

	useEffect(() => {
		return () => {
			if (submitCloseTimerRef.current) {
				window.clearTimeout(submitCloseTimerRef.current);
			}
		};
	}, []);

	useEffect(() => {
		async function load() {
			setLoading(true);
			try {
				const [featuredRes, galleryRes] = await Promise.all([
					api.get("/api/products?featured=true&limit=4"),
					api.get("/api/gallery/photos"),
				]);
				setFeatured(featuredRes.products);
				setGallery(galleryRes.photos);
			} catch (err) {
				setError(err.message);
			} finally {
				setLoading(false);
			}
		}
		load();
	}, []);

	useEffect(() => {
		if (!showSubmitForm || isClosingSubmit) return;

		const onPointerDown = (e) => {
			if (submitToggleRef.current?.contains(e.target)) return;
			if (submitSectionRef.current?.contains(e.target)) return;
			closeSubmitForm();
		};

		const onKeyDown = (e) => {
			if (e.key === "Escape") closeSubmitForm();
		};

		document.addEventListener("mousedown", onPointerDown);
		document.addEventListener("keydown", onKeyDown);
		return () => {
			document.removeEventListener("mousedown", onPointerDown);
			document.removeEventListener("keydown", onKeyDown);
		};
	}, [showSubmitForm, isClosingSubmit, closeSubmitForm]);

	const toggleSubmitForm = () => {
		if (isClosingSubmit) return;

		if (showSubmitForm) {
			closeSubmitForm();
			return;
		}

		setShowSubmitForm(true);
		requestAnimationFrame(() => {
			submitSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
		});
	};

	useReveal([loading, featured, gallery, showSubmitForm]);

	return (
		<>
			<section id="hero">
				<div className="hero-content">
					<h4>#NotForToyz</h4>
					<h2>Paint the night</h2>
					<h1>Bomb with precision</h1>
					<p>Professional spray cans and gear built for the streets</p>
					<Link to="/shop">
						<button type="button">Shop Now</button>
					</Link>
				</div>
			</section>

			<section id="brands" className="section-p1 section-dark">
				<div className="section-head reveal">
					<h2>Featured Brands</h2>
					<p>The names that built the culture — all stocked under one roof</p>
				</div>
				<div className="reveal reveal-d1">
					<BrandCarousel />
				</div>
			</section>

			<section id="product-1" className="section-p1 section-concrete">
				<h2 className="reveal">Bomber's Favorite</h2>
				{error && <p className="form-error">{error}</p>}
				{loading ? (
					<LoadingSpinner />
				) : (
					<>
						<div className="pro-container reveal reveal-d2">
							{featured.slice(0, 4).map((product) => (
								<ProductCard key={product._id} product={product} />
							))}
						</div>
						<div className="section-cta reveal reveal-d3">
							<Link to="/shop" className="view-all-btn">
								View all products
								<i className="fa-solid fa-arrow-right" aria-hidden />
							</Link>
						</div>
					</>
				)}
			</section>

			<section id="gallery" className="section-p1 section-dark">
				<div className="section-head reveal">
					<h2>Street Gallery</h2>
					<p>
						Real walls from our community. Tag{" "}
						<span className="neon-pink">@midnightbombers</span> or{" "}
						<span className="neon-pink">#NotForToyz</span> to get featured.
					</p>
				</div>
				<div className="gallery-grid reveal reveal-d1">
					{gallery.map((shot) => (
						<figure key={shot._id} className="gallery-item">
							<img src={shot.image} alt={`Graffiti by ${shot.artist}`} />
							<figcaption className="gallery-caption">{shot.artist}</figcaption>
						</figure>
					))}
				</div>
				<button
					ref={submitToggleRef}
					type="button"
					className={`gallery-submit reveal reveal-d2${showSubmitForm ? " gallery-submit--active" : ""}`}
					onClick={toggleSubmitForm}
					aria-expanded={showSubmitForm}
					aria-controls="submit-photo"
				>
					<i className={`fa-solid ${showSubmitForm ? "fa-xmark" : "fa-camera"}`} aria-hidden />
					{showSubmitForm ? "Close form" : "Submit your photo"}
				</button>
			</section>

			{(showSubmitForm || isClosingSubmit) && (
				<GallerySubmit
					sectionRef={submitSectionRef}
					onClose={closeSubmitForm}
					isClosing={isClosingSubmit}
				/>
			)}

			<section id="community" className="community-strip">
				<div className="community-inner reveal">
					<h2>Graffiti scene starts here</h2>
					<p>
						Serbia's only dedicated graffiti supply store — serving writers
						across the whole country, from Belgrade to every corner of the map.
					</p>
				</div>
			</section>

			<section id="reviews" className="section-p1 section-concrete">
				<div className="section-head reveal">
					<h2>What Writers Say</h2>
					<p>Straight from our Google reviews</p>
				</div>
				<div className="reviews-grid reveal reveal-d1">
					{REVIEWS.map((review) => (
						<figure key={review.name} className="review-card">
							<StarRating />
							<blockquote>{review.text}</blockquote>
							<figcaption>
								<i className="fa-brands fa-google" aria-hidden /> {review.name}
							</figcaption>
						</figure>
					))}
				</div>
			</section>

			<Newsletter />
		</>
	);
}
