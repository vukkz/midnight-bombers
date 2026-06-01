import mongoose from "mongoose";

const newsletterSchema = new mongoose.Schema(
	{
		email: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			trim: true,
			match: [
				/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
				"Please provide a valid email",
			],
		},
		subscribed: {
			type: Boolean,
			default: true,
		},
		unsubscribeToken: {
			type: String,
			unique: true,
			sparse: true,
		},
	},
	{ timestamps: true },
);

export const Newsletter = mongoose.model("Newsletter", newsletterSchema);
