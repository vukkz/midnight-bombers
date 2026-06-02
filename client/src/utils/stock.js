export function hasColorVariants(product) {
	return Array.isArray(product?.colorVariants) && product.colorVariants.length > 0;
}

export function getColorStock(color) {
	return Math.max(0, color?.stock ?? 0);
}

export function countColorsInStock(product) {
	if (!hasColorVariants(product)) return 0;
	return product.colorVariants.filter((c) => getColorStock(c) > 0).length;
}

export function isSimpleProductOutOfStock(product) {
	return !hasColorVariants(product) && (product.stock ?? 0) <= 0;
}

export function isAllColorsOutOfStock(product) {
	if (!hasColorVariants(product)) return false;
	return countColorsInStock(product) === 0;
}

export function canQuickAddToCart(product) {
	return !hasColorVariants(product) && !isSimpleProductOutOfStock(product);
}

export function getAvailableSimpleStock(product) {
	return Math.max(0, product?.stock ?? 0);
}

export function canAddColorToCart(color, cartQty = 0) {
	return getColorStock(color) > cartQty;
}
