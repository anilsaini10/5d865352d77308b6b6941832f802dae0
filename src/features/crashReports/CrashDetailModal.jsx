import { useState } from 'react'
import { Copy, Check, Smartphone, User, Clock, Database } from 'lucide-react'
import { Modal, Badge, PageLoader } from '../../components/ui.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { formatDateTime } from '../../utils/format.js'
import { crashReportsApi } from './crashReports.api.js'

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch { /* clipboard access denied */ }
  }
  return (
    <button onClick={copy} className="text-ink/40 hover:text-ink p-1 rounded transition-colors" aria-label="Copy">
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  )
}

function InfoRow({ label, value }) {
  if (!value && value !== 0) return null
  return (
    <div className="flex justify-between gap-4 py-1.5">
      <span className="text-xs text-ink/45 shrink-0">{label}</span>
      <span className="text-sm text-ink text-right">{value}</span>
    </div>
  )
}

function SectionHeading({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-2 mb-2 mt-5 first:mt-0">
      <Icon size={15} className="text-ink/40" />
      <h3 className="text-xs font-semibold uppercase tracking-wide text-ink/50">{children}</h3>
    </div>
  )
}

function timeGap(crashedAt, createdAt) {
  if (!crashedAt || !createdAt) return null
  const diff = new Date(createdAt).getTime() - new Date(crashedAt).getTime()
  if (diff <= 0 || Number.isNaN(diff)) return null
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'reported instantly'
  if (mins < 60) return `reported ${mins}m after crash`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `reported ${hrs}h after crash`
  const days = Math.floor(hrs / 24)
  return `reported ${days}d after crash`
}

export default function CrashDetailModal({ open, onClose, crashId }) {
  const { data: crash, loading, error } = useFetch(
    () => crashReportsApi.get(crashId),
    [crashId],
    { errorMessage: 'Could not load crash details.', enabled: !!crashId },
  )

  return (
    <Modal open={open} onClose={onClose} title="Crash Details" wide="xl">
      {loading ? (
        <PageLoader />
      ) : error ? (
        <div className="text-sm text-coral font-medium">{error}</div>
      ) : crash ? (
        <div>
          {/* Error info */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge tone={crash.isFatal ? 'danger' : 'success'}>{crash.isFatal ? 'Fatal' : 'Non-fatal'}</Badge>
            {crash.errorType && <Badge tone="neutral">{crash.errorType}</Badge>}
            {crash.platform && <Badge tone="info">{crash.platform}</Badge>}
          </div>
          <p className="text-sm text-ink mt-3 leading-relaxed break-words">{crash.errorMessage}</p>

          {/* Stack trace */}
          {crash.stackTrace && (
            <>
              <div className="flex items-center justify-between mt-5 mb-2">
                <SectionHeading icon={Database}>Stack Trace</SectionHeading>
                <CopyButton text={crash.stackTrace} />
              </div>
              <pre className="text-xs text-ink/70 bg-surface border border-line rounded-lg p-4 overflow-x-auto max-h-64 whitespace-pre-wrap break-words font-mono">
                {crash.stackTrace}
              </pre>
            </>
          )}

          {/* Device info */}
          <SectionHeading icon={Smartphone}>Device Info</SectionHeading>
          <div className="bg-surface border border-line rounded-lg px-4 divide-y divide-line">
            <InfoRow label="Platform" value={crash.platform} />
            <InfoRow label="OS Version" value={crash.osVersion} />
            <InfoRow label="Device Model" value={crash.deviceModel} />
            <InfoRow label="App Version" value={crash.appVersion} />
            <InfoRow label="Build Number" value={crash.buildNumber} />
          </div>

          {/* User info */}
          <SectionHeading icon={User}>User Info</SectionHeading>
          <div className="bg-surface border border-line rounded-lg px-4 divide-y divide-line">
            {crash.user ? (
              <>
                <InfoRow label="Name" value={crash.user.name} />
                <InfoRow label="Email" value={crash.user.email} />
                <InfoRow label="Phone" value={crash.user.phone} />
                <InfoRow label="Role" value={crash.user.role} />
              </>
            ) : (
              <p className="text-sm text-ink/50 py-3">Unknown user</p>
            )}
          </div>

          {/* Timing */}
          <SectionHeading icon={Clock}>Timing</SectionHeading>
          <div className="bg-surface border border-line rounded-lg px-4 divide-y divide-line">
            <InfoRow label="Crashed at (device)" value={formatDateTime(crash.crashedAt)} />
            <InfoRow label="Received at (server)" value={formatDateTime(crash.createdAt)} />
            {timeGap(crash.crashedAt, crash.createdAt) && (
              <InfoRow label="Delay" value={timeGap(crash.crashedAt, crash.createdAt)} />
            )}
          </div>

          {/* Metadata */}
          {crash.metadata && Object.keys(crash.metadata).length > 0 && (
            <>
              <SectionHeading icon={Database}>Metadata</SectionHeading>
              <div className="bg-surface border border-line rounded-lg px-4 divide-y divide-line">
                {Object.entries(crash.metadata).map(([key, val]) => (
                  <InfoRow key={key} label={key} value={String(val)} />
                ))}
              </div>
            </>
          )}
        </div>
      ) : null}
    </Modal>
  )
}
