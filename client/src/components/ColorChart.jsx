import { useMemo, useState } from "react";
import { useCart } from "../context/CartContext.jsx";
import { displayCode, swatchStyle, textOnColor } from "../utils/color.js";
import { canAddColorToCart, getColorStock } from "../utils/stock.js";

const INITIAL_COUNT = 21;

export default function ColorChart({ product, colors }) {
	const { addItem, setItemQuantity, removeItem, items, getCartKey } = useCart();
	const [expanded, setExpanded] = useState(false);
	const [message, setMessage] = useState("");

	const visible = expanded ? colors : colors.slice(0, INITIAL_COUNT);
	const hiddenCount = Math.max(0, colors.length - INITIAL_COUNT);

	const cartQtyByCode = useMemo(() => {
		const map = {};
		for (const item of items) {
			if (item.productId === product._id && item.colorCode) {
				map[item.colorCode] = item.quantity;
			}
		}
		return map;
	}, [items, product._id]);

	const getQty = (code) => cartQtyByCode[code] || 0;

	const changeQty = (color, delta) => {
		setMessage("");
		const cartKey = getCartKey(product._id, color.code);
		const current = getQty(color.code);
		const available = getColorStock(color);

		if (delta > 0) {
			if (!canAddColorToCart(color, current)) {
				setMessage(
					available === 0
						? `${color.name} is out of stock.`
						: `No more ${color.name} available.`,
				);
				return;
			}
			addItem(product, delta, color);
			return;
		}

		if (current <= 1) {
			removeItem(cartKey);
		} else {
			setItemQuantity(cartKey, current - 1);
		}
	};

	return (
		<section className="color-chart section-p1">
			<h3 className="color-chart-title">All colors</h3>
			{message && <p className="form-error color-chart-message">{message}</p>}
			<div className="color-chart-grid">
				{visible.map((color) => {
					const textColor = textOnColor(color.hex);
					const qty = getQty(color.code);
					const sku = displayCode(color.code);
					const stock = getColorStock(color);
					const out = stock === 0;
					const atMax = qty >= stock && stock > 0;

					return (
						<div
							key={color.code}
							className={`color-swatch${qty > 0 ? " color-swatch--active" : ""}${out ? " color-swatch--out" : ""}${color.type === "chrome" ? " color-swatch--chrome" : ""}`}
							style={swatchStyle(color)}
						>
							<div className="color-swatch-info" style={{ color: textColor }}>
								<span className="color-swatch-code">{sku}</span>
								<span className="color-swatch-name">{color.name}</span>
								<span className="color-swatch-stock">
									{out ? "Out of stock" : "In stock"}
								</span>
							</div>
							<div className="color-swatch-qty" style={{ color: textColor }}>
								<button
									type="button"
									className="color-qty-btn"
									onClick={() => changeQty(color, -1)}
									disabled={qty === 0}
									aria-label={`Decrease ${color.name}`}
								>
									-
								</button>
								<span className="color-qty-value">{qty}</span>
								<button
									type="button"
									className="color-qty-btn"
									onClick={() => changeQty(color, 1)}
									disabled={out || atMax}
									aria-label={`Add ${color.name} to cart`}
								>
									+
								</button>
							</div>
						</div>
					);
				})}
			</div>

			{!expanded && hiddenCount > 0 && (
				<button
					type="button"
					className="color-chart-more"
					onClick={() => setExpanded(true)}
				>
					show {hiddenCount} more
					<i className="fa-solid fa-chevron-down" aria-hidden />
				</button>
			)}
		</section>
	);
}
