import { useFormContext } from 'react-hook-form'
import { Field, Section, inputClass } from '../../../components/ui.jsx'
import {
  BOARD_OPTIONS,
  BOARD_LABELS,
  SCHOOL_TYPE_OPTIONS,
  SCHOOL_TYPE_LABELS,
} from '../schools.types.js'
import {
  EMAIL_PATTERN,
  PHONE_PATTERN,
  URL_PATTERN,
  ESTABLISHED_YEAR_MIN,
  ESTABLISHED_YEAR_MAX,
  LATITUDE_MIN,
  LATITUDE_MAX,
  LONGITUDE_MIN,
  LONGITUDE_MAX,
  SESSION_MONTH_MIN,
  SESSION_MONTH_MAX,
} from '../schools.validation.js'

export default function SchoolFieldSections({ mode, code }) {
  const { register, formState: { errors } } = useFormContext()
  const isCreate = mode === 'create'

  return (
    <>
      <Section title="Basic info">
        <Field label="School name" required error={errors.name?.message}>
          <input
            className={inputClass}
            placeholder="Sunrise Public School"
            {...register('name', {
              required: 'Name is required.',
              minLength: { value: 2, message: 'Name must be 2-150 characters.' },
              maxLength: { value: 150, message: 'Name must be 2-150 characters.' },
            })}
          />
        </Field>

        {!isCreate && (
          <Field label="School code" hint="Assigned automatically, can't be changed">
            <input className={`${inputClass} bg-line/30 text-ink/50`} value={code || ''} disabled readOnly />
          </Field>
        )}

        <Field label="Board" error={errors.board?.message}>
          <select className={inputClass} {...register('board')}>
            <option value="">Select board</option>
            {BOARD_OPTIONS.map((b) => (
              <option key={b} value={b}>{BOARD_LABELS[b]}</option>
            ))}
          </select>
        </Field>

        <Field label="School type" error={errors.schoolType?.message}>
          <select className={inputClass} {...register('schoolType')}>
            <option value="">Select type</option>
            {SCHOOL_TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>{SCHOOL_TYPE_LABELS[t]}</option>
            ))}
          </select>
        </Field>

        <Field label="Medium of instruction" hint="e.g. English, Hindi" error={errors.medium?.message}>
          <input className={inputClass} placeholder="English" {...register('medium')} />
        </Field>

        <Field label="Established year" error={errors.establishedYear?.message}>
          <input
            type="number"
            className={inputClass}
            placeholder="1998"
            {...register('establishedYear', {
              min: { value: ESTABLISHED_YEAR_MIN, message: `Must be between ${ESTABLISHED_YEAR_MIN}-${ESTABLISHED_YEAR_MAX}.` },
              max: { value: ESTABLISHED_YEAR_MAX, message: `Must be between ${ESTABLISHED_YEAR_MIN}-${ESTABLISHED_YEAR_MAX}.` },
            })}
          />
        </Field>

        <Field label="Logo URL" hint="Link to an image — no file upload yet" error={errors.logoUrl?.message}>
          <input
            className={inputClass}
            placeholder="https://..."
            {...register('logoUrl', { pattern: { value: URL_PATTERN, message: 'Enter a valid URL.' } })}
          />
        </Field>
      </Section>

      <Section title="Location">
        <Field label="Address line 1" error={errors.addressLine1?.message}>
          <input className={inputClass} {...register('addressLine1')} />
        </Field>
        <Field label="Address line 2" error={errors.addressLine2?.message}>
          <input className={inputClass} {...register('addressLine2')} />
        </Field>
        <Field label="City" required={isCreate} error={errors.city?.message}>
          <input
            className={inputClass}
            placeholder="Jaipur"
            {...register('city', {
              required: isCreate ? 'City is required.' : false,
              maxLength: { value: 100, message: 'City must be at most 100 characters.' },
            })}
          />
        </Field>
        <Field label="State" error={errors.state?.message}>
          <input className={inputClass} {...register('state')} />
        </Field>
        <Field label="Pincode" error={errors.pincode?.message}>
          <input className={inputClass} {...register('pincode')} />
        </Field>
        <Field label="Country" hint="Defaults to India" error={errors.country?.message}>
          <input className={inputClass} placeholder="India" {...register('country')} />
        </Field>
        <Field label="Latitude" error={errors.latitude?.message}>
          <input
            type="number"
            step="any"
            className={inputClass}
            {...register('latitude', {
              min: { value: LATITUDE_MIN, message: `Must be between ${LATITUDE_MIN} and ${LATITUDE_MAX}.` },
              max: { value: LATITUDE_MAX, message: `Must be between ${LATITUDE_MIN} and ${LATITUDE_MAX}.` },
            })}
          />
        </Field>
        <Field label="Longitude" error={errors.longitude?.message}>
          <input
            type="number"
            step="any"
            className={inputClass}
            {...register('longitude', {
              min: { value: LONGITUDE_MIN, message: `Must be between ${LONGITUDE_MIN} and ${LONGITUDE_MAX}.` },
              max: { value: LONGITUDE_MAX, message: `Must be between ${LONGITUDE_MIN} and ${LONGITUDE_MAX}.` },
            })}
          />
        </Field>
      </Section>

      <Section title="Contact">
        <Field label="Contact email" required={isCreate} error={errors.contactEmail?.message}>
          <input
            type="email"
            className={inputClass}
            placeholder="contact@school.edu"
            {...register('contactEmail', {
              required: isCreate ? 'Contact email is required.' : false,
              pattern: { value: EMAIL_PATTERN, message: 'Enter a valid email address.' },
            })}
          />
        </Field>
        <Field label="Contact phone" error={errors.contactPhone?.message}>
          <input
            className={inputClass}
            {...register('contactPhone', { pattern: { value: PHONE_PATTERN, message: 'Phone must be 10-15 characters.' } })}
          />
        </Field>
        <Field label="Alternate phone" error={errors.alternatePhone?.message}>
          <input
            className={inputClass}
            {...register('alternatePhone', { pattern: { value: PHONE_PATTERN, message: 'Phone must be 10-15 characters.' } })}
          />
        </Field>
        <Field label="Website URL" error={errors.websiteUrl?.message}>
          <input
            className={inputClass}
            placeholder="https://..."
            {...register('websiteUrl', { pattern: { value: URL_PATTERN, message: 'Enter a valid URL.' } })}
          />
        </Field>
      </Section>

      <Section title="Principal" defaultOpen={false}>
        <Field label="Principal name" error={errors.principalName?.message}>
          <input className={inputClass} {...register('principalName')} />
        </Field>
        <Field label="Principal email" error={errors.principalEmail?.message}>
          <input
            type="email"
            className={inputClass}
            {...register('principalEmail', { pattern: { value: EMAIL_PATTERN, message: 'Enter a valid email address.' } })}
          />
        </Field>
        <Field label="Principal phone" error={errors.principalPhone?.message}>
          <input
            className={inputClass}
            {...register('principalPhone', { pattern: { value: PHONE_PATTERN, message: 'Phone must be 10-15 characters.' } })}
          />
        </Field>
      </Section>

      <Section title="Academic" defaultOpen={false}>
        <Field label="Total students (approx.)" error={errors.totalStudentsApprox?.message}>
          <input
            type="number"
            min="0"
            className={inputClass}
            {...register('totalStudentsApprox', { min: { value: 0, message: 'Must be 0 or more.' } })}
          />
        </Field>
        <Field label="Total staff (approx.)" error={errors.totalStaffApprox?.message}>
          <input
            type="number"
            min="0"
            className={inputClass}
            {...register('totalStaffApprox', { min: { value: 0, message: 'Must be 0 or more.' } })}
          />
        </Field>
        <Field label="Classes from" hint="e.g. Nursery" error={errors.classesFrom?.message}>
          <input className={inputClass} {...register('classesFrom')} />
        </Field>
        <Field label="Classes to" hint="e.g. 12" error={errors.classesTo?.message}>
          <input className={inputClass} {...register('classesTo')} />
        </Field>
        <Field label="Academic session start month" hint="1-12" error={errors.academicSessionStartMonth?.message}>
          <input
            type="number"
            className={inputClass}
            {...register('academicSessionStartMonth', {
              min: { value: SESSION_MONTH_MIN, message: 'Must be 1-12.' },
              max: { value: SESSION_MONTH_MAX, message: 'Must be 1-12.' },
            })}
          />
        </Field>
      </Section>
    </>
  )
}
