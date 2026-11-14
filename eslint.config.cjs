module.exports = [
	...require('@vanilla-bean/components/eslint.app.config.cjs'),
	{
		rules: {
			'no-console': 'off',
		},
	},
	...require('@vanilla-bean/components/eslint.usage.config.cjs'),
];
