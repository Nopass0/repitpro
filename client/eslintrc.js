module.exports = {
	"env": {
	  "browser": true,
	  "es2021": true,
	  "node": true
	},
	"extends": [
	  "eslint:recommended",
	  "plugin:@typescript-eslint/recommended",
	  "plugin:prettier/recommended"
	],
	"parser": "@typescript-eslint/parser",
	"parserOptions": {
	  "ecmaVersion": 12,
	  "sourceType": "module"
	},
	"plugins": [
	  "@typescript-eslint",
	  "unused-imports"
	],
	"rules": {
	  "prettier/prettier": "error",
	  "unused-imports/no-unused-imports": "error",
	  "unused-imports/no-unused-vars": [
		"warn",
		{
		  "vars": "all",
		  "varsIgnorePattern": "^_",
		  "args": "after-used",
		  "argsIgnorePattern": "^_"
		}
	  ],
	  "@typescript-eslint/no-explicit-any": "off", // Отключить ошибку для any
	  "@typescript-eslint/ban-types": [
		"error",
		{
		  "types": {
			"{}": false
		  }
		}
	  ],
	  "no-mixed-spaces-and-tabs": "off", // Отключить ошибку для смешанных пробелов и табов
	  "no-empty-pattern": "off" // Отключить ошибку для пустых паттернов
	}
  }
  