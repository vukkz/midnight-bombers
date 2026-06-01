import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);

	const refreshUser = useCallback(async () => {
		for (let attempt = 0; attempt < 5; attempt++) {
			try {
				const data = await api.get("/api/auth/me");
				setUser(data.user);
				setLoading(false);
				return;
			} catch (err) {
				if (err.message !== "Failed to fetch" || attempt === 4) {
					setUser(null);
					setLoading(false);
					return;
				}
				await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
			}
		}
	}, []);

	useEffect(() => {
		refreshUser();
	}, [refreshUser]);

	const login = async (email, password) => {
		const data = await api.post("/api/auth/login", { email, password });
		setUser(data.user);
		return data.user;
	};

	const register = async (name, email, password) => {
		const data = await api.post("/api/auth/register", { name, email, password });
		setUser(data.user);
		return data.user;
	};

	const logout = async () => {
		await api.post("/api/auth/logout");
		setUser(null);
	};

	return (
		<AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error("useAuth must be used within AuthProvider");
	return ctx;
}
