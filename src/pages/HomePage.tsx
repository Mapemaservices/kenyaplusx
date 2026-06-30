import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronDown, Vote, Star, Users, MapPin, TrendingUp, Shield,
  CheckCircle, X, AlertCircle, Loader2,
  ChevronRight, Award, Mic2
} from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { KENYA_COUNTIES, SEATS } from '../data/kenya'
import type { AspirantFormData } from '../types'

const INITIAL_ASPIRANT_FORM: AspirantFormData = {
  full_name: '', county: '', seat: '', party: '', phone_number: '', brief_bio: '',
}

export default function HomePage() {
  const [showModal, setShowModal]           = useState(false)
  const [form, setForm]                     = useState<AspirantFormData>(INITIAL_ASPIRANT_FORM)
  const [errors, setErrors]                 = useState<Partial<AspirantFormData>>({})
  const [submitting, setSubmitting]         = useState(false)
  const [submitStatus, setSubmitStatus]     = useState<'idle' | 'success' | 'error'>('idle')

  function validate(): boolean {
    const e: Partial<AspirantFormData> = {}
    if (!form.full_name.trim()) e.full_name = 'Full name is required'
    if (!form.county)           e.county    = 'Please select your county'
    if (!form.seat)             e.seat      = 'Please select your seat'
    if (!form.phone_number.trim()) e.phone_number = 'Phone number is required'
    else if (!/^0[0-9]{9}$/.test(form.phone_number.replace(/\s/g, '')))
      e.phone_number = 'Enter a valid Kenyan number (e.g. 0712345678)'
    if (!form.brief_bio.trim())        e.brief_bio = 'Please write a brief bio'
    else if (form.brief_bio.trim().length < 30) e.brief_bio = 'Bio must be at least 30 characters'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      if (!isSupabaseConfigured()) {
        await new Promise((r) => setTimeout(r, 800))
        setSubmitStatus('success')
        return
      }
      const { error } = await supabase.from('aspirants').insert([form])
      if (error) throw error
      setSubmitStatus('success')
    } catch { setSubmitStatus('error') }
    finally { setSubmitting(false) }
  }

  function resetModal() {
    setShowModal(false)
    setForm(INITIAL_ASPIRANT_FORM)
    setErrors({})
    setSubmitStatus('idle')
  }

  return (
    <div className="overflow-x-hidden">

      {/* ===== HERO ===== */}
      <section className="relative min-h-screen bg-gray-950 overflow-hidden flex items-center bg-hero-pattern">
        {/* Decorative Kenya flag columns — only on large screens */}
        <div className="absolute right-0 top-0 bottom-0 hidden lg:flex w-48 xl:w-64 opacity-20 pointer-events-none">
          <div className="w-1/3 bg-black" />
          <div className="w-1/3 bg-red-700 flex items-center justify-center">
            <div className="w-8 h-10 border-4 border-white/50 rounded-sm" />
          </div>
          <div className="w-1/3 bg-green-700" />
        </div>
        {/* Gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/90 to-gray-950/50 lg:to-transparent pointer-events-none" />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 sm:py-36 lg:py-44">
          <div className="max-w-2xl">
            {/* Live badge */}
            <div className="inline-flex items-center gap-2 bg-green-900/60 border border-green-700/50 rounded-full px-3 sm:px-4 py-2 mb-6 sm:mb-8 backdrop-blur-sm max-w-full">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
              <span className="text-green-300 text-xs sm:text-sm font-semibold truncate">
                Survey Open · Join Kenya's Conversation
              </span>
            </div>

            {/* Heading */}
            <h1 className="text-4xl xs:text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.05] mb-5 sm:mb-6">
              YOUR VOICE<br />
              <span className="text-green-400">SHAPES</span>{' '}
              <span style={{ color: '#ef4444' }}>KENYA'S</span><br />
              FUTURE
            </h1>

            <p className="text-base sm:text-lg text-gray-300 mb-8 sm:mb-10 leading-relaxed max-w-lg">
              Join thousands of Kenyans sharing their views on governance, aspirants,
              and the issues that matter most in their counties.
            </p>

            {/* CTAs */}
            <div className="flex flex-col xs:flex-row gap-3 sm:gap-4">
              <Link to="/survey"
                className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500
                           text-white font-black px-6 sm:px-8 py-4 rounded-2xl text-base sm:text-lg
                           transition-all duration-200 hover:scale-105 shadow-xl shadow-green-900/40"
              >
                <Vote className="w-5 h-5 flex-shrink-0" />
                Take the Survey
                <ChevronRight className="w-4 h-4 flex-shrink-0" />
              </Link>
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center justify-center gap-2 border-2 border-white/20
                           hover:border-green-400/60 text-white font-bold px-6 sm:px-8 py-4 rounded-2xl
                           text-base sm:text-lg transition-all duration-200 hover:bg-green-950/30"
              >
                <Star className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                Be an Aspirant
              </button>
            </div>

          </div>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-gray-600 animate-bounce-slow pointer-events-none">
          <ChevronDown className="w-6 h-6" />
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-14">
            <span className="text-green-600 font-bold text-xs sm:text-sm uppercase tracking-widest">Simple & Fast</span>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mt-2">How It Works</h2>
            <p className="text-gray-500 mt-3 text-sm sm:text-base max-w-xl mx-auto">
              Three easy steps to make your civic voice heard
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-8">
            {[
              {
                icon: <MapPin className="w-6 h-6 text-green-600" />,
                step: '01', title: 'Enter Your Location',
                desc: 'Tell us your county, constituency, and ward so we can capture regional insights accurately.',
                color: 'bg-green-50 border-green-100',
              },
              {
                icon: <Mic2 className="w-6 h-6 text-red-500" />,
                step: '02', title: 'Share Your Views',
                desc: 'Answer 5 simple steps: your background, preferred governor, and the biggest issue in your county.',
                color: 'bg-red-50 border-red-100',
              },
              {
                icon: <TrendingUp className="w-6 h-6 text-purple-600" />,
                step: '03', title: 'Shape the Future',
                desc: 'Your response joins thousands of others, creating real data that influences governance and policy.',
                color: 'bg-purple-50 border-purple-100',
              },
            ].map((item) => (
              <div key={item.step}
                className={`relative p-6 sm:p-8 rounded-2xl border-2 ${item.color} transition-all hover:shadow-lg`}
              >
                <span className="absolute top-5 right-5 text-4xl sm:text-5xl font-black text-gray-100 leading-none select-none">
                  {item.step}
                </span>
                <div className="mb-4">{item.icon}</div>
                <h3 className="text-lg sm:text-xl font-black text-gray-900 mb-2 sm:mb-3">{item.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-10 sm:mt-12">
            <Link to="/survey"
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white
                         font-bold px-6 sm:px-8 py-4 rounded-2xl text-sm sm:text-base
                         transition-all hover:scale-105 shadow-lg shadow-green-200"
            >
              Start Now — It takes 2 minutes <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ===== TRUST STRIP ===== */}
      <section className="py-10 sm:py-14 bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {[
              { icon: <Shield className="w-5 h-5" />, title: 'Secure & Private', desc: 'Your data is protected' },
              { icon: <CheckCircle className="w-5 h-5" />, title: 'Verified Results', desc: 'Real-time analytics' },
              { icon: <Users className="w-5 h-5" />, title: '47 Counties', desc: 'Nationwide coverage' },
              { icon: <Award className="w-5 h-5" />, title: 'Transparent', desc: 'Open civic platform' },
            ].map((f) => (
              <div key={f.title} className="text-center p-4 sm:p-6">
                <div className="w-11 h-11 bg-green-900/50 rounded-xl flex items-center justify-center text-green-400 mx-auto mb-3">
                  {f.icon}
                </div>
                <h4 className="text-white font-bold text-xs sm:text-sm">{f.title}</h4>
                <p className="text-gray-500 text-xs mt-1 hidden sm:block">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== BOTTOM CTA ===== */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-green-700 via-green-600 to-green-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-hero-pattern opacity-30 pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4">
            Ready to Share Your Voice?
          </h2>
          <p className="text-green-100 text-base sm:text-lg mb-8 sm:mb-10 max-w-xl mx-auto">
            The survey takes less than 2 minutes and your response helps shape Kenya's political landscape.
          </p>
          <Link to="/survey"
            className="inline-flex items-center gap-3 bg-white text-green-700 font-black
                       px-8 sm:px-10 py-4 rounded-2xl text-base sm:text-lg
                       hover:bg-green-50 transition-all hover:scale-105 shadow-2xl"
          >
            <Vote className="w-5 h-5" />Take the Survey Now
          </Link>
        </div>
      </section>

      {/* ===== REGISTER ASPIRANT MODAL ===== */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4 animate-fade-in"
          onClick={resetModal}
        >
          <div
            className="modal-sheet sm:rounded-3xl bg-white w-full sm:max-w-lg shadow-2xl overflow-y-auto max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 sm:p-8">
              {/* Drag handle */}
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5 sm:hidden" />

              {submitStatus === 'success' ? (
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-black text-gray-900 mb-3">Registration Submitted!</h2>
                  <p className="text-gray-600 mb-8 text-sm sm:text-base">
                    Your aspirant profile has been submitted successfully. It will appear on the platform shortly.
                  </p>
                  <button onClick={resetModal} className="btn-primary w-full text-center py-4">Close</button>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start mb-5">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black text-gray-900">Register as Aspirant</h2>
                      <p className="text-gray-500 text-sm mt-1">Declare your candidacy on KenyaPlus</p>
                    </div>
                    <button
                      onClick={resetModal}
                      className="text-gray-400 hover:text-gray-600 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-gray-100 flex-shrink-0"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {submitStatus === 'error' && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5 flex gap-3">
                      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-red-700 text-sm">Something went wrong. Please try again.</p>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Full name */}
                    <div>
                      <label className="label">Full Name *</label>
                      <input type="text"
                        value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                        className={`input-field ${errors.full_name ? 'input-field-error' : ''}`}
                      />
                      {errors.full_name && <p className="error-text"><AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{errors.full_name}</p>}
                    </div>

                    {/* County + Seat — stack on mobile */}
                    <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
                      <div>
                        <label className="label">County *</label>
                        <select value={form.county} onChange={(e) => setForm({ ...form, county: e.target.value })}
                          className={`input-field ${errors.county ? 'input-field-error' : ''}`}
                        >
                          <option value="">Select county</option>
                          {KENYA_COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                        {errors.county && <p className="error-text"><AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{errors.county}</p>}
                      </div>
                      <div>
                        <label className="label">Seat *</label>
                        <select value={form.seat} onChange={(e) => setForm({ ...form, seat: e.target.value })}
                          className={`input-field ${errors.seat ? 'input-field-error' : ''}`}
                        >
                          <option value="">Select seat</option>
                          {SEATS.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                        {errors.seat && <p className="error-text"><AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{errors.seat}</p>}
                      </div>
                    </div>

                    {/* Party + Phone — stack on mobile */}
                    <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
                      <div>
                        <label className="label">Party / Alliance</label>
                        <input type="text"
                          value={form.party} onChange={(e) => setForm({ ...form, party: e.target.value })}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="label">Phone Number *</label>
                        <input type="tel"
                          value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                          className={`input-field ${errors.phone_number ? 'input-field-error' : ''}`}
                        />
                        {errors.phone_number && <p className="error-text"><AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{errors.phone_number}</p>}
                      </div>
                    </div>

                    {/* Bio */}
                    <div>
                      <label className="label">Brief Bio / Vision *</label>
                      <textarea
                        value={form.brief_bio} onChange={(e) => setForm({ ...form, brief_bio: e.target.value })}
                        rows={4} className={`input-field resize-none ${errors.brief_bio ? 'input-field-error' : ''}`}
                      />
                      <div className="flex justify-between items-center mt-1">
                        {errors.brief_bio
                          ? <p className="error-text"><AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{errors.brief_bio}</p>
                          : <span />}
                        <span className={`text-xs ml-auto ${form.brief_bio.length < 30 ? 'text-red-400' : 'text-green-600'}`}>
                          {form.brief_bio.length} / 30 min
                        </span>
                      </div>
                    </div>

                    <button type="submit" disabled={submitting}
                      className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-base"
                    >
                      {submitting
                        ? <><Loader2 className="w-5 h-5 animate-spin" />Submitting…</>
                        : <><Star className="w-5 h-5" />Submit Registration</>}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
