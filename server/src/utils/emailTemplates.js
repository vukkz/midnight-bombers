// Email templates - Edit these to customize your emails
export const emailTemplates = {
	welcome: {
		subject: "Welcome to Midnight Bombers Newsletter!",
		getHtml: (email) => `
			<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
				<h2 style="color: #333;">Welcome to Midnight Bombers!</h2>
				<p>Thank you for subscribing to our newsletter.</p>
				<p>We'll keep you updated on:</p>
				<ul>
					<li>Latest products and collections</li>
					<li>Special offers and discounts</li>
					<li>New blog posts and tips</li>
				</ul>
				<p>Stay tuned for amazing content coming your way!</p>
				<hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
				<p style="color: #999; font-size: 12px;">
					Don't want to receive emails? 
					<a href="${process.env.CLIENT_URL}/unsubscribe?email=${email}" style="color: #999;">
						Unsubscribe here
					</a>
				</p>
			</div>
		`,
	},
};
