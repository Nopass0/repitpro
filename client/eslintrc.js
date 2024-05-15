module.exports = {
	parser: '@typescript-eslint/parser',
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
		'plugin:prettier/recommended', // Интеграция с Prettier
	],
	plugins: ['@typescript-eslint', 'prettier', 'unused-imports'],
	rules: {
		'prettier/prettier': 'error',
		'unused-imports/no-unused-imports': 'error',
		'unused-imports/no-unused-vars': [
			'warn',
			{
				vars: 'all',
				varsIgnorePattern: '^_',
				args: 'after-used',
				argsIgnorePattern: '^_',
			},
		],
		'@typescript-eslint/no-explicit-any': 'warn', // Измените на 'error', если хотите жестко контролировать
		'@typescript-eslint/ban-types': [
			'error',
			{
				types: {
					'{}': false,
				},
			},
		],
		'no-mixed-spaces-and-tabs': 'error',
		'no-empty-pattern': 'warn',
	},
}
