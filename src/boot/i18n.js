import { createI18n } from 'vue-i18n'
import messages from 'src/i18n'
let i18n = null
export default ({ app }) => {
  // Create I18n instance
  i18n = createI18n({
    locale: 'vn-VN',
    // locale: 'en-US',
    legacy: false,
    globalInjection: true,
    messages,
  })

  // Tell app to use the I18n instance
  app.use(i18n)
}

export { i18n }
