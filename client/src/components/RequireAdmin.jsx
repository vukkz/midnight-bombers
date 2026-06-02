import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import LoadingSpinner from "./LoadingSpinner.jsx";

export default function RequireAdmin({ children }) {
	const { user, loading } = useAuth();

	if (loading) {
		return (
			<div className="admin-loading">
				<LoadingSpinner message="Checking access..." />
			</div>
		);
	}

	if (!user) return <Navigate to="/login" replace />;
	if (user.role !== "admin") return <Navigate to="/" replace />;

	return children;
}
