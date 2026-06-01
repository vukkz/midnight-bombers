import Newsletter from "../components/Newsletter.jsx";

export default function About() {
	return (
		<>
			<section id="page-header" className="about-header">
				<h2>#KnowUs</h2>
				<p>The history of our company</p>
			</section>

			<section id="about-head" className="section-p1">
				<img src="/img/banners/bwlz.jpg" alt="" />
				<div>
					<h2>Who We Are?</h2>
					<p>
						Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do
						eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
						ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
						aliquip ex ea commodo consequat. Duis auteirure dolor in
						reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
						pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
						culpa qui officia deserunt mollit anim id est laborum.
					</p>
				</div>
			</section>

			<section id="about-app" className="section-p1">
				<h1>Download Our App</h1>
				<div className="video">
					<video autoPlay muted loop playsInline src="/img/banners/1.mp4" />
				</div>
			</section>

			<Newsletter />
		</>
	);
}
