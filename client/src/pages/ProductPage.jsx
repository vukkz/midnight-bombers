import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client.js";
import { useCart } from "../context/CartContext.jsx";
import ColorChart from "../components/ColorChart.jsx";
import {
	countColorsInStock,
	getAvailableSimpleStock,
	hasColorVariants,
	isSimpleProductOutOfStock,
} from "../utils/stock.js";

export default function ProductPage() {
	const { id } = useParams();
	const { addItem } = useCart();
	const [product, setProduct] = useState(null);
	const [qty, setQty] = useState(1);
	const [error, setError] = useState("");
	const [cartMsg, setCartMsg] = useState("");

	useEffect(() => {
		async function load() {
			try {
				const data = await api.get(`/api/products/${id}`);
				setProduct(data.product);
			} catch (err) {
				setError(err.message);
			}
		}
		load();
	}, [id]);

	if (error) {
		return (
			<section className="section-p1">
				<h2>{error}</h2>
				<Link to="/shop">Back to shop</Link>
			</section>
		);
	}

	if (!product) {
		return <section className="section-p1">Loading...</section>;
	}

	const hasColors = hasColorVariants(product);
	const outOfStock = isSimpleProductOutOfStock(product);
	const colorsInStock = hasColors ? countColorsInStock(product) : 0;
	const maxQty = getAvailableSimpleStock(product);
	const bullets =
		product.descriptionPoints?.length > 0
			? product.descriptionPoints
			: product.description
				? [product.description]
				: [];

	return (
		<>
			<section id="prodetails" className="section-p1 product-detail">
				<div className="single-pro-image">
					<img width="100%" src={product.image} alt={product.name} />
				</div>
				<div className="single-pro-details">
					<h6>Home / {product.category}</h6>
					<h4>{product.name}</h4>
					{product.brand && <p className="product-brand">{product.brand}</p>}
					<h2>{product.price} RSD</h2>

					<ul className="product-description-list">
						{bullets.map((line) => (
							<li key={line.slice(0, 40)}>{line}</li>
						))}
					</ul>

					<div className="product-meta-lines">
						{product.sizeMl && <p>Size: {product.sizeMl} ml</p>}
						{hasColors ? (
							colorsInStock > 0 ? (
								<p>In stock</p>
							) : (
								<p className="product-out-of-stock">Out of stock</p>
							)
						) : outOfStock ? (
							<p className="product-out-of-stock">Out of stock</p>
						) : (
							<p>In stock</p>
						)}
					</div>

					{!hasColors && (
						<div className="product-qty-row">
							<input
								type="number"
								min={1}
								max={maxQty}
								value={qty}
								disabled={outOfStock}
								onChange={(e) => setQty(Number(e.target.value))}
							/>
							<button
								type="button"
								className="normal"
								disabled={outOfStock}
								onClick={() => {
									if (qty > maxQty) {
										setCartMsg("Not enough stock available.");
										return;
									}
									setCartMsg("");
									addItem(product, qty);
								}}
							>
								{outOfStock ? "Out of stock" : "Add to cart"}
							</button>
						</div>
					)}
					{cartMsg && <p className="form-error">{cartMsg}</p>}

					{hasColors && (
						<p className="product-color-hint">
							Select colors below — use <strong>+</strong> to add each shade to your cart.
						</p>
					)}
				</div>
			</section>

			{hasColors && (
				<ColorChart product={product} colors={product.colorVariants} />
			)}
		</>
	);
}
