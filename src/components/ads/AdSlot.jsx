import { useEffect, useRef, useState } from 'react'
import { ADS_LIVE, ADSENSE_CLIENT, ADSENSE_DEFAULT_SLOT, ADSENSE_TEST, loadAdsense } from './adsense.js'

/**
 * Drop-in Google AdSense ad unit.
 *
 *   <AdSlot />                                   // default slot from VITE_ADSENSE_SLOT
 *   <AdSlot slot="1234567890" />                 // a specific ad unit
 *   <AdSlot slot="1234567890" format="rectangle" label="Sponsored" className="my-6" />
 *   <AdSlot slot="1234567890" format="fixed" width={728} height={90} />
 *
 * Props
 *   slot        ad unit id (data-ad-slot). Falls back to VITE_ADSENSE_SLOT.
 *   format      'auto' (default) | 'rectangle' | 'horizontal' | 'vertical' | 'fluid' | 'fixed'
 *   width/height  only for format="fixed"
 *   label       small caption above the ad; pass '' to hide it
 *   minHeight   reserves space so the page doesn't jump (default 90px)
 *   className   wrapper classes
 *
 * Ads sirf live site par load hote hain (production build + non-localhost domain).
 * Baaki jagah kuch render nahi hota; dev mein dashed placeholder dikhta hai.
 * Ad blocker ya unfilled ad par slot collapse ho jata hai.
 */
export default function AdSlot({
  slot = ADSENSE_DEFAULT_SLOT,
  format = 'auto',
  width,
  height,
  label = 'Advertisement',
  minHeight = 90,
  className = ''
}) {
  const insRef = useRef(null)
  const [blocked, setBlocked] = useState(false)
  const [unfilled, setUnfilled] = useState(false)
  const configured = !!(ADSENSE_CLIENT && slot) && ADS_LIVE()

  useEffect(() => {
    if (!configured) return undefined
    let cancelled = false
    let observer
    setBlocked(false)
    setUnfilled(false)

    loadAdsense()
      .then(() => {
        const ins = insRef.current
        if (cancelled || !ins) return

        // AdSense jab ad nahi bharta to data-ad-status="unfilled" set karta hai
        observer = new MutationObserver(() => {
          if (ins.getAttribute('data-ad-status') === 'unfilled') setUnfilled(true)
        })
        observer.observe(ins, { attributes: true, attributeFilter: ['data-ad-status'] })

        // Status attribute tab set hota hai jab AdSense is <ins> ko process kar chuka ho
        if (ins.dataset.adsbygoogleStatus) return

        try {
          ;(window.adsbygoogle = window.adsbygoogle || []).push({})
        } catch (e) {
          console.warn('AdSense push error:', e)
        }
      })
      .catch(() => !cancelled && setBlocked(true))

    return () => {
      cancelled = true
      observer?.disconnect()
    }
  }, [configured, slot, format])

  if (!configured) {
    if (!import.meta.env.DEV) return null
    return (
      <div
        className={`rounded-xl border border-dashed border-line-strong text-center text-xs text-ink/45 px-4 py-6 ${className}`}
        style={{ minHeight }}
      >
        Ad slot placeholder — set <code>VITE_ADSENSE_CLIENT</code> and a slot id to show ads here.
      </div>
    )
  }

  if (blocked || unfilled) return null // gap chhodne ki jagah collapse

  const fixed = format === 'fixed'
  const insStyle = fixed ? { display: 'inline-block', width, height } : { display: 'block' }

  return (
    // key se slot/format badalne par naya <ins> banta hai
    <div key={`${slot}-${format}`} className={`w-full overflow-hidden ${className}`} style={{ minHeight }}>
      {label && (
        <p className="text-[10px] uppercase tracking-wider text-ink/35 mb-1 text-center">{label}</p>
      )}
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