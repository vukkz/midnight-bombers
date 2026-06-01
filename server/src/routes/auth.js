import { Router } from "express";
import { User } from "../models/User.js";
import { protect } from "../middleware/auth.js";
import { setAuthCookie, signToken } from "../utils/token.js";

const router = Router();

router.post("/register", async (req, res, next) => {
	try {
		const { name, email, password } = req.body;

		if (!name?.trim() || !email?.trim() || !password) {
			return res.status(400).json({ message: "Name, email and password are required" });
		}

		if (password.length < 8) {
			return res.status(400).json({ message: "Password must be at least 8 characters" });
		}

		const exists = await User.findOne({ email: email.toLowerCase() });
		if (exists) {
			return res.status(409).json({ message: "Email already registered" });
		}

		const user = await User.create({ name: name.trim(), email, password });
		const token = signToken(user._id);
		setAuthCookie(res, token);

		res.status(201).json({
			user: {
				id: user._id,
				name: user.name,
				email: user.email,
				role: user.role,
			},
		});
	} catch (err) {
		next(err);
	}
});

router.post("/login", async (req, res, next) => {
	try {
		const { email, password } = req.body;

		if (!email?.trim() || !password) {
			return res.status(400).json({ message: "Email and password are required" });
		}

		const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
		if (!user || !(await user.comparePassword(password))) {
			return res.status(401).json({ message: "Invalid email or password" });
		}

		const token = signToken(user._id);
		setAuthCookie(res, token);

		res.json({
			user: {
				id: user._id,
				name: user.name,
				email: user.email,
				role: user.role,
			},
		});
	} catch (err) {
		next(err);
	}
});

router.post("/logout", (req, res) => {
	res.clearCookie("token");
	res.json({ message: "Logged out" });
});

router.get("/me", protect, (req, res) => {
	res.json({
		user: {
			id: req.user._id,
			name: req.user.name,
			email: req.user.email,
			role: req.user.role,
		},
	});
});

export default router;
