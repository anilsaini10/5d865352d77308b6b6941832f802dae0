import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { Modal, Button } from '../../../../components/ui.jsx'

export default function CredentialsDialog({ data, onClose }) {
  const [copied, setCopied] = useState(false)

  if (!data) return null

  const { name, customRoleName, email, phone, username, defaultPassword } = data

  const loginIds = [email, phone, username].filter(Boolean)
  const block = [
    `Account created for ${name} (${customRoleName})`,
    `Login ID: ${loginIds.join(' / ')}`,
    `Password: ${defaultPassword}`,
    'Ask them to change the password after first login.',
  ].join('\n')

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(block)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard unavailable
    }
  }

  return (
    <Modal open onClose={onClose} title="Account created" subtitle={`${name} — ${customRoleName}`}>
      <div className="space-y-4">
        <div className="rounded-lg bg-surface border border-line p-4 space-y-2 text-sm">
          <p className="font-semibold text-ink">Login details</p>
          <div className="space-y-1 text-ink/70">
            {loginIds.map((id) => (
              <p key={id} className="font-mono text-xs">{id}</p>
            ))}
          </div>
          <div className="flex items-center gap-2 bg-chalk text-board rounded-lg px-3.5 py-2 font-mono text-base font-bold mt-3">
            {defaultPassword}
            <button onClick={copyAll} className="ml-auto text-board/70 hover:text-board" aria-label="Copy login details">
              {copied ? <Check size={15} /> : <Copy size={15} />}
            </button>
          </div>
          <p className="text-xs text-ink/45">Ask them to change the password after first login.</p>
        </div>
        <div className="flex justify-end">
          <Button onClick={onClose}>Done</Button>
        </div>
      </div>
    </Modal>
  )
}
