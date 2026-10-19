import { Field, Tabs, inputClass, selectClass } from '../../../../components/ui.jsx'
import { DAYS, DAY_LABELS } from '../../constants.js'

/** "Specific date / Every week" switch plus the matching date or weekday input. */
export default function DayPicker({ mode, onMode, date, onDate, day, onDay, allowWeek = false }) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <Tabs options={[{ value: 'date', label: 'Specific date' }, { value: 'day', label: 'Every week' }]} value={mode} onChange={onMode} />
      {mode === 'date' ? (
        <div className="w-44"><Field label="Date"><input type="date" className={inputClass} value={date} onChange={(e) => onDate(e.target.value)} /></Field></div>
      ) : (
        <div className="w-44">
          <Field label="Weekday">
            <select className={selectClass} value={day} onChange={(e) => onDay(e.target.value)}>
              {allowWeek && <option value="">Whole week</option>}
              {DAYS.map((d) => <option key={d} value={d}>{DAY_LABELS[d]}</option>)}
            </select>
          </Field>
        </div>
      )}
    </div>
  )
}
