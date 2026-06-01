import { useEffect } from "react";

/**
 * Reveals any `.reveal` elements currently in the DOM as they scroll into view
 * by toggling the `is-visible` class. Pass dependencies (e.g. loading state)
 * so freshly rendered elements get observed once they exist.
 */
export function useReveal(deps = []) {
	useEffect(() => {
		if (typeof IntersectionObserver === "undefined") return;

		const elements = Array.from(
			document.querySelectorAll(".reveal:not(.is-visible)"),
		);
		if (elements.length === 0) return;

		const prefersReduced = window.matchMedia(
			"(prefers-reduced-motion: reduce)",
		).matches;

		if (prefersReduced) {
			elements.forEach((el) => el.classList.add("is-visible"));
			return;
		}

		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						entry.target.classList.add("is-visible");
						observer.unobserve(entry.target);
					}
				});
			},
			{ threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
		);

		elements.forEach((el) => observer.observe(el));
		return () => observer.disconnect();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, deps);
}
