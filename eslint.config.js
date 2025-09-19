import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import {
  defineConfigWithVueTs,
  vueTsConfigs,
} from '@vue/eslint-config-typescript'
import vuePrettier from '@vue/eslint-config-prettier/skip-formatting'

const baseConfigs = defineConfigWithVueTs(
  js.configs.recommended,
  pluginVue.configs['flat/recommended'],
  vueTsConfigs.recommended,
)

export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      '**/*.cjs',
    ],
  },
  ...baseConfigs,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
  vuePrettier,
]
