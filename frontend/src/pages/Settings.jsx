import { useState } from 'react'
import { Save, Eye, EyeOff, Phone, Mail, Cpu, Database, CheckCircle } from 'lucide-react'

function SettingGroup({ title, description, icon: Icon, iconColor = '#2563EB', children }) {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${iconColor}12` }}>
          <Icon size={16} style={{ color: iconColor }} />
        </div>
        <div>
          <h2 className="text-sm font-display font-semibold text-text-primary">{title}</h2>
          {description && <p className="text-xs text-text-secondary mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  )
}

function SecretInput({ label, envKey, placeholder }) {
  const [show, setShow] = useState(false)
  const [val, setVal] = useState('')
  return (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          className="input pr-10"
          placeholder={placeholder || `Enter ${label.toLowerCase()}...`}
          value={val}
          onChange={e => setVal(e.target.value)}
        />
        <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors">
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
      <p className="text-xs text-text-secondary mt-1">Set via <code className="bg-app px-1.5 py-0.5 rounded text-text-secondary font-mono text-[11px]">{envKey}</code> in backend .env</p>
    </div>
  )
}

export default function Settings() {
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="p-6 max-w-2xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Integrations and credentials for Brown Capital CRM.</p>
      </div>

      <div className="space-y-4">
        <SettingGroup title="Supabase Database" description="PostgreSQL database connection" icon={Database} iconColor="#059669">
          <SecretInput label="Supabase URL" envKey="SUPABASE_URL" placeholder="https://xxx.supabase.co" />
          <SecretInput label="Service Role Key" envKey="SUPABASE_SERVICE_KEY" placeholder="eyJhbG..." />
        </SettingGroup>

        <SettingGroup title="VAPI AI Calling" description="Outbound call automation" icon={Phone} iconColor="#7C3AED">
          <SecretInput label="VAPI API Key" envKey="VAPI_API_KEY" placeholder="vapi_..." />
          <SecretInput label="VAPI Assistant ID" envKey="VAPI_ASSISTANT_ID" placeholder="asst_..." />
        </SettingGroup>

        <SettingGroup title="Claude AI" description="Email generation and lead insights" icon={Cpu} iconColor="#2563EB">
          <SecretInput label="Anthropic API Key" envKey="ANTHROPIC_API_KEY" placeholder="sk-ant-..." />
        </SettingGroup>

        <SettingGroup title="SMTP Email" description="Outbound email delivery" icon={Mail} iconColor="#D97706">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">SMTP Host</label>
              <input className="input" defaultValue="smtp.gmail.com" />
            </div>
            <div>
              <label className="label">SMTP Port</label>
              <input className="input" defaultValue="587" />
            </div>
          </div>
          <SecretInput label="SMTP Username" envKey="SMTP_USER" placeholder="your@gmail.com" />
          <SecretInput label="SMTP Password / App Password" envKey="SMTP_PASSWORD" placeholder="xxxx xxxx xxxx xxxx" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">From Name</label>
              <input className="input" defaultValue="Jarrod Brown" />
            </div>
            <div>
              <label className="label">From Email</label>
              <input className="input" placeholder="jarrod@browncapital.com" />
            </div>
          </div>
        </SettingGroup>

        {/* Footer bar */}
        <div className="flex items-center justify-between p-4 rounded-xl"
          style={{ background: 'rgba(37,99,235,0.05)', border: '1px solid rgba(37,99,235,0.12)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(37,99,235,0.1)' }}>
              <Database size={13} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">Stored in environment</p>
              <p className="text-xs text-text-secondary">
                <code className="font-mono text-primary text-[11px]">backend/.env</code> — never committed to git
              </p>
            </div>
          </div>
          <button onClick={handleSave} className="btn-primary text-sm">
            {saved ? <><CheckCircle size={14} /> Saved</> : <><Save size={14} /> Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  )
}
