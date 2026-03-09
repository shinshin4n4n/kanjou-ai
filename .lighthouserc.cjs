/** @type {import('@lhci/cli').UserConfig} */
module.exports = {
	ci: {
		collect: {
			startServerCommand: "npm run start",
			startServerReadyPattern: "Ready",
			url: ["http://localhost:3000/login"],
			numberOfRuns: 3,
			settings: {
				chromeFlags: "--no-sandbox --headless",
				skipAudits: ["uses-http2"],
			},
		},
		assert: {
			assertions: {
				"categories:performance": ["warn", { minScore: 0.8 }],
				"categories:accessibility": ["error", { minScore: 0.9 }],
				"categories:best-practices": ["error", { minScore: 0.9 }],
			},
		},
		upload: {
			target: "temporary-public-storage",
		},
	},
};
