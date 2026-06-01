import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

export async function protect(req, res, next) {
	try {
		const token =
			req.cookies?.token ||
			(req.headers.authorization?.startsWith("Bearer ")
				? req.headers.authorization.split(" ")[1]
				: null);

		if (!token) {
			return res.status(401).json({ message: "Not authenticated" });
		}

		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		const user = await User.findById(decoded.id);

		if (!user) {
			return res.status(401).json({ message: "User not found" });
		}

		req.user = user;
		next();
	} catch {
		return res.status(401).json({ message: "Invalid or expired token" });
	}
}

export function requireAdmin(req, res, next) {
	if (req.user?.role !== "admin") {
		return res.status(403).json({ message: "Admin access required" });
	}
	next();
}
