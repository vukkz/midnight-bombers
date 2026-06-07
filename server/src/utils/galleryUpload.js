import { mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import multer from "multer";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const galleryUploadsDir = join(__dirname, "../../uploads/gallery");
mkdirSync(galleryUploadsDir, { recursive: true });

export const galleryUpload = multer({
	storage: multer.diskStorage({
		destination: (_req, _file, cb) => cb(null, galleryUploadsDir),
		filename: (_req, file, cb) => {
			const ext = file.originalname.match(/\.[a-zA-Z0-9]+$/)?.[0] || ".jpg";
			const safe = file.originalname
				.replace(/\.[a-zA-Z0-9]+$/, "")
				.replace(/[^a-zA-Z0-9-_]/g, "-")
				.slice(0, 40);
			cb(null, `${Date.now()}-${safe}${ext.toLowerCase()}`);
		},
	}),
	limits: { fileSize: 8 * 1024 * 1024 },
	fileFilter: (_req, file, cb) => {
		if (file.mimetype.startsWith("image/")) cb(null, true);
		else cb(new Error("Only image files are allowed"));
	},
});
