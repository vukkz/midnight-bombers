import { useState } from "react";
import Newsletter from "../components/Newsletter.jsx";

export default function Contact() {
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		subject: "",
		message: "",
	});
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState("");

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setMessage("");

		try {
			const response = await fetch(
				`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}/api/contact/send`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(formData),
				},
			);

			const data = await response.json();

			if (data.success) {
				setMessage("✓ Message sent successfully! We'll get back to you soon.");
				setFormData({
					name: "",
					email: "",
					subject: "",
					message: "",
				});
			} else {
				setMessage("✗ Failed to send message. Please try again.");
			}
		} catch (error) {
			console.error("Error sending message:", error);
			setMessage("✗ An error occurred. Please try again later.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			<section id="page-header" className="about-header">
				<h2>#let&apos;s_talk</h2>
				<p>LEAVE A MESSAGE, We&apos;d love to hear from you!</p>
			</section>

			<section id="contact-details" className="section-p1">
				<div className="details">
					<span>GET IN TOUCH</span>
					<h2>Visit one of our agency locations or contact us today</h2>
					<h3>Head Office</h3>
					<ul>
						<li>
							<i className="far fa-map" />
							<p>Brace Jerkovic 150, Belgrade</p>
						</li>
						<li>
							<i className="far fa-envelope" />
							<p>midnightbombers.contact@gmail.com</p>
						</li>
						<li>
							<i className="fas fa-phone" />
							<p>+381601122334</p>
						</li>
						<li>
							<i className="far fa-clock" />
							<p>Monday to Saturday: 13:00 to 19:00PM</p>
						</li>
					</ul>
				</div>

				<div className="map">
					<iframe
						title="Midnight Bombers location"
						src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2830.174111157545!2d20.490392876676662!3d44.81801747631993!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x475a7a93528e0fd9%3A0xcd1c0261338a32c1!2sBwllz!5e0!3m2!1sen!2sus!4v1778938647376!5m2!1sen!2sus"
						width="600"
						height="450"
						style={{ border: 0 }}
						allowFullScreen
						loading="lazy"
						referrerPolicy="no-referrer-when-downgrade"
					/>
				</div>
			</section>

			<section id="form-details">
				<form action="" onSubmit={handleSubmit}>
					<span>LEAVE A MESSAGE</span>
					<h2>We&apos;d love to hear from you</h2>
					<input
						type="text"
						name="name"
						placeholder="Your Name"
						value={formData.name}
						onChange={handleChange}
						required
					/>
					<input
						type="email"
						name="email"
						placeholder="Email"
						value={formData.email}
						onChange={handleChange}
						required
					/>
					<input
						type="text"
						name="subject"
						placeholder="Subject"
						value={formData.subject}
						onChange={handleChange}
					/>
					<textarea
						cols={30}
						rows={10}
						name="message"
						placeholder="Your Message"
						value={formData.message}
						onChange={handleChange}
						required
					/>
					<button type="submit" className="normal" disabled={loading}>
						{loading ? "Sending..." : "Submit"}
					</button>
					{message && (
						<p
							style={{
								marginTop: "15px",
								color: message.includes("✓") ? "#28a745" : "#dc3545",
								fontWeight: "bold",
							}}
						>
							{message}
						</p>
					)}
				</form>

				{/* <div className="people">
					<div>
						<img src="/img/people/1.png" alt="Dejan (Jest)" />
						<p>
							<span>Dejan (Jest)</span> CEO <br />
							Phone: + 381 60 112 2334 <br />
							Email: bwllz.contact@gmail.com
						</p>
					</div>
				</div> */}
			</section>

			<Newsletter />
		</>
	);
}
