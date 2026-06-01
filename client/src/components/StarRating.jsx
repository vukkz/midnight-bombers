export default function StarRating() {
	return (
		<div className="star">
			{Array.from({ length: 5 }).map((_, i) => (
				<i key={i} className="fas fa-star" />
			))}
		</div>
	);
}
