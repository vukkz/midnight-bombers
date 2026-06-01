export default function LoadingSpinner({ message = "LOADING" }) {
	return (
		<div className="loading-spinner-container">
			<div className="loading-spinner">
				<div className="spinner" />
				<p>{message}</p>
			</div>
		</div>
	);
}
