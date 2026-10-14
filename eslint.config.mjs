import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  rules: {
    'vue/attributes-order': 'off',
    'vue/html-self-closing': 'off',
    'vue/require-default-prop': 'off',
  },
})
