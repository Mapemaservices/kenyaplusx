import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  MapPin, User, Users, Vote, MessageSquare, CheckCircle, ChevronRight,
  ChevronLeft, AlertCircle, Loader2, Home
} from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import {
  KENYA_COUNTIES, KENYA_COUNTIES_CONSTITUENCIES,
  AGE_GROUPS, GENDERS, BIGGEST_ISSUES
} from '../data/kenya'
import type { SurveyFormData } from '../types'

const INITIAL_FORM: SurveyFormData = {
  county: '', constituency: '', ward: '',
  full_name: '', phone_number: '',
  gender: '', age_group: '',
  preferred_governor: '', support_reason: '',
  biggest_issue: '', issue_details: '',
}

const STEPS = [
  { id: 1, label: 'Location',     icon: MapPin,        bg: 'bg-green-50',  iconBg: 'bg-green-100',  iconColor: 'text-green-600',  ring: 'border-green-400',  done: 'bg-green-600 border-green-600' },
  { id: 2, label: 'Personal',     icon: User,          bg: 'bg-blue-50',   iconBg: 'bg-blue-100',   iconColor: 'text-blue-600',   ring: 'border-blue-400',   done: 'bg-blue-600 border-blue-600'   },
  { id: 3, label: 'Demographics', icon: Users,         bg: 'bg-purple-50', iconBg: 'bg-purple-100', iconColor: 'text-purple-600', ring: 'border-purple-400', done: 'bg-purple-600 border-purple-600'},
  { id: 4, label: 'Politics',     icon: Vote,          bg: 'bg-red-50',    iconBg: 'bg-red-100',    iconColor: 'text-red-600',    ring: 'border-red-400',    done: 'bg-red-600 border-red-600'     },
  { id: 5, label: 'Issues',       icon: MessageSquare, bg: 'bg-orange-50', iconBg: 'bg-orange-100', iconColor: 'text-orange-600', ring: 'border-orange-400', done: 'bg-orange-600 border-orange-600'},
]

const STEP_TITLES = [
  'Where Are You From?',
  'Tell Us About Yourself',
  'Your Demographics',
  'Your Political Preference',
  "Your County's Top Challenge",
]

const STORAGE_KEY = 'kenyaplus_survey_done'

export default function SurveyPage() {
  const [step, setStep]               = useState(1)
  const [form, setForm]               = useState<SurveyFormData>(INITIAL_FORM)
  const [errors, setErrors]           = useState<Partial<SurveyFormData>>({})
  const [submitting, setSubmitting]   = useState(false)
  const [submitted, setSubmitted]     = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [alreadyDone, setAlreadyDone] = useState(false)
  const [checkingPhone, setCheckingPhone] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) setAlreadyDone(true)
  }, [])

  const constituencies = form.county ? KENYA_COUNTIES_CONSTITUENCIES[form.county] ?? [] : []
  const progress = (step / STEPS.length) * 100
  const current = STEPS[step - 1]

  function update(field: keyof SurveyFormData, value: string) {
    setForm((prev) => {
      const next = { ...prev, [field]: value }
      if (field === 'county') next.constituency = ''
      return next
    })
    if (errors[field]) setErrors((e) => ({ ...e, [field]: '' }))
  }

  function validateStep(): boolean {
    const e: Partial<SurveyFormData> = {}
    if (step === 1) {
      if (!form.county)           e.county        = 'Please select your county'
      if (!form.constituency)     e.constituency  = 'Please select your constituency'
      if (!form.ward.trim())      e.ward          = 'Please enter your ward name'
    }
    if (step === 2) {
      if (!form.full_name.trim()) e.full_name = 'Your name is required'
      if (!form.phone_number.trim()) e.phone_number = 'Phone number is required'
      else if (!/^0[0-9]{9}$/.test(form.phone_number.replace(/\s/g, '')))
        e.phone_number = 'Enter a valid Kenyan number (e.g. 0712345678)'
    }
    if (step === 3) {
      if (!form.gender)    e.gender    = 'Please select your gender'
      if (!form.age_group) e.age_group = 'Please select your age group'
    }
    if (step === 4) {
      if (!form.preferred_governor.trim()) e.preferred_governor = 'Please enter a candidate name'
      if (!form.support_reason.trim()) e.support_reason = 'Please tell us why you support them'
      else if (form.support_reason.trim().length < 20) e.support_reason = 'Please write at least 20 characters'
    }
    if (step === 5) {
      if (!form.biggest_issue) e.biggest_issue = 'Please select the biggest issue'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function triggerAnim(dir: 'forward' | 'back') {
    if (cardRef.current) {
      cardRef.current.classList.remove('step-enter', 'step-enter-back')
      void cardRef.current.offsetWidth
      cardRef.current.classList.add(dir === 'forward' ? 'step-enter' : 'step-enter-back')
    }
  }

  async function next() {
    if (!validateStep()) return
    if (step === 2 && isSupabaseConfigured()) {
      setCheckingPhone(true)
      try {
        const { data } = await supabase
          .from('survey_responses')
          .select('id')
          .eq('phone_number', form.phone_number.replace(/\s/g, ''))
          .limit(1)
        if (data && data.length > 0) {
          setErrors({ phone_number: 'This phone number has already been used to take the survey.' })
          return
        }
      } catch { /* ignore — let submit catch it */ } finally {
        setCheckingPhone(false)
      }
    }
    triggerAnim('forward')
    setStep((s) => s + 1)
  }

  function back() {
    setErrors({})
    triggerAnim('back')
    setStep((s) => s - 1)
  }

  async function handleSubmit() {
    if (!validateStep()) return
    setSubmitting(true)
    setSubmitError('')
    try {
      if (!isSupabaseConfigured()) {
        await new Promise((r) => setTimeout(r, 1000))
        localStorage.setItem(STORAGE_KEY, '1')
        setSubmitted(true)
        return
      }
      const { error } = await supabase.from('survey_responses').insert([{
        county: form.county, constituency: form.constituency, ward: form.ward,
        full_name: form.full_name, phone_number: form.phone_number,
        gender: form.gender, age_group: form.age_group,
        preferred_governor: form.preferred_governor, support_reason: form.support_reason,
        biggest_issue: form.biggest_issue, issue_details: form.issue_details,
      }])
      if (error) {
        if ((error as { code?: string }).code === '23505')
          throw new Error('This phone number has already been used to take the survey.')
        throw error
      }
      localStorage.setItem(STORAGE_KEY, '1')
      setSubmitted(true)
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  /* ===== ALREADY COMPLETED SCREEN ===== */
  if (alreadyDone) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center px-4 pt-16 pb-10">
        <div className="max-w-lg w-full text-center animate-slide-up">
          <div className="w-24 h-24 sm:w-28 sm:h-28 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle className="w-12 h-12 sm:w-14 sm:h-14 text-green-600" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-2">Already Submitted</h1>
          <p className="text-lg text-gray-600 mb-2">You've already taken this survey.</p>
          <p className="text-gray-500 text-sm mb-8 max-w-sm mx-auto">
            Each person may only submit one response. Thank you for participating!
          </p>
          <Link to="/" className="btn-secondary inline-flex items-center justify-center gap-2">
            <Home className="w-4 h-4" />Back to Home
          </Link>
        </div>
      </div>
    )
  }

  /* ===== SUCCESS SCREEN ===== */
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center px-4 pt-16 pb-10">
        <div className="max-w-lg w-full text-center animate-slide-up">
          <div className="relative inline-flex mb-8">
            <div className="w-24 h-24 sm:w-28 sm:h-28 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 sm:w-14 sm:h-14 text-green-600" />
            </div>
            <div className="absolute -right-2 -top-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-yellow-900 font-black text-sm">
              ✓
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-2">Asante Sana!</h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-2">Thank You for Participating</p>
          <p className="text-gray-500 text-sm mb-8 max-w-sm mx-auto">
            Your response has been recorded. Together, we're shaping Kenya's political future.
          </p>

          {/* Summary card */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 mb-8 shadow-sm text-left space-y-3">
            <h3 className="font-bold text-gray-700 text-xs sm:text-sm uppercase tracking-wide mb-4">Your Submission</h3>
            {[
              { label: 'County',             value: form.county },
              { label: 'Constituency',       value: form.constituency },
              { label: 'Name',               value: form.full_name },
              { label: 'Preferred Governor', value: form.preferred_governor },
              { label: 'Top Issue',          value: form.biggest_issue },
            ].map((r) => (
              <div key={r.label} className="flex items-baseline justify-between gap-4 text-sm">
                <span className="text-gray-400 flex-shrink-0">{r.label}</span>
                <span className="font-semibold text-gray-900 text-right truncate">{r.value}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-center">
            <Link to="/" className="btn-secondary flex items-center justify-center gap-2">
              <Home className="w-4 h-4" />Back to Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  /* ===== MAIN SURVEY ===== */
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-800 pt-16 sm:pt-20 pb-10 px-4">
      <div className="max-w-xl mx-auto">

        {/* Page title */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-1.5">Civic Survey 2026–2027</h1>
          <p className="text-gray-400 text-sm">
            Step {step} of {STEPS.length} — <span className="text-gray-300">{current.label}</span>
          </p>
        </div>

        {/* Step dots — mobile-friendly compact version */}
        <div className="flex items-center justify-center mb-5 sm:mb-8">
          {STEPS.map((s, i) => {
            const Icon = s.icon
            const isDone   = step > s.id
            const isActive = step === s.id
            return (
              <div key={s.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  {/* Circle — smaller on mobile */}
                  <div className={`
                    w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300
                    ${isDone   ? s.done  + ' shadow-md' : ''}
                    ${isActive ? 'bg-gray-800 ' + s.ring + ' scale-110 shadow-lg' : ''}
                    ${!isDone && !isActive ? 'bg-gray-800 border-gray-700' : ''}
                  `}>
                    {isDone
                      ? <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      : <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActive ? s.iconColor : 'text-gray-600'}`} />
                    }
                  </div>
                  {/* Label — hidden on xs, visible sm+ */}
                  <span className={`
                    text-xs mt-1.5 font-medium hidden sm:block transition-colors
                    ${isActive ? s.iconColor : isDone ? 'text-green-500' : 'text-gray-600'}
                  `}>
                    {s.label}
                  </span>
                </div>
                {/* Connector line — shorter on mobile */}
                {i < STEPS.length - 1 && (
                  <div className={`
                    h-0.5 w-5 xs:w-8 sm:w-10 lg:w-14 mx-0.5 sm:mx-1 flex-shrink-0
                    ${!isActive ? 'sm:-mt-5' : 'sm:-mt-5'}
                    transition-all duration-300
                    ${step > s.id ? 'bg-green-600' : 'bg-gray-700'}
                  `} />
                )}
              </div>
            )
          })}
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-gray-800 rounded-full mb-5 sm:mb-7 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Card */}
        <div ref={cardRef} className="step-enter">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl shadow-black/30 overflow-hidden">

            {/* Step header */}
            <div className={`px-5 sm:px-7 py-4 sm:py-5 border-b border-gray-100 ${current.bg}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0 ${current.iconBg}`}>
                  <current.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${current.iconColor}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                    Step {step} of {STEPS.length}
                  </p>
                  <h2 className="text-base sm:text-xl font-black text-gray-900 leading-tight">
                    {STEP_TITLES[step - 1]}
                  </h2>
                </div>
              </div>
            </div>

            {/* Step body */}
            <div className="px-4 sm:px-7 py-5 sm:py-7 space-y-5">

              {/* STEP 1: Location */}
              {step === 1 && (
                <>
                  <div>
                    <label className="label">County *</label>
                    <select value={form.county} onChange={(e) => update('county', e.target.value)}
                      className={`input-field ${errors.county ? 'input-field-error' : ''}`}
                    >
                      <option value="">— Select your county —</option>
                      {KENYA_COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {errors.county && <p className="error-text"><AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{errors.county}</p>}
                  </div>
                  <div>
                    <label className="label">Constituency *</label>
                    <select value={form.constituency} onChange={(e) => update('constituency', e.target.value)}
                      disabled={!form.county}
                      className={`input-field ${errors.constituency ? 'input-field-error' : ''} ${!form.county ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}`}
                    >
                      <option value="">{form.county ? '— Select your constituency —' : 'Select a county first'}</option>
                      {constituencies.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {errors.constituency && <p className="error-text"><AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{errors.constituency}</p>}
                  </div>
                  <div>
                    <label className="label">Ward *</label>
                    <input type="text"
                      value={form.ward} onChange={(e) => update('ward', e.target.value)}
                      className={`input-field ${errors.ward ? 'input-field-error' : ''}`}
                    />
                    {errors.ward && <p className="error-text"><AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{errors.ward}</p>}
                  </div>
                </>
              )}

              {/* STEP 2: Personal Info */}
              {step === 2 && (
                <>
                  <div>
                    <label className="label">Full Name *</label>
                    <input type="text"
                      value={form.full_name} onChange={(e) => update('full_name', e.target.value)}
                      className={`input-field ${errors.full_name ? 'input-field-error' : ''}`}
                    />
                    {errors.full_name && <p className="error-text"><AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{errors.full_name}</p>}
                  </div>
                  <div>
                    <label className="label">Phone Number *</label>
                    {/* On mobile, stacked layout to avoid overflow */}
                    <div className="flex">
                      <span className="inline-flex items-center flex-shrink-0 px-3 sm:px-4 border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm rounded-l-xl whitespace-nowrap">
                        🇰🇪 +254
                      </span>
                      <input type="tel"
                        value={form.phone_number} onChange={(e) => update('phone_number', e.target.value)}
                        className={`input-field rounded-l-none min-w-0 ${errors.phone_number ? 'input-field-error' : ''}`}
                      />
                    </div>
                    {errors.phone_number && <p className="error-text"><AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{errors.phone_number}</p>}
                    <p className="text-xs text-gray-400 mt-2">Your number is kept private and used for verification only.</p>
                  </div>
                </>
              )}

              {/* STEP 3: Demographics */}
              {step === 3 && (
                <>
                  <div>
                    <label className="label">Gender *</label>
                    {/* 1-col on xs (to avoid tight squeeze), 3-col on sm */}
                    <div className="grid grid-cols-1 xs:grid-cols-3 gap-2.5">
                      {GENDERS.map((g) => (
                        <button key={g} type="button" onClick={() => update('gender', g)}
                          className={`py-3 px-3 rounded-xl border-2 text-sm font-semibold transition-all min-h-[44px]
                            ${form.gender === g
                              ? 'border-green-500 bg-green-50 text-green-700'
                              : 'border-gray-200 text-gray-600 hover:border-green-200 hover:bg-green-50/50'
                            }`}
                        >
                          {form.gender === g && <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1.5" />}
                          {g}
                        </button>
                      ))}
                    </div>
                    {errors.gender && <p className="error-text mt-2"><AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{errors.gender}</p>}
                  </div>
                  <div>
                    <label className="label">Age Group *</label>
                    <div className="grid grid-cols-2 xs:grid-cols-3 gap-2.5">
                      {AGE_GROUPS.map((ag) => (
                        <button key={ag} type="button" onClick={() => update('age_group', ag)}
                          className={`py-3 px-2 rounded-xl border-2 text-sm font-bold transition-all min-h-[44px]
                            ${form.age_group === ag
                              ? 'border-purple-500 bg-purple-50 text-purple-700'
                              : 'border-gray-200 text-gray-600 hover:border-purple-200 hover:bg-purple-50/50'
                            }`}
                        >
                          {ag}
                        </button>
                      ))}
                    </div>
                    {errors.age_group && <p className="error-text mt-2"><AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{errors.age_group}</p>}
                  </div>
                </>
              )}

              {/* STEP 4: Politics */}
              {step === 4 && (
                <>
                  <div>
                    <label className="label">Preferred Governor Candidate *</label>
                    <input type="text"
                      value={form.preferred_governor} onChange={(e) => update('preferred_governor', e.target.value)}
                      className={`input-field ${errors.preferred_governor ? 'input-field-error' : ''}`}
                    />
                    {errors.preferred_governor && <p className="error-text"><AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{errors.preferred_governor}</p>}
                    {form.county && (
                      <p className="text-xs text-gray-400 mt-2">
                        Gubernatorial seat — <span className="font-semibold text-gray-500">{form.county} County</span>
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="label">Why Do You Support Them? *</label>
                    <textarea
                      value={form.support_reason} onChange={(e) => update('support_reason', e.target.value)}
                      rows={5} className={`input-field resize-none ${errors.support_reason ? 'input-field-error' : ''}`}
                    />
                    <div className="flex justify-between items-center mt-1 gap-2">
                      <div className="min-w-0">
                        {errors.support_reason && <p className="error-text"><AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{errors.support_reason}</p>}
                      </div>
                      <span className={`text-xs flex-shrink-0 ${form.support_reason.length < 20 ? 'text-red-400' : 'text-green-600'}`}>
                        {form.support_reason.length} / 20 min
                      </span>
                    </div>
                  </div>
                </>
              )}

              {/* STEP 5: Issues */}
              {step === 5 && (
                <>
                  <div>
                    <label className="label">Biggest Issue in {form.county || 'Your'} County *</label>
                    <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
                      {BIGGEST_ISSUES.map((issue) => (
                        <button key={issue} type="button" onClick={() => update('biggest_issue', issue)}
                          className={`text-left py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl border-2 text-sm font-medium transition-all min-h-[44px]
                            ${form.biggest_issue === issue
                              ? 'border-orange-500 bg-orange-50 text-orange-700'
                              : 'border-gray-200 text-gray-600 hover:border-orange-200 hover:bg-orange-50/50'
                            }`}
                        >
                          {form.biggest_issue === issue && (
                            <span className="inline-block w-2 h-2 bg-orange-500 rounded-full mr-2 flex-shrink-0" />
                          )}
                          {issue}
                        </button>
                      ))}
                    </div>
                    {errors.biggest_issue && <p className="error-text mt-2"><AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{errors.biggest_issue}</p>}
                  </div>

                  <div>
                    <label className="label">
                      Tell Us More{' '}
                      <span className="text-gray-400 font-normal text-xs">(optional)</span>
                    </label>
                    <textarea
                      value={form.issue_details} onChange={(e) => update('issue_details', e.target.value)}
                      rows={3} className="input-field resize-none"
                    />
                  </div>

                  {/* Review summary */}
                  <div className="bg-gray-50 rounded-2xl p-4 sm:p-5 border border-gray-100">
                    <h4 className="font-bold text-gray-600 text-xs uppercase tracking-widest mb-3 sm:mb-4">Review Your Answers</h4>
                    <div className="space-y-2.5">
                      {[
                        { label: 'County',        value: form.county },
                        { label: 'Constituency',  value: form.constituency },
                        { label: 'Ward',          value: form.ward },
                        { label: 'Name',          value: form.full_name },
                        { label: 'Gender',        value: form.gender },
                        { label: 'Age Group',     value: form.age_group },
                        { label: 'Gov. Candidate',value: form.preferred_governor },
                      ].map((r) => (
                        <div key={r.label} className="flex items-baseline justify-between gap-3 text-sm">
                          <span className="text-gray-400 font-medium flex-shrink-0">{r.label}</span>
                          <span className="font-bold text-gray-800 text-right truncate">{r.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {submitError && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
                      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-red-700 text-sm">{submitError}</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Navigation — back on left, forward on right; full width on xs */}
            <div className="px-4 sm:px-7 pb-5 sm:pb-7 flex flex-col-reverse xs:flex-row justify-between items-stretch xs:items-center gap-3">
              {/* Back / Home */}
              {step > 1 ? (
                <button onClick={back}
                  className="btn-secondary flex items-center justify-center gap-2 xs:w-auto"
                >
                  <ChevronLeft className="w-4 h-4" />Back
                </button>
              ) : (
                <Link to="/" className="btn-secondary flex items-center justify-center gap-2 xs:w-auto">
                  <Home className="w-4 h-4" />Home
                </Link>
              )}

              {/* Next / Submit */}
              {step < STEPS.length ? (
                <button onClick={next} disabled={checkingPhone}
                  className="btn-primary flex items-center justify-center gap-2 xs:px-8 flex-1 xs:flex-none"
                >
                  {checkingPhone
                    ? <><Loader2 className="w-4 h-4 animate-spin" />Checking…</>
                    : <>Continue <ChevronRight className="w-4 h-4" /></>}
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={submitting}
                  className="btn-primary flex items-center justify-center gap-2 xs:px-8 flex-1 xs:flex-none"
                >
                  {submitting
                    ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting…</>
                    : <><CheckCircle className="w-4 h-4" />Submit Survey</>}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Demo mode banner */}
        {!isSupabaseConfigured() && (
          <div className="mt-4 bg-amber-900/50 border border-amber-700/50 rounded-xl p-4 flex gap-3 items-start">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-amber-300 text-sm">
              <strong>Demo Mode:</strong> Add your Supabase credentials to{' '}
              <code className="bg-amber-900/50 px-1 rounded">.env</code> to enable real saving.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
