import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { ExternalLink, LocateFixed, MapPinOff, Save, Search } from 'lucide-react'
import AppShell from '../../../components/AppShell.jsx'
import { Alert, Button, Field, PageLoader, Section, inputClass, selectClass } from '../../../components/ui.jsx'
import { useToast } from '../../../context/ToastContext.jsx'
import { getErrorMessage } from '../../../api/httpClient.js'
import { BOARD_LABELS, BOARD_OPTIONS, SCHOOL_TYPE_LABELS, SCHOOL_TYPE_OPTIONS } from '../../schools/schools.types.js'
import {
  EMAIL_PATTERN, ESTABLISHED_YEAR_MAX, ESTABLISHED_YEAR_MIN, LATITUDE_MAX, LATITUDE_MIN, LONGITUDE_MAX, LONGITUDE_MIN,
  PHONE_PATTERN, SESSION_MONTH_MAX, SESSION_MONTH_MIN, URL_PATTERN,
} from '../../schools/schools.validation.js'
import { schoolApi } from './school.api.js'
import { buildChangedPayload, mapsUrl, osmEmbedUrl, parseFieldErrors, toSchoolFormValues } from './school.utils.js'

const phone = { pattern: { value: PHONE_PATTERN, message: 'Phone must be 10-15 characters.' } }
const email = { pattern: { value: EMAIL_PATTERN, message: 'Enter a valid email address.' } }
const url = { pattern: { value: URL_PATTERN, message: 'Enter a valid URL.' } }
const nonNegative = { min: { value: 0, message: 'Must be 0 or more.' } }
const hasValue = (v) => v !== '' && v != null && Number.isFinite(Number(v))

export default function SchoolSettingsPage() {
  const { notify } = useToast()
  const [school, setSchool] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [serverError, setServerError] = useState('')
  const [saving, setSaving] = useState(false)
  const [locating, setLocating] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [locationError, setLocationError] = useState('')

  const { register, handleSubmit, reset, setValue, setError, clearErrors, watch, formState: { errors } } = useForm({ defaultValues: toSchoolFormValues(null) })

  useEffect(() => {
    let cancelled = false
    schoolApi
      .get()
      .then((s) => {
        if (cancelled) return
        setSchool(s)
        reset(toSchoolFormValues(s))
      })
      .catch((err) => !cancelled && setLoadError(getErrorMessage(err, 'Could not load school details.')))
    return () => {
      cancelled = true
    }
  }, [reset])

  const lat = watch('latitude')
  const lng = watch('longitude')
  const hasCoords = hasValue(lat) && hasValue(lng) && Math.abs(Number(lat)) <= LATITUDE_MAX && Math.abs(Number(lng)) <= LONGITUDE_MAX

  const showServerErrors = (err, fallback) => {
    const message = getErrorMessage(err, fallback)
    const fields = parseFieldErrors(message)
    const known = Object.keys(fields).filter((k) => k in toSchoolFormValues(null))
    if (known.length === 0) {
      setServerError(message)
      return
    }
    known.forEach((k) => setError(k, { type: 'server', message: fields[k] }))
    setServerError('Fix the highlighted fields and save again.')
  }

  const onSubmit = async (values) => {
    setServerError('')
    setLocationError('')
    const bothOrNeither = hasValue(values.latitude) === hasValue(values.longitude)
    if (!bothOrNeither) {
      const field = hasValue(values.latitude) ? 'longitude' : 'latitude'
      setError(field, { type: 'validate', message: 'Enter both latitude and longitude, or leave both empty.' })
      return
    }
    const payload = buildChangedPayload(values, school)
    if (Object.keys(payload).length === 0) {
      notify('No changes to save.', 'info')
      return
    }
    setSaving(true)
    try {
      const updated = await schoolApi.update(payload)
      setSchool(updated)
      reset(toSchoolFormValues(updated))
      notify('School details updated.', 'success')
    } catch (err) {
      showServerErrors(err, 'Could not update school details.')
    } finally {
      setSaving(false)
    }
  }

  const useMyLocation = () => {
    setLocationError('')
    if (!navigator.geolocation) {
      setLocationError('This browser doesn’t support location access.')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setValue('latitude', String(Number(coords.latitude.toFixed(6))), { shouldDirty: true })
        setValue('longitude', String(Number(coords.longitude.toFixed(6))), { shouldDirty: true })
        clearErrors(['latitude', 'longitude'])
        setLocating(false)
      },
      (err) => {
        setLocating(false)
        setLocationError(err.code === 1 ? 'Location permission was denied. Allow it in your browser, or type the coordinates.' : 'Could not get your location. Try again or type the coordinates.')
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }

  // Opens Google Maps in a new tab: the entered coordinates if valid, otherwise first reads the browser's
  // current position (permission prompt stays on this page), fills the inputs, then opens the map.
  // If the browser blocks the delayed popup, a second click opens it straight away.
  const searchLocation = () => {
    setLocationError('')
    if (hasCoords) {
      window.open(mapsUrl(lat, lng), '_blank', 'noopener')
      return
    }
    if (!navigator.geolocation) {
      setLocationError('This browser doesn’t support location access.')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const la = Number(coords.latitude.toFixed(6))
        const lo = Number(coords.longitude.toFixed(6))
        setValue('latitude', String(la), { shouldDirty: true })
        setValue('longitude', String(lo), { shouldDirty: true })
        clearErrors(['latitude', 'longitude'])
        setLocating(false)
        const opened = window.open(mapsUrl(la, lo), '_blank', 'noopener')
        if (!opened) notify('Location found. Click “Search location” again to open it on the map.', 'info')
      },
      (err) => {
        setLocating(false)
        setLocationError(err.code === 1 ? 'Location permission was denied. Allow it in your browser, or type the coordinates.' : 'Could not get your location. Try again or type the coordinates.')
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }

  const clearLocation = async () => {
    setLocationError('')
    setClearing(true)
    try {
      const updated = await schoolApi.update({ latitude: null, longitude: null })
      setSchool(updated)
      setValue('latitude', '')
      setValue('longitude', '')
      clearErrors(['latitude', 'longitude'])
      notify('School location cleared.', 'success')
    } catch (err) {
      setLocationError(getErrorMessage(err, 'Could not clear the location.'))
    } finally {
      setClearing(false)
    }
  }

  if (loadError) return <AppShell title="School settings"><Alert>{loadError}</Alert></AppShell>
  if (!school) return <AppShell title="School settings"><PageLoader className="py-24" /></AppShell>

  const err = (k) => errors[k]?.message

  return (
    <AppShell
      title="School settings"
      subtitle={`${school.name} · ${school.code}`}
      actions={<Button icon={Save} loading={saving} onClick={handleSubmit(onSubmit)}><span className="hidden sm:inline">Save changes</span></Button>}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl">
        <Section title="Basic info">
          <Field label="School name" required error={err('name')}>
            <input className={inputClass} {...register('name', { required: 'Name is required.', minLength: { value: 2, message: 'Name must be 2-150 characters.' }, maxLength: { value: 150, message: 'Name must be 2-150 characters.' } })} />
          </Field>
          <Field label="School code" hint="Assigned automatically, can't be changed">
            <input className={`${inputClass} bg-line/30 text-ink/50`} value={school.code || ''} disabled readOnly />
          </Field>
          <Field label="Board" error={err('board')}>
            <select className={selectClass} {...register('board')}>
              <option value="">Select board</option>
              {BOARD_OPTIONS.map((b) => <option key={b} value={b}>{BOARD_LABELS[b]}</option>)}
            </select>
          </Field>
          <Field label="School type" error={err('schoolType')}>
            <select className={selectClass} {...register('schoolType')}>
              <option value="">Select type</option>
              {SCHOOL_TYPE_OPTIONS.map((t) => <option key={t} value={t}>{SCHOOL_TYPE_LABELS[t]}</option>)}
            </select>
          </Field>
          <Field label="Medium of instruction" hint="e.g. English, Hindi" error={err('medium')}>
            <input className={inputClass} {...register('medium')} />
          </Field>
          <Field label="Established year" error={err('establishedYear')}>
            <input type="number" className={inputClass} {...register('establishedYear', { min: { value: ESTABLISHED_YEAR_MIN, message: `Must be between ${ESTABLISHED_YEAR_MIN}-${ESTABLISHED_YEAR_MAX}.` }, max: { value: ESTABLISHED_YEAR_MAX, message: `Must be between ${ESTABLISHED_YEAR_MIN}-${ESTABLISHED_YEAR_MAX}.` } })} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Logo URL" hint="Link to an image" error={err('logoUrl')}>
              <input className={inputClass} placeholder="https://..." {...register('logoUrl', url)} />
            </Field>
          </div>
        </Section>

        <Section title="Address">
          <Field label="Address line 1" error={err('addressLine1')}><input className={inputClass} {...register('addressLine1')} /></Field>
          <Field label="Address line 2" error={err('addressLine2')}><input className={inputClass} {...register('addressLine2')} /></Field>
          <Field label="City" error={err('city')}><input className={inputClass} {...register('city', { maxLength: { value: 100, message: 'City must be at most 100 characters.' } })} /></Field>
          <Field label="State" error={err('state')}><input className={inputClass} {...register('state')} /></Field>
          <Field label="Pincode" error={err('pincode')}><input className={inputClass} {...register('pincode')} /></Field>
          <Field label="Country" error={err('country')}><input className={inputClass} {...register('country')} /></Field>
        </Section>

        <Section title="Location" description="Used to verify where teachers check in from the app">
          <Field label="Latitude" hint={`${LATITUDE_MIN} to ${LATITUDE_MAX}`} error={err('latitude')}>
            <input type="number" step="any" className={inputClass} {...register('latitude', { min: { value: LATITUDE_MIN, message: `Must be between ${LATITUDE_MIN} and ${LATITUDE_MAX}.` }, max: { value: LATITUDE_MAX, message: `Must be between ${LATITUDE_MIN} and ${LATITUDE_MAX}.` } })} />
          </Field>
          <Field label="Longitude" hint={`${LONGITUDE_MIN} to ${LONGITUDE_MAX}`} error={err('longitude')}>
            <input type="number" step="any" className={inputClass} {...register('longitude', { min: { value: LONGITUDE_MIN, message: `Must be between ${LONGITUDE_MIN} and ${LONGITUDE_MAX}.` }, max: { value: LONGITUDE_MAX, message: `Must be between ${LONGITUDE_MIN} and ${LONGITUDE_MAX}.` } })} />
          </Field>
          <div className="sm:col-span-2 flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" icon={Search} loading={locating} onClick={searchLocation}>Search location</Button>
            <Button variant="secondary" size="sm" icon={LocateFixed} loading={locating} onClick={useMyLocation}>Use my current location</Button>
            {hasCoords && (
              <a href={mapsUrl(lat, lng)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs font-semibold text-ink/80 hover:bg-line/40">
                <ExternalLink size={14} /> Open in Google Maps
              </a>
            )}
            <Button variant="danger-ghost" size="sm" icon={MapPinOff} loading={clearing} disabled={school.latitude == null && school.longitude == null} onClick={clearLocation}>Clear location</Button>
          </div>
          {locationError && <div className="sm:col-span-2"><Alert>{locationError}</Alert></div>}
          {hasCoords && (
            <iframe
              title="School location preview"
              className="sm:col-span-2 w-full h-56 rounded-xl border border-line"
              loading="lazy"
              src={osmEmbedUrl(Number(lat), Number(lng))}
            />
          )}
        </Section>

        <Section title="Contact">
          <Field label="Contact email" error={err('contactEmail')}><input type="email" className={inputClass} {...register('contactEmail', email)} /></Field>
          <Field label="Contact phone" error={err('contactPhone')}><input className={inputClass} {...register('contactPhone', phone)} /></Field>
          <Field label="Alternate phone" error={err('alternatePhone')}><input className={inputClass} {...register('alternatePhone', phone)} /></Field>
          <Field label="Website URL" error={err('websiteUrl')}><input className={inputClass} placeholder="https://..." {...register('websiteUrl', url)} /></Field>
        </Section>

        <Section title="Principal" defaultOpen={false}>
          <Field label="Principal name" error={err('principalName')}><input className={inputClass} {...register('principalName')} /></Field>
          <Field label="Principal email" error={err('principalEmail')}><input type="email" className={inputClass} {...register('principalEmail', email)} /></Field>
          <Field label="Principal phone" error={err('principalPhone')}><input className={inputClass} {...register('principalPhone', phone)} /></Field>
        </Section>

        <Section title="Academic" defaultOpen={false}>
          <Field label="Total students (approx.)" error={err('totalStudentsApprox')}><input type="number" min="0" className={inputClass} {...register('totalStudentsApprox', nonNegative)} /></Field>
          <Field label="Total staff (approx.)" error={err('totalStaffApprox')}><input type="number" min="0" className={inputClass} {...register('totalStaffApprox', nonNegative)} /></Field>
          <Field label="Classes from" hint="e.g. Nursery" error={err('classesFrom')}><input className={inputClass} {...register('classesFrom')} /></Field>
          <Field label="Classes to" hint="e.g. 12" error={err('classesTo')}><input className={inputClass} {...register('classesTo')} /></Field>
          <Field label="Academic session start month" hint="1-12" error={err('academicSessionStartMonth')}>
            <input type="number" className={inputClass} {...register('academicSessionStartMonth', { min: { value: SESSION_MONTH_MIN, message: 'Must be 1-12.' }, max: { value: SESSION_MONTH_MAX, message: 'Must be 1-12.' } })} />
          </Field>
        </Section>

        <Alert className="mb-4">{serverError}</Alert>
        <div className="flex justify-end"><Button type="submit" icon={Save} loading={saving}>Save changes</Button></div>
      </form>
    </AppShell>
  )
}
