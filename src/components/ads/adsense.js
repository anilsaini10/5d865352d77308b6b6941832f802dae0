export const ADSENSE_CLIENT = import.meta.env.VITE_ADSENSE_CLIENT || ''
export const ADSENSE_DEFAULT_SLOT = import.meta.env.VITE_ADSENSE_SLOT || ''
export const ADSENSE_TEST = import.meta.env.VITE_ADSENSE_TEST === 'true'

const LOCAL_HOSTS = ['localhost', '127.0.0.1', '[::1]', '0.0.0.0']

const SCRIPT_SRC = 'pagead2.googlesyndication.com/pagead/js/adsbygoogle.js'

/** Ads sirf production build + real domain par (npm run dev ya localhost par nahi). */
export const ADS_LIVE = () =>
  import.meta.env.PROD &&
  typeof window !== 'undefined' &&
  !LOCAL_HOSTS.includes(window.location.hostname)

let loader = null
let scriptLoaded = false

export function loadAdsense() {
  if (!ADSENSE_CLIENT) {
    return Promise.reject(new Error('AdSense client is not configured'))
  }

  if (!ADS_LIVE()) {
    return Promise.reject(new Error('AdSense is disabled'))
  }

  if (scriptLoaded || window.adsbygoogle?.loaded) return Promise.resolve()
  if (loader) return loader

  loader = new Promise((resolve, reject) => {
    let script = document.querySelector(`script[src*="${SCRIPT_SRC}"]`)
    const created = !script

    if (created) {
      script = document.createElement('script')
      script.async = true
      script.crossOrigin = 'anonymous'
      script.src = `https://${SCRIPT_SRC}?client=${encodeURIComponent(ADSENSE_CLIENT)}`
    }

    script.addEventListener(
      'load',
      () => {
        scriptLoaded = true
        resolve()
      },
      { once: true }
    )

    script.addEventListener(
      'error',
      () => {
        loader = null
        if (created) script.remove() // sirf apna banaya hua tag hatao
        reject(new Error('AdSense script failed to load'))
      },
      { once: true }
    )

    if (created) document.head.appendChild(script)
  })

  return loader
}