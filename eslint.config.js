import js from '@eslint/js';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * Convenciones de lint del proyecto (ESLint 9, flat config).
 *
 * Prettier se corre como regla de ESLint, asi que `.prettierrc` es la unica
 * fuente de verdad de formato y `prettierConfig` desactiva las reglas de ESLint
 * que chocarian con el.
 */
export default tseslint.config(
  {
    ignores: ['dist/**', 'build/**', 'node_modules/**', 'coverage/**', 'odd/**'],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Prettier como regla: desactiva reglas de estilo que contradigan al formateador.
  prettierConfig,

  {
    files: ['**/*.ts'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node },
    },
    plugins: { prettier },
    rules: {
      'prettier/prettier': 'error',

      // El proyecto loguea a proposito (arranque, diagnostico de sockets).
      'no-console': 'off',

      // TypeScript ya cubre esto; la regla base produce falsos positivos con tipos.
      'no-undef': 'off',

      // Argumentos sin usar se prefijan con _ para marcar la intencion.
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],

      // `any` explicito sigue siendo una Decision, pero se hace visible.
      '@typescript-eslint/no-explicit-any': 'warn',

      // Promesas flotando sin manageo son el fallo mas caro en una API: matan el proceso sin aviso.
      'no-unused-expressions': 'error',
      'prefer-const': 'error',
      eqeqeq: ['error', 'smart'],
      'no-var': 'error',
    },
  },

  {
    // Los tests pueden usar mocks laxos sin contaminar las reglas de src.
    files: ['test/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
);
