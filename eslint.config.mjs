import eslint from '@eslint/js'
import eslintPluginImport from 'eslint-plugin-import'
import prettierPlugin from 'eslint-plugin-prettier'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**']
  },
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['*.js', '*.mjs', 'vitest.config.ts']
        },
        tsconfigRootDir: process.cwd()
      },
      sourceType: 'module'
    },
    plugins: {
      import: eslintPluginImport,
      prettier: prettierPlugin
    },
    settings: {
      'import/resolver': {
        node: true
      }
    },
    rules: {
      ...prettierPlugin.configs.recommended.rules,
      ...eslintPluginImport.configs.recommended.rules,
      '@typescript-eslint/no-extraneous-class': 'off',
      'import/no-absolute-path': 'error',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '_',
          varsIgnorePattern: '_',
          caughtErrorsIgnorePattern: '_'
        }
      ],
      'import/no-unresolved': 'off',
      'import/named': 'off',
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            ['parent', 'sibling', 'index']
          ],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true }
        }
      ]
    }
  },
  {
    files: ['eslint.config.mjs'],
    ...tseslint.configs.disableTypeChecked
  },
  {
    files: ['eslint.config.mjs'],
    languageOptions: {
      globals: {
        process: 'readonly'
      }
    }
  }
)
