export function hasColorVariants(product) {
	return Array.isArray(product.colorVariants) && product.colorVariants.length > 0;
}

export function findColorVariant(product, colorCode) {
	if (!colorCode || !hasColorVariants(product)) return null;
	return product.colorVariants.find((c) => c.code === colorCode) ?? null;
}

export function syncProductStockFromColors(product) {
	if (!hasColorVariants(product)) return;
	product.stock = product.colorVariants.reduce(
		(sum, c) => sum + Math.max(0, c.stock ?? 0),
		0,
	);
}

/** Returns an error message string, or null if stock is available. */
export function validateLineStock(product, { quantity, colorCode }) {
	const qty = Number(quantity);
	if (!Number.isFinite(qty) || qty < 1) {
		return "Invalid quantity";
	}

	if (colorCode) {
		const variant = findColorVariant(product, colorCode);
		if (!variant) {
			return `Color not found for ${product.name}`;
		}
		const available = variant.stock ?? 0;
		if (available < qty) {
			return `Insufficient stock for ${variant.name} (${available} left)`;
		}
		return null;
	}

	if (hasColorVariants(product)) {
		return `Please select a color for ${product.name}`;
	}

	if ((product.stock ?? 0) < qty) {
		return `Insufficient stock for ${product.name}`;
	}

	return null;
}

/** Mutates product in place. Call save() afterward. */
export function deductLineStock(product, { quantity, colorCode }) {
	const qty = Number(quantity);
	const err = validateLineStock(product, { quantity: qty, colorCode });
	if (err) throw new Error(err);

	if (colorCode) {
		const variant = findColorVariant(product, colorCode);
		variant.stock -= qty;
		syncProductStockFromColors(product);
		return;
	}

	product.stock -= qty;
}
