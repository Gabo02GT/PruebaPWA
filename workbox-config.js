module.exports = {
	globDirectory: 'src/',
	globPatterns: [
		'**/*.{css,tsx,svg}'
	],
	swDest: 'public/sw.js',
	ignoreURLParametersMatching: [
		/^utm_/,
		/^fbclid$/
	]
};