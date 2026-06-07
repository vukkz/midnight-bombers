export const DEFAULT_GALLERY = [
	{ image: "/img/banners/IMG_3198.jpg", artist: "@nightcrawler", sortOrder: 0 },
	{ image: "/img/banners/IMG_3176.jpg", artist: "@bgd_writer", sortOrder: 1 },
	{ image: "/img/banners/IMG_3191.jpg", artist: "@kraljica", sortOrder: 2 },
	{ image: "/img/blog/IMG_2087.jpg", artist: "@toofly", sortOrder: 3 },
	{ image: "/img/banners/IMG_3182.jpg", artist: "@vandal021", sortOrder: 4 },
	{ image: "/img/blog/IMG_2556.jpg", artist: "@bombsquad", sortOrder: 5 },
];

export async function ensureGallerySeeded() {
	const { GalleryPhoto } = await import("../models/GalleryPhoto.js");
	const count = await GalleryPhoto.countDocuments();
	if (count > 0) return;

	await GalleryPhoto.insertMany(DEFAULT_GALLERY);
	console.log(`[gallery] seeded ${DEFAULT_GALLERY.length} default photos`);
}
