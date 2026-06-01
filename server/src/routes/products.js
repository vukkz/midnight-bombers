import { Router } from "express";
import { Product } from "../models/Product.js";
import { protect, requireAdmin } from "../middleware/auth.js";
import { slugify } from "../utils/slugify.js";

function escapeRegExp(string) {
	return string.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");
}

const router = Router();

router.get("/", async (req, res, next) => {
	try {
		const page = Math.max(1, parseInt(req.query.page, 10) || 1);
		const limit = Math.min(24, Math.max(1, parseInt(req.query.limit, 10) || 8));
		const skip = (page - 1) * limit;

		const filter = {};
		if (req.query.category) filter.category = req.query.category;
		if (req.query.featured === "true") filter.featured = true;

		if (req.query.brand) {
			const brands = req.query.brand
				.split(",")
				.map((b) => b.trim())
				.filter(Boolean);
			if (brands.length) {
				filter.brand = {
					$in: brands.map((b) => new RegExp(`^${escapeRegExp(b)}$`, "i")),
				};
			}
		}

		if (req.query.search) {
			const search = req.query.search.trim();
			if (search) {
				const regex = new RegExp(escapeRegExp(search), "i");
				filter.$or = [{ name: regex }, { description: regex }];
			}
		}

		const [products, total] = await Promise.all([
			Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
			Product.countDocuments(filter),
		]);

		res.json({
			products,
			pagination: {
				page,
				limit,
				total,
				pages: Math.ceil(total / limit),
			},
		});
	} catch (err) {
		next(err);
	}
});

router.get("/:id", async (req, res, next) => {
	try {
		const bySlug = !req.params.id.match(/^[0-9a-fA-F]{24}$/);
		const product = bySlug
			? await Product.findOne({ slug: req.params.id })
			: await Product.findById(req.params.id);

		if (!product) {
			return res.status(404).json({ message: "Product not found" });
		}

		res.json({ product });
	} catch (err) {
		next(err);
	}
});

router.post("/", protect, requireAdmin, async (req, res, next) => {
	try {
		const data = normalizeProductBody(req.body);
		data.slug = slugify(data.name);

		const product = await Product.create(data);
		res.status(201).json({ product });
	} catch (err) {
		next(err);
	}
});

router.put("/:id", protect, requireAdmin, async (req, res, next) => {
	try {
		const data = normalizeProductBody(req.body);
		if (data.name) data.slug = slugify(data.name);

		const product = await Product.findByIdAndUpdate(req.params.id, data, {
			new: true,
			runValidators: true,
		});

		if (!product) {
			return res.status(404).json({ message: "Product not found" });
		}

		res.json({ product });
	} catch (err) {
		next(err);
	}
});

router.delete("/:id", protect, requireAdmin, async (req, res, next) => {
	try {
		const product = await Product.findByIdAndDelete(req.params.id);
		if (!product) {
			return res.status(404).json({ message: "Product not found" });
		}
		res.json({ message: "Product deleted" });
	} catch (err) {
		next(err);
	}
});

function normalizeProductBody(body) {
	const data = { ...body };
	if (data.size_ml !== undefined) {
		data.sizeMl = data.size_ml;
		delete data.size_ml;
	}
	return data;
}

export default router;
