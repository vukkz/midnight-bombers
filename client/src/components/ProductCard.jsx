import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import {
	canQuickAddToCart,
	isAllColorsOutOfStock,
	isSimpleProductOutOfStock,
} from "../utils/stock.js";

export default function ProductCard({ product }) {
	const { addItem } = useCart();
	const outOfStock = isSimpleProductOutOfStock(product) || isAllColorsOutOfStock(product);
	const quickAdd = canQuickAddToCart(product);

	return (
		<div className={`pro${outOfStock ? " pro--out-of-stock" : ""}`}>
			<Link to={`/product/${product._id}`}>
				<div className="pro-img">
					<img src={product.image} alt={product.name} />
					<span className="pro-tag">{product.category}</span>
					{outOfStock && <span className="pro-stock-badge">Out of stock</span>}
				</div>
				<div className="des">
					<span>{product.category}</span>
					<h5>{product.name}</h5>
					<h4>{product.price} RSD</h4>
				</div>
			</Link>
			{quickAdd ? (
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
			) : (
				<Link
					to={`/product/${product._id}`}
					className="cart cart--link"
					title={outOfStock ? "Out of stock" : "Choose a color"}
				>
					<i
						className={`fa-solid ${outOfStock ? "fa-ban" : "fa-palette"}`}
						aria-hidden
					/>
				</Link>
			)}
		</div>
	);
}
