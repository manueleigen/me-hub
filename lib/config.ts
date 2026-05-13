// Feature flags for development
export const features = {
	// Authentication - set to true when ready to enable
	auth: true,

	// GitHub sync - use mock data when false
	githubSync: true,

	// Allow editing vault files
	editing: true,

	// Enable time tracking module
	timeTracking: true,

	// Enable product ideas module
	productIdeas: true,
};

// App configuration
export const appConfig = {
	name: "MeHub",
	description: "Your personal productivity and knowledge management system",

	// Default settings
	defaults: {
		currency: "EUR",
		locale: "de-DE",
		timezone: "Europe/Berlin",
	},
};
