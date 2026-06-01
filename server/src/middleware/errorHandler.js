export function errorHandler(err, req, res, next) {
	console.error(err);

	if (err.name === "ValidationError") {
		return res.status(400).json({ message: err.message });
	}

	if (err.code === 11000) {
		return res.status(409).json({ message: "Duplicate field value" });
	}

	if (err.name === "CastError") {
		return res.status(400).json({ message: "Invalid id" });
	}

	res.status(err.statusCode || 500).json({
		message: err.message || "Server error",
	});
}
