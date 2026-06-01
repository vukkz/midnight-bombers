import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "mb-cart";

export function getCartKey(productId, colorCode) {
	return colorCode ? `${productId}::${colorCode}` : String(productId);
}

export function CartProvider({ children }) {
	const [items, setItems] = useState(() => {
		try {
			const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
			return raw.map((i) => ({
				...i,
				cartKey: i.cartKey || getCartKey(i.productId, i.colorCode),
			}));
		} catch {
			return [];
		}
	});

	useEffect(() => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
	}, [items]);

	const addItem = (product, quantity = 1, color = null) => {
		const cartKey = getCartKey(product._id, color?.code);
		const displayName = color
			? `${product.name} — ${color.name}`
			: product.name;

		setItems((prev) => {
			const existing = prev.find((i) => i.cartKey === cartKey);
			if (existing) {
				return prev.map((i) =>
					i.cartKey === cartKey ? { ...i, quantity: i.quantity + quantity } : i,
				);
			}
			return [
				...prev,
				{
					cartKey,
					productId: product._id,
					name: displayName,
					price: product.price,
					image: product.image,
					quantity,
					colorCode: color?.code,
					colorName: color?.name,
					colorHex: color?.hex,
				},
			];
		});
	};

	const setItemQuantity = (cartKey, quantity) => {
		if (quantity < 1) {
			removeItem(cartKey);
			return;
		}
		setItems((prev) =>
			prev.map((i) => (i.cartKey === cartKey ? { ...i, quantity } : i)),
		);
	};

	const updateQuantity = (cartKey, quantity) => setItemQuantity(cartKey, quantity);

	const removeItem = (cartKey) => {
		setItems((prev) => prev.filter((i) => i.cartKey !== cartKey));
	};

	const clearCart = () => setItems([]);

	const total = useMemo(
		() => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
		[items],
	);

	const count = useMemo(
		() => items.reduce((sum, i) => sum + i.quantity, 0),
		[items],
	);

	return (
		<CartContext.Provider
			value={{
				items,
				addItem,
				setItemQuantity,
				updateQuantity,
				removeItem,
				clearCart,
				total,
				count,
				getCartKey,
			}}
		>
			{children}
		</CartContext.Provider>
	);
}

export function useCart() {
	const ctx = useContext(CartContext);
	if (!ctx) throw new Error("useCart must be used within CartProvider");
	return ctx;
}
