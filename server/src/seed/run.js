import dotenv from "dotenv";
import mongoose from "mongoose";
import { User } from "../models/User.js";
import { Product } from "../models/Product.js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { seedProducts } from "./catalog.js";
import { slugify } from "../utils/slugify.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const montanaColors = JSON.parse(
	readFileSync(
		join(__dirname, "../data/montana-black-400-colors.json"),
		"utf8",
	),
);
const mtn94Colors = JSON.parse(
	readFileSync(join(__dirname, "../data/mtn94-400-colors.json"), "utf8"),
);

dotenv.config();

function colorsWithStock(colors, defaultStock = 20) {
	return colors.map((c) => ({ ...c, stock: c.stock ?? defaultStock }));
}

async function seed() {
	const uri = process.env.MONGODB_URI;
	if (!uri) {
		console.error("Missing MONGODB_URI in server/.env");
		process.exit(1);
	}

	try {
		await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
	} catch (err) {
		console.error(
			"Could not connect to MongoDB.\n" +
				"  • Start local MongoDB, or\n" +
				"  • Set MONGODB_URI in server/.env to a MongoDB Atlas connection string.\n" +
				`  Details: ${err.message}`,
		);
		process.exit(1);
	}

	console.log("Seeding database...");

	await Product.deleteMany({});
	await User.deleteMany({ role: "admin" });

	const products = seedProducts.map((p) => {
		const { montanaBlackColors, mtn94Colors: hasMtn94Colors, ...rest } = p;
		const colorVariants = montanaBlackColors
			? colorsWithStock(montanaColors)
			: hasMtn94Colors
				? colorsWithStock(mtn94Colors)
				: undefined;
		const stock =
			colorVariants != null
				? colorVariants.reduce((sum, c) => sum + c.stock, 0)
				: (p.stock ?? 20);
		return {
			...rest,
			slug: slugify(p.name),
			stock,
			...(colorVariants ? { colorVariants } : {}),
		};
	});
	await Product.insertMany(products);
	console.log(`Inserted ${products.length} products`);

	const adminEmail = process.env.ADMIN_EMAIL || "admin@midnightbombers.com";
	const adminPassword = process.env.ADMIN_PASSWORD || "ChangeMe123!";

	await User.create({
		name: "Store Admin",
		email: adminEmail,
		password: adminPassword,
		role: "admin",
	});
	console.log(`Admin user: ${adminEmail}`);

	await mongoose.disconnect();
	console.log("Seed complete");
}

seed().catch((err) => {
	console.error(err);
	process.exit(1);
});
