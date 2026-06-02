import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
	{
		name: { type: String, required: true, trim: true },
		slug: { type: String, required: true, unique: true, lowercase: true },
		price: { type: Number, required: true, min: 0 },
		image: { type: String, required: true },
		description: { type: String, required: true },
		sizeMl: { type: Number },
		category: {
			type: String,
			required: true,
			enum: ["spray paint", "marker", "cap", "accessory"],
		},
		brand: { type: String, trim: true },
		stock: { type: Number, required: true, min: 0, default: 20 },
		featured: { type: Boolean, default: false },
		descriptionPoints: [{ type: String }],
		colorVariants: [
			{
				code: { type: String, required: true },
				name: { type: String, required: true },
				hex: { type: String, required: true },
				stock: { type: Number, min: 0, default: 20 },
				type: {
					type: String,
					enum: ["matte", "chrome", "transparent", "power", "infra"],
					default: "matte",
				},
			},
		],
	},
	{ timestamps: true },
);

productSchema.index({ category: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ featured: 1 });

export const Product = mongoose.model("Product", productSchema);
