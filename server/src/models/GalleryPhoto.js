import mongoose from "mongoose";

const galleryPhotoSchema = new mongoose.Schema(
	{
		image: { type: String, required: true },
		artist: { type: String, required: true, trim: true },
		sortOrder: { type: Number, default: 0 },
		active: { type: Boolean, default: true },
	},
	{ timestamps: true },
);

galleryPhotoSchema.index({ active: 1, sortOrder: 1 });

export const GalleryPhoto = mongoose.model("GalleryPhoto", galleryPhotoSchema);
