import { Link } from "react-router-dom";

export default function Footer() {
	return (
		<footer className="section-p1">
			<div className="col">
				<img
					className="logo"
					src="/img/logo/midnightbombersblack.png"
					alt="Midnight Bombers"
					height="70"
				/>
				<h4>Contact</h4>
				<p>
					<strong>Address:</strong> Brace Jerkovic 150, Belgrade
				</p>
				<p>
					<strong>Phone:</strong> +381601122334
				</p>
				<p>
					<strong>Hours:</strong> 12:00 - 20:00, Mon - Sat
				</p>
				<div className="follow">
					<h4>Follow us</h4>
					<div className="icon">
						<i className="fab fa-facebook-f" />
						<i className="fab fa-twitter" />
						<i className="fab fa-instagram" />
						<i className="fab fa-pinterest-p" />
						<i className="fab fa-youtube" />
					</div>
				</div>
			</div>

			<div className="col">
				<h4>About</h4>
				<Link to="/about">About us</Link>
				<a href="#delivery">Delivery Information</a>
				<a href="#privacy">Privacy Policy</a>
				<a href="#terms">Terms & Conditions</a>
				<Link to="/contact">Contact Us</Link>
			</div>

			<div className="col">
				<h4>My Account</h4>
				<Link to="/login">Sign In</Link>
				<Link to="/cart">View Cart</Link>
				<a href="#wishlist">My Wishlist</a>
				<Link to="/account">Track My Order</Link>
				<a href="#help">Help</a>
			</div>

			<div className="col install">
				<h4>Install App</h4>
				<p>From App Store or Google Play</p>
				<div className="row">
					<img src="/img/logo/app.jpg" alt="App Store" />
					<img src="/img/logo/play.jpg" alt="Google Play" />
				</div>
				<p>Secured Payment Gateways</p>
				<img src="/img/logo/pay.png" alt="Payment methods" />
			</div>

			<div className="copyright">
				<p>© {new Date().getFullYear()} Midnight Bombers</p>
			</div>
		</footer>
	);
}
