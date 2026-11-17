import { useState } from 'react'
import { CheckCircle, ChevronRight, ChevronLeft, Shield, Building2 } from 'lucide-react'
import { leadsApi } from '../lib/api'

const INDUSTRIES = [
  'Real Estate', 'Finance & Investment', 'Technology', 'Healthcare',
  'Manufacturing', 'Retail & E-commerce', 'Education', 'Legal Services',
  'Construction', 'Hospitality', 'Other'
]
const SERVICES = [
  'Capital Raising', 'Investment Advisory', 'Business Consulting',
  'Portfolio Management', 'Wealth Planning', 'Mergers & Acquisitions', 'Other'
]
const STEP_LABELS = ['Personal Information', 'Business Details']

/* ── shared input style ── */
const inputCls = `
  block w-full rounded-xl bg-white border border-slate-300 px-4 py-3 text-sm text-slate-900
  placeholder:text-slate-400 shadow-sm transition-all duration-200
  focus:outline-none focus:border-blue-600 focus:ring-[3px] focus:ring-blue-600/10
`

export default function LeadForm() {
  const [step, setStep]           = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess]     = useState(false)
  const [error, setError]         = useState('')
  const [createdLead, setCreatedLead] = useState(null)

  // Step 1
  const [name, setName]       = useState('')
  const [email, setEmail]     = useState('')
  const [phone, setPhone]     = useState('')
  const [company, setCompany] = useState('')

  // Step 2
  const [industry, setIndustry] = useState('')
  const [service, setService]   = useState('')
  const [website, setWebsite]   = useState('')
  const [message, setMessage]   = useState('')


  const validateEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
  const validatePhone = p => p.replace(/\D/g, '').length >= 7

  const handleStep1 = e => {
    e.preventDefault()
    if (!name.trim())          { setError('Full name is required.'); return }
    if (!validateEmail(email)) { setError('Please enter a valid email address.'); return }
    if (!validatePhone(phone)) { setError('Please enter a valid phone number.'); return }
    setError('')
    // Go to Step 2 instantly — save lead in background
    setStep(2)
    leadsApi.create({ name, email, phone, company, source: 'website' })
      .then(lead => setCreatedLead(lead))
      .catch(() => {/* will retry on Step 2 submit */})
  }

  const handleStep2 = async e => {
    e.preventDefault()
    if (!industry) { setError('Please select your industry.'); return }
    setError(''); setSubmitting(true)
    try {
      let lead = createdLead
      // If background save didn't finish yet, create now
      if (!lead) {
        lead = await leadsApi.create({ name, email, phone, company, source: 'website' })
        setCreatedLead(lead)
      }
      await leadsApi.update(lead.id, {
        notes: `Industry: ${industry}. Service: ${service}. ${message || ''}`.trim()
      })
      setSuccess(true)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Something went wrong. Please try again.')
    }
    setSubmitting(false)
  }


  /* ── Success screen ── */
  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-[0_20px_45px_-15px_rgba(15,23,42,0.08)] p-10 text-center">
          <div className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center bg-emerald-50 border border-emerald-100">
            <CheckCircle size={30} className="text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">Thank You!</h1>
          <p className="text-sm text-slate-500 mb-6">Your information has been successfully submitted.</p>
          <p className="text-sm text-slate-500">A member of our team will be in touch within 24 hours.</p>
          <p className="text-xs text-slate-400 mt-5">
            Confirmation will be sent to <span className="text-slate-600">{email}</span>
          </p>
        </div>
      </div>
    )
  }

  /* ── Form page ── */
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* Top nav */}
      <header className="w-full bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm shadow-blue-600/30">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" viewBox="0 0 24 24">
                <path d="M3 21h18"/><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/>
                <path d="M9 9h6"/><path d="M9 13h6"/><path d="M9 17h6"/>
              </svg>
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-slate-900 block leading-tight">Brown Capital</span>
              <span className="text-[11px] font-medium tracking-wide text-slate-500 uppercase leading-none">Private Client Services</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-xs text-slate-600 font-medium border border-slate-200/60">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Encrypted 256-Bit Gateway
            </div>
            <a href="#support" className="text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors">Need Assistance?</a>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex items-center justify-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch max-w-6xl">

          {/* Left info panel */}
          <section className="lg:col-span-5 flex flex-col justify-between p-8 sm:p-10 rounded-2xl bg-white border border-slate-200/90 shadow-[0_20px_45px_-15px_rgba(15,23,42,0.06),0_0_1px_1px_rgba(226,232,240,0.8)] relative overflow-hidden">
            <div className="absolute -right-16 -top-16 w-56 h-56 bg-blue-50 rounded-full blur-3xl pointer-events-none" />
            <div>
              <div className="flex items-center gap-3 mb-10">
                <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-blue-600">
                  <Building2 size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 tracking-tight">Brown Capital</h2>
                  <p className="text-xs text-slate-500 font-medium">Private Client Services</p>
                </div>
              </div>
              <div className="space-y-4 mb-8">
                <h1 className="font-serif text-3xl sm:text-4xl text-slate-900 italic tracking-tight font-medium leading-[1.25]">
                  "Your capital,<br />expertly managed."
                </h1>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Brown Capital delivers personalised investment strategies for discerning clients. Complete this form to begin your onboarding with our team.
                </p>
              </div>
            </div>
            <div className="pt-8 border-t border-slate-100 space-y-4">
              {[
                { Icon: Shield,       text: 'Your information is secure & private' },
                { Icon: CheckCircle,  text: 'No obligation — just a conversation' },
                { Icon: Building2,    text: 'Trusted by high-net-worth clients' },
              ].map(({ Icon, text }) => (
                <div key={text} className="flex items-center gap-3 text-slate-700">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                    <Icon size={14} />
                  </div>
                  <span className="text-xs sm:text-[13px] font-medium tracking-tight">{text}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Right form card */}
          <section className="lg:col-span-7 flex flex-col justify-center bg-white rounded-2xl border border-slate-200/90 shadow-[0_20px_45px_-15px_rgba(15,23,42,0.06),0_0_1px_1px_rgba(226,232,240,0.8)] p-8 sm:p-11">

            {/* Step indicator */}
            <div className="mb-10 pb-6 border-b border-slate-100">
              <div className="flex items-center gap-3 sm:gap-4">
                {STEP_LABELS.map((label, i) => {
                  const n = i + 1
                  const isActive = step === n
                  const isDone   = step > n
                  return (
                    <div key={n} className="flex items-center gap-2">
                      <div className={`flex items-center gap-2.5 ${!isActive && !isDone ? 'opacity-50' : ''}`}>
                        <span className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold transition-all duration-200 ${
                          isDone   ? 'bg-emerald-500 text-white' :
                          isActive ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30' :
                                     'bg-slate-100 border border-slate-200 text-slate-400'
                        }`}>
                          {isDone ? <CheckCircle size={13} /> : n}
                        </span>
                        {isActive && (
                          <span className="text-xs sm:text-sm font-semibold text-slate-900 tracking-tight hidden sm:block">{label}</span>
                        )}
                      </div>
                      {i < STEP_LABELS.length - 1 && (
                        <div className={`w-8 sm:w-12 h-0.5 ${isDone ? 'bg-emerald-300' : 'bg-slate-200'}`} />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Section heading */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{STEP_LABELS[step - 1]}</h2>
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mt-1">Step {step} of {STEP_LABELS.length}</p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-5 px-4 py-3 rounded-xl text-xs font-medium bg-red-50 border border-red-200 text-red-600">
                {error}
              </div>
            )}

            {/* ── Step 1 ── */}
            {step === 1 && (
              <form onSubmit={handleStep1} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input className={inputCls} value={name} onChange={e => setName(e.target.value)} placeholder="James Williams" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Business Email <span className="text-rose-500">*</span>
                  </label>
                  <input type="email" className={inputCls} value={email} onChange={e => setEmail(e.target.value)} placeholder="james@company.com" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input type="tel" className={inputCls} value={phone} onChange={e => setPhone(e.target.value)} placeholder="+61 400 000 000" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Company Name</label>
                  <input className={inputCls} value={company} onChange={e => setCompany(e.target.value)} placeholder="Acme Corp Pty Ltd" />
                </div>
                <div className="pt-2">
                  <button type="submit" disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-[0_4px_14px_0_rgba(37,99,235,0.35)] hover:shadow-[0_6px_20px_0_rgba(37,99,235,0.45)] hover:-translate-y-px active:translate-y-px transition-all duration-200 disabled:opacity-50">
                    {submitting ? 'Processing…' : 'Continue'} {!submitting && <ChevronRight size={15} />}
                  </button>
                </div>
                <p className="text-center text-[11px] text-slate-500">
                  By continuing, you agree to our{' '}
                  <a href="#terms" className="underline hover:text-blue-600">Privacy Policy</a> and{' '}
                  <a href="#privacy" className="underline hover:text-blue-600">Terms of Advisory</a>.
                </p>
              </form>
            )}

            {/* ── Step 2 ── */}
            {step === 2 && (
              <form onSubmit={handleStep2} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Industry <span className="text-rose-500">*</span>
                  </label>
                  <select className={inputCls} value={industry} onChange={e => setIndustry(e.target.value)} required>
                    <option value="">Select your industry…</option>
                    {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Service Interested In</label>
                  <select className={inputCls} value={service} onChange={e => setService(e.target.value)}>
                    <option value="">Select a service…</option>
                    {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Company Website</label>
                  <input className={inputCls} value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://yourcompany.com" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Additional Information</label>
                  <textarea className={`${inputCls} resize-none`} rows={3}
                    value={message} onChange={e => setMessage(e.target.value)}
                    placeholder="Tell us about your business goals or investment objectives…" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setStep(1)}
                    className="flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-semibold text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors">
                    <ChevronLeft size={15} /> Back
                  </button>
                  <button type="submit" disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-[0_4px_14px_0_rgba(37,99,235,0.35)] hover:-translate-y-px transition-all duration-200 disabled:opacity-50">
                    {submitting ? 'Submitting…' : <><span>Submit</span><ChevronRight size={15} /></>}
                  </button>
                </div>
              </form>
            )}


          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200/70 py-6 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>© 2024 Brown Capital Advisory Pty Ltd. All rights reserved.</div>
          <div className="flex items-center gap-6 font-medium">
            <a href="#disclosures" className="hover:text-blue-600 transition-colors">Regulatory Disclosures</a>
            <a href="#security" className="hover:text-blue-600 transition-colors">Institutional Security</a>
            <a href="#portal" className="hover:text-blue-600 transition-colors">Executive Portal</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
