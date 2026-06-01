import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import "./styles/style.css";
import "./styles/extras.css";
import "./styles/theme.css";

createRoot(document.getElementById("root")).render(
	<StrictMode>
		<BrowserRouter>
			<AuthProvider>
				<CartProvider>
					<App />
				</CartProvider>
			</AuthProvider>
		</BrowserRouter>
	</StrictMode>,
);
