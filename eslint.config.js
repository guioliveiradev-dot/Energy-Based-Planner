// ESLint: avisa de erros enquanto você edita (variável não usada, nome errado, import quebrado...).
// No VS Code, instale a extensão "ESLint". No terminal: npm run lint
import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['node_modules/'] },
  js.configs.recommended,
  {
    files: ['js/**/*.js', 'eslint.config.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser, confetti: 'readonly' },   // confetti vem do CDN (index.html)
    },
    rules: {
      'no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none' }],
      'no-undef': 'error',
    },
  },
  {
    files: ['sw.js'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'script', globals: globals.serviceworker },
  },
  {
    files: ['tests/**/*.mjs'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: { ...globals.node, ...globals.browser } },
    rules: { 'no-unused-vars': 'off', 'no-empty': 'off' },
  },
];
