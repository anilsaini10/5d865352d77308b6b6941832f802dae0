import { useEffect, useRef, useState } from 'react'
import { ADS_LIVE, ADSENSE_CLIENT, ADSENSE_DEFAULT_SLOT, ADSENSE_TEST, loadAdsense } from './adsense.js'

/**
 * Drop-in Google AdSense ad unit. Use it on any page that sits behind login:
 *
 *   <AdSlot />                                   // default slot from VITE_ADSENSE_SLOT
 *   <AdSlot slot="1234567890" />                 // a specific ad unit
 *   <AdSlot slot="1234567890" format="rectangle" label="Sponsored" className="my-6" />
 *   <AdSlot slot="1234567890" format="fixed" width={728} height={90} />
 *
 * Props
 *   slot        ad unit id (data-ad-slot). Falls back to VITE_ADSENSE_SLOT.
 *   format      'auto' (responsive, default) | 'rectangle' | 'horizontal' | 'vertical' | 'fluid' | 'fixed'
 *   width/height  only for format="fixed"
 *   label       small caption above the ad; pass '' to hide it
 *   minHeight   reserves space so the page doesn't jump when the ad fills (default 90px)
 *   className   wrapper classes
 *
 * Ads only load on the live site (production build on a non-localhost domain). Renders nothing elsewhere,
 * when AdSense isn't configured, or when the script is blocked.
 * In development it shows a dashed placeholder so you can see where ads will go.
 */
export default function AdSlot({ slot = ADSENSE_DEFAULT_SLOT, format = 'auto', width, height, label = 'Advertisement', minHeight = 90, className = '' }) {
  const insRef = useRef(null)
  const [blocked, setBlocked] = useState(false)
  const configured = !!(ADSENSE_CLIENT && slot) && ADS_LIVE()

  useEffect(() => {
    if (!configured) return undefined
    let cancelled = false
    setBlocked(false)
    loadAdsense()
      .then(() => {
        const ins = insRef.current
        // The status attribute is set once AdSense has processed this <ins>; skip if already filled
        // (React StrictMode runs effects twice in development).
        if (cancelled || !ins || ins.dataset.adsbygoogleStatus) return
        try {
          ;(window.adsbygoogle = window.adsbygoogle || []).push({})
        } catch {
          // AdSense throws if the slot is invalid or already filled — nothing to recover
        }
      })
      .catch(() => !cancelled && setBlocked(true))
    return () => {
      cancelled = true
    }
  }, [configured, slot, format])

  if (!configured) {
    if (!import.meta.env.DEV) return null // not live (or not configured): render nothing
    return (
      <div className={`rounded-xl border border-dashed border-line-strong text-center text-xs text-ink/45 px-4 py-6 ${className}`} style={{ minHeight }}>
        Ad slot placeholder — set <code>VITE_ADSENSE_CLIENT</code> and a slot id to show ads here.
      </div>
    )
  }
  if (blocked) return null // ad blocker or network failure: collapse instead of leaving a gap

  const fixed = format === 'fixed'
  const insStyle = fixed ? { display: 'inline-block', width, height } : { display: 'block' }

  return (
    // key forces a fresh <ins> when the slot changes, since AdSense can't re-render an existing one
    <div key={`${slot}-${format}`} className={`w-full overflow-hidden ${className}`} style={{ minHeight }}>
      {label && <p className="text-[10px] uppercase tracking-wider text-ink/35 mb-1 text-center">{label}</p>}
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={insStyle}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        {...(!fixed && { 'data-ad-format': format })}
        {...(format === 'auto' && { 'data-full-width-responsive': 'true' })}
        {...(ADSENSE_TEST && { 'data-adtest': 'on' })}
      />
    </div>
  )
}
