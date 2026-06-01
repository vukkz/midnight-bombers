import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
	product: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Product",
		required: true,
	},
	name: { type: String, required: true },
	image: { type: String, required: true },
	price: { type: Number, required: true },
	quantity: { type: Number, required: true, min: 1 },
	colorCode: { type: String },
	colorName: { type: String },
});

const orderSchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		items: { type: [orderItemSchema], required: true },
		total: { type: Number, required: true, min: 0 },
		status: {
			type: String,
			enum: ["pending", "paid", "shipped", "delivered", "cancelled"],
			default: "pending",
		},
		shippingAddress: {
			fullName: { type: String, required: true },
			phone: { type: String, required: true },
			street: { type: String, required: true },
			city: { type: String, required: true },
			postalCode: { type: String, required: true },
			country: { type: String, default: "Serbia" },
		},
	},
	{ timestamps: true },
);

export const Order = mongoose.model("Order", orderSchema);
