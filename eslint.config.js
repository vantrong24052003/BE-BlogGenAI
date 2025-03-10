import prettierPlugin from 'eslint-plugin-prettier'
import js from '@eslint/js'

export default [
  js.configs.recommended,
  {
    ignores: ['node_modules', 'dist', 'build', 'coverage', 'public', '.next', 'out'],
    languageOptions: {
      sourceType: 'module',
      ecmaVersion: 2020
    },
    plugins: {
      prettier: prettierPlugin
    },
    rules: {
      'no-undef': 'off',
      'no-unused-vars': 'off',
      'prettier/prettier': 'error'
    }
  }
]
