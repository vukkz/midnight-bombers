import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api/client.js";
import ProductCard from "../components/ProductCard.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import { useReveal } from "../hooks/useReveal.js";

const CATEGORIES = [
	{ value: "all", label: "All Products" },
	{ value: "spray paint", label: "Spray Paint" },
	{ value: "marker", label: "Markers" },
	{ value: "cap", label: "Caps" },
	{ value: "accessory", label: "Accessories" },
];

const BRANDS_BY_CATEGORY = {
	"spray paint": ["MTN 94", "Montana Black", "Loop", "Kobra", "Molotow"],
	marker: ["Molotow", "Street Dabber"],
};

export default function Shop() {
	const [searchParams, setSearchParams] = useSearchParams();
	const [products, setProducts] = useState([]);
	const [pages, setPages] = useState(1);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(true);
	const [searchInput, setSearchInput] = useState(
		searchParams.get("search") || "",
	);

	const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
	const category = searchParams.get("category") || "all";
	const search = searchParams.get("search") || "";
	const brandsParam = searchParams.get("brands") || "";
	const selectedBrands = brandsParam ? brandsParam.split(",") : [];
	const availableBrands = BRANDS_BY_CATEGORY[category] || [];

	useEffect(() => {
		setSearchInput(search);
	}, [search]);

	useEffect(() => {
		document.title = search
			? `Search: ${search} | Shop`
			: category !== "all"
				? `${CATEGORIES.find((cat) => cat.value === category)?.label || "Shop"} | Shop`
				: "Shop | Midnight Bombers";
	}, [category, search]);

	useEffect(() => {
		async function load() {
			setLoading(true);
			try {
				const query = new URLSearchParams({
					page: String(page),
					limit: "12",
				});
				if (category !== "all") query.set("category", category);
				if (search) query.set("search", search);
				if (brandsParam) query.set("brand", brandsParam);

				const data = await api.get(`/api/products?${query.toString()}`);
				setProducts(data.products);
				setPages(data.pagination.pages);
				setError("");
			} catch (err) {
				setError(err.message);
			} finally {
				setLoading(false);
			}
		}
		load();
	}, [page, category, search, brandsParam]);

	const updateSearchParams = (values) => {
		const params = new URLSearchParams(searchParams);
		Object.entries(values).forEach(([key, value]) => {
			if (!value || value === "all") {
				params.delete(key);
			} else {
				params.set(key, value);
			}
		});
		if (values.page && values.page !== page) {
			params.set("page", String(values.page));
		}
		setSearchParams(params);
	};

	const handleSearchSubmit = (event) => {
		event.preventDefault();
		updateSearchParams({ search: searchInput.trim(), page: 1 });
	};

	const handleCategorySelect = (value) => {
		// Switching category resets the brand selection (brands are per-category).
		updateSearchParams({ category: value, brands: "", page: 1 });
	};

	const handleBrandToggle = (brand) => {
		const next = selectedBrands.includes(brand)
			? selectedBrands.filter((b) => b !== brand)
			: [...selectedBrands, brand];
		updateSearchParams({ brands: next.join(","), page: 1 });
	};

	const handleClearFilters = () => {
		setSearchInput("");
		setSearchParams({});
	};

	const hasActiveFilters =
		category !== "all" || selectedBrands.length > 0 || Boolean(search);

	useReveal([loading, products]);

	return (
		<>
			<section id="page-header">
				<h2>Our Shop</h2>
				<p>Professional graffiti equipment — spray, markers, caps & gear</p>
			</section>

			<section className="section-p1">
				<div className="shop-layout">
					<aside className="shop-sidebar reveal">
						<div className="shop-filter-group">
							<h4 className="shop-filter-title">Category</h4>
							<ul className="shop-cat-list">
								{CATEGORIES.map((cat) => (
									<li key={cat.value}>
										<button
											type="button"
											className={`shop-cat-btn${category === cat.value ? " active" : ""}`}
											onClick={() => handleCategorySelect(cat.value)}
										>
											{cat.label}
										</button>
									</li>
								))}
							</ul>
						</div>

						{availableBrands.length > 0 && (
							<div className="shop-filter-group">
								<h4 className="shop-filter-title">Brand</h4>
								<ul className="shop-brand-list">
									{availableBrands.map((brand) => (
										<li key={brand}>
											<label className="shop-brand-option">
												<input
													type="checkbox"
													checked={selectedBrands.includes(brand)}
													onChange={() => handleBrandToggle(brand)}
												/>
												<span>{brand}</span>
											</label>
										</li>
									))}
								</ul>
							</div>
						)}

						{hasActiveFilters && (
							<button
								type="button"
								className="normal shop-clear-button"
								onClick={handleClearFilters}
							>
								Clear all filters
							</button>
						)}
					</aside>

					<div className="shop-results">
						<div className="shop-results-bar">
							<form className="shop-search-form" onSubmit={handleSearchSubmit}>
								<div className="shop-search-field">
									<i
										className="fa-solid fa-magnifying-glass shop-search-icon"
										aria-hidden
									/>
									<input
										type="search"
										className="shop-search-input"
										placeholder="Search by product name or description"
										value={searchInput}
										onChange={(e) => setSearchInput(e.target.value)}
									/>
								</div>
								<button type="submit" className="normal shop-search-btn">
									Search
								</button>
							</form>
							<div className="shop-results-meta">
								{loading ? "Searching..." : `${products.length} products found`}
							</div>
						</div>

						{error && <p className="form-error">{error}</p>}
						{loading ? (
							<LoadingSpinner />
						) : products.length === 0 ? (
							<p className="shop-empty">
								No products found. Try a different search, category or brand.
							</p>
						) : (
							<div id="product-1" className="shop-product-grid">
								{products.map((product) => (
									<ProductCard key={product._id} product={product} />
								))}
							</div>
						)}

						<div id="pagination" className="section-p1">
							{Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
								<a
									key={n}
									href="#"
									className={n === page ? "active" : ""}
									onClick={(e) => {
										e.preventDefault();
										updateSearchParams({ page: n });
									}}
								>
									{n}
								</a>
							))}
							{page < pages && (
								<a
									href="#"
									onClick={(e) => {
										e.preventDefault();
										updateSearchParams({ page: page + 1 });
									}}
								>
									Next
								</a>
							)}
						</div>
					</div>
				</div>
			</section>
		</>
	);
}
