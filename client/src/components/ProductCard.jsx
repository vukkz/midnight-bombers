import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";

function buildMeta(product) {
	const parts = [];
	if (product.brand) parts.push(product.brand);
	if (product.category === "spray paint" && product.sizeMl) {
		parts.push(`${product.sizeMl} ml`);
	}
	if (parts.length === 0 && product.category) {
		parts.push(product.category.charAt(0).toUpperCase() + product.category.slice(1));
	}
	return parts.join(" · ");
}

export default function ProductCard({ product }) {
	const { addItem } = useCart();
	const meta = buildMeta(product);

	return (
		<div className="pro">
			<Link to={`/product/${product._id}`}>
				<div className="pro-img">
					<img src={product.image} alt={product.name} />
					<span className="pro-tag">{product.category}</span>
				</div>
				<div className="des">
					<span>{product.category}</span>
					<h5>{product.name}</h5>
					{meta && <p className="pro-meta">{meta}</p>}
					<h4>{product.price} RSD</h4>
				</div>
			</Link>
			<i
				className="fa-solid fa-cart-shopping cart"
				role="button"
				tabIndex={0}
				onClick={(e) => {
					e.preventDefault();
					addItem(product);
				}}
				onKeyDown={(e) => {
					if (e.key === "Enter") {
						e.preventDefault();
						addItem(product);
					}
				}}
			/>
		</div>
	);
}
