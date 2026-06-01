export function displayCode(code) {
	if (!code || typeof code !== "string") return "";

	const normalized = code.trim();
	const numericMatch = normalized.match(/^([A-Za-z]+)[\s-]+(\d+)$/);
	if (numericMatch) {
		const prefix = numericMatch[1].toUpperCase();
		const suffix = numericMatch[2];
		return `${prefix}-${suffix}`;
	}

	return normalized;
}

export function textOnColor(hex) {
	if (!hex || hex.length < 4) return "#000";
	const h = hex.replace("#", "").slice(0, 6);
	if (h.length !== 6) return "#000";
	const r = parseInt(h.slice(0, 2), 16);
	const g = parseInt(h.slice(2, 4), 16);
	const b = parseInt(h.slice(4, 6), 16);
	const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
	return luminance > 0.55 ? "#000" : "#fff";
}

export function swatchStyle(color) {
	if (color.type === "chrome") {
		const gradients = {
			"BLK CHR G":
				"linear-gradient(135deg, #f4e4a6 0%, #d4af37 50%, #8b6914 100%)",
			"BLK CHR C":
				"linear-gradient(135deg, #e8a87c 0%, #b87333 50%, #6b3a1a 100%)",
			"BLK CHR S":
				"linear-gradient(135deg, #f0f0f0 0%, #c0c0c0 50%, #808080 100%)",
			"BLK CHR OS":
				"linear-gradient(135deg, #fff 0%, #e0e0e0 50%, #a0a0a0 100%)",
		};
		return { background: gradients[color.code] || color.hex };
	}
	return { backgroundColor: color.hex };
}
