import { useState, useEffect, useMemo } from 'react'
import {
  Shield, Eye, EyeOff, LogOut, Users, BarChart2, MapPin, AlertCircle,
  Search, Filter, ChevronDown, ChevronUp, Loader2, RefreshCw,
  Download, CheckCircle, TrendingUp, UserCheck, Vote, Phone, Calendar
} from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { KENYA_COUNTIES, GENDERS, AGE_GROUPS, SEAT_COLORS } from '../data/kenya'
import type { SurveyResponse, Aspirant } from '../types'

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'KenyaAdmin2024'

type Tab = 'overview' | 'surveys' | 'aspirants'

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn]   = useState(false)
  const [password, setPassword]       = useState('')
  const [showPass, setShowPass]       = useState(false)
  const [loginError, setLoginError]   = useState('')
  const [activeTab, setActiveTab]     = useState<Tab>('overview')
  const [surveys, setSurveys]         = useState<SurveyResponse[]>([])
  const [aspirants, setAspirants]     = useState<Aspirant[]>([])
  const [loading, setLoading]         = useState(true)
  const [refreshing, setRefreshing]   = useState(false)
  const [error, setError]             = useState('')

  const [surveySearch, setSurveySearch] = useState('')
  const [surveyCounty, setSurveyCounty] = useState('')
  const [surveyGender, setSurveyGender] = useState('')
  const [aspSearch, setAspSearch]       = useState('')
  const [aspCounty, setAspCounty]       = useState('')
  const [expandedRow, setExpandedRow]   = useState<string | null>(null)

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) { setIsLoggedIn(true); setLoginError('') }
    else setLoginError('Incorrect password. Please try again.')
  }

  useEffect(() => { if (isLoggedIn) fetchAll() }, [isLoggedIn])

  async function fetchAll(isRefresh = false) {
    if (isRefresh) setRefreshing(true); else setLoading(true)
    setError('')
    try {
      if (!isSupabaseConfigured()) {
        await new Promise((r) => setTimeout(r, 800))
        setSurveys([]); setAspirants([])
        return
      }
      const [sRes, aRes] = await Promise.all([
        supabase.from('survey_responses').select('*').order('created_at', { ascending: false }),
        supabase.from('aspirants').select('*').order('created_at', { ascending: false }),
      ])
      if (sRes.error) throw sRes.error
      if (aRes.error) throw aRes.error
      setSurveys(sRes.data ?? [])
      setAspirants(aRes.data ?? [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false); setRefreshing(false)
    }
  }

  const filteredSurveys = useMemo(() =>
    surveys.filter((s) => {
      const q = surveySearch.toLowerCase()
      return (
        (!q || s.full_name.toLowerCase().includes(q) || s.county.toLowerCase().includes(q) || s.preferred_governor.toLowerCase().includes(q)) &&
        (!surveyCounty || s.county === surveyCounty) &&
        (!surveyGender || s.gender === surveyGender)
      )
    }), [surveys, surveySearch, surveyCounty, surveyGender])

  const filteredAspirants = useMemo(() =>
    aspirants.filter((a) => {
      const q = aspSearch.toLowerCase()
      return (
        (!q || a.full_name.toLowerCase().includes(q) || a.county.toLowerCase().includes(q)) &&
        (!aspCounty || a.county === aspCounty)
      )
    }), [aspirants, aspSearch, aspCounty])

  const stats = useMemo(() => {
    const uniqueCounties = new Set(surveys.map((s) => s.county))
    const genderCount: Record<string, number> = {}
    const ageCount:    Record<string, number> = {}
    const countyCount: Record<string, number> = {}
    const issueCount:  Record<string, number> = {}
    surveys.forEach((s) => {
      genderCount[s.gender]        = (genderCount[s.gender]        || 0) + 1
      ageCount[s.age_group]        = (ageCount[s.age_group]        || 0) + 1
      countyCount[s.county]        = (countyCount[s.county]        || 0) + 1
      issueCount[s.biggest_issue]  = (issueCount[s.biggest_issue]  || 0) + 1
    })
    return {
      uniqueCounties: uniqueCounties.size,
      genderCount, ageCount,
      topCounties: Object.entries(countyCount).sort((a, b) => b[1] - a[1]).slice(0, 5),
      topIssues:   Object.entries(issueCount).sort((a, b) => b[1] - a[1]).slice(0, 5),
    }
  }, [surveys])

  function exportCSV() {
    const headers = ['Name','Phone','County','Constituency','Ward','Gender','Age Group','Gov Candidate','Support Reason','Biggest Issue','Date']
    const rows = surveys.map((s) => [
      s.full_name, s.phone_number, s.county, s.constituency, s.ward,
      s.gender, s.age_group, s.preferred_governor, s.support_reason,
      s.biggest_issue, new Date(s.created_at).toLocaleDateString()
    ])
    const csv  = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `kenyaplus-surveys-${Date.now()}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: '2-digit' })
  }

  /* ===== LOGIN ===== */
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 pt-16 pb-8">
        <div className="w-full max-w-md animate-slide-up">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-800 rounded-2xl mb-4 border border-gray-700">
              <Shield className="w-8 h-8 text-green-400" />
            </div>
            <h1 className="text-3xl font-black text-white">
              Kenya<span className="text-green-400">Plus</span>
            </h1>
            <p className="text-gray-500 text-sm mt-1">Admin Dashboard</p>
          </div>

          <div className="bg-gray-900 rounded-3xl border border-gray-800 p-6 sm:p-8 shadow-2xl">
            <h2 className="text-xl font-black text-white mb-1">Secure Access</h2>
            <p className="text-gray-500 text-sm mb-7">Enter your admin password to continue</p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setLoginError('') }}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3.5 pr-12 text-base text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    autoComplete="current-password"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {loginError && (
                  <div className="flex items-center gap-2 mt-2">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <p className="text-red-400 text-sm">{loginError}</p>
                  </div>
                )}
              </div>
              <button type="submit"
                className="w-full bg-green-600 hover:bg-green-500 text-white font-black py-4 rounded-xl transition-all flex items-center justify-center gap-2 min-h-[52px]"
              >
                <Shield className="w-4 h-4" />Login to Dashboard
              </button>
            </form>

          </div>
        </div>
      </div>
    )
  }

  /* ===== DASHBOARD ===== */
  return (
    <div className="min-h-screen bg-gray-950 pt-14 sm:pt-16">

      {/* Sticky sub-header */}
      <div className="bg-gray-900 border-b border-gray-800 sticky top-14 sm:top-16 z-40">
        {/* Title row */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 bg-green-900/60 rounded-xl flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 text-green-400" />
            </div>
            <div className="min-w-0">
              <h1 className="text-white font-black text-base sm:text-lg leading-tight truncate">Admin Dashboard</h1>
              <p className="text-gray-500 text-xs hidden sm:block">KenyaPlus Management Console</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => fetchAll(true)} disabled={refreshing}
              className="flex items-center gap-1.5 text-gray-400 hover:text-white text-xs sm:text-sm border border-gray-700 hover:border-gray-600 px-2.5 sm:px-3 py-2 rounded-lg transition-all min-h-[36px]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden xs:inline">Refresh</span>
            </button>
            <button onClick={() => setIsLoggedIn(false)}
              className="flex items-center gap-1.5 text-red-400 hover:text-red-300 text-xs sm:text-sm border border-red-900/50 hover:border-red-700 px-2.5 sm:px-3 py-2 rounded-lg transition-all min-h-[36px]"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Scrollable tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-x-auto scrollbar-thin">
          <div className="flex gap-0 min-w-max">
            {([
              { id: 'overview',  label: 'Overview',                          icon: BarChart2  },
              { id: 'surveys',   label: `Surveys (${surveys.length})`,       icon: Vote       },
              { id: 'aspirants', label: `Aspirants (${aspirants.length})`,   icon: UserCheck  },
            ] as const).map((t) => {
              const Icon = t.icon
              return (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                    activeTab === t.id
                      ? 'border-green-500 text-green-400'
                      : 'border-transparent text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />{t.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <Loader2 className="w-10 h-10 text-green-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-400">Loading data…</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-900/30 border border-red-800 rounded-2xl p-8 text-center">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <h3 className="text-red-300 font-bold mb-2">Error Loading Data</h3>
            <p className="text-red-400/80 text-sm mb-6">{error}</p>
            <button onClick={() => fetchAll()}
              className="bg-red-700 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-semibold transition-all"
            >Try Again</button>
          </div>
        ) : !isSupabaseConfigured() ? (
          <div className="bg-amber-900/30 border border-amber-700 rounded-2xl p-6 sm:p-8 text-center">
            <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
            <h3 className="text-amber-300 font-bold mb-2">Supabase Not Configured</h3>
            <p className="text-amber-400/80 text-sm">
              Copy <code className="bg-amber-900/50 px-1 rounded">.env.example</code> to{' '}
              <code className="bg-amber-900/50 px-1 rounded">.env</code> and fill in your Supabase credentials.
            </p>
          </div>
        ) : (
          <>
            {/* ===== OVERVIEW ===== */}
            {activeTab === 'overview' && (
              <div className="space-y-6 sm:space-y-8 animate-fade-in">
                {/* Stat cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {[
                    { label: 'Total Responses', value: surveys.length,           icon: Vote,       color: 'green' },
                    { label: 'Counties Covered', value: `${stats.uniqueCounties}/47`, icon: MapPin, color: 'blue'  },
                    { label: 'Aspirants',        value: aspirants.length,         icon: Users,      color: 'purple'},
                    { label: 'Avg / County',     value: stats.uniqueCounties ? Math.round(surveys.length / stats.uniqueCounties) : 0, icon: TrendingUp, color: 'orange' },
                  ].map((s) => {
                    const Icon = s.icon
                    const cls: Record<string, string> = {
                      green:  'bg-green-900/50  text-green-400  border-green-800/50',
                      blue:   'bg-blue-900/50   text-blue-400   border-blue-800/50',
                      purple: 'bg-purple-900/50 text-purple-400 border-purple-800/50',
                      orange: 'bg-orange-900/50 text-orange-400 border-orange-800/50',
                    }
                    return (
                      <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-5">
                        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center mb-3 sm:mb-4 border ${cls[s.color]}`}>
                          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <p className="text-2xl sm:text-3xl font-black text-white mb-0.5">{s.value}</p>
                        <p className="text-gray-500 text-xs sm:text-sm">{s.label}</p>
                      </div>
                    )
                  })}
                </div>

                {/* Charts grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {/* Top Counties */}
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 sm:p-6">
                    <h3 className="text-white font-bold mb-5 flex items-center gap-2 text-sm sm:text-base">
                      <MapPin className="w-4 h-4 text-green-400 flex-shrink-0" />Top Counties
                    </h3>
                    <div className="space-y-3">
                      {stats.topCounties.length === 0
                        ? <p className="text-gray-600 text-sm">No data yet</p>
                        : stats.topCounties.map(([county, count], i) => {
                            const pct = Math.round((count / surveys.length) * 100)
                            return (
                              <div key={county}>
                                <div className="flex justify-between text-xs sm:text-sm mb-1.5">
                                  <span className="text-gray-300 font-medium truncate mr-2">
                                    <span className="text-gray-600 mr-1">#{i+1}</span>{county}
                                  </span>
                                  <span className="text-gray-400 flex-shrink-0">{count} ({pct}%)</span>
                                </div>
                                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full" style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            )
                          })
                      }
                    </div>
                  </div>

                  {/* Top Issues */}
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 sm:p-6">
                    <h3 className="text-white font-bold mb-5 flex items-center gap-2 text-sm sm:text-base">
                      <BarChart2 className="w-4 h-4 text-orange-400 flex-shrink-0" />Top Issues
                    </h3>
                    <div className="space-y-3">
                      {stats.topIssues.length === 0
                        ? <p className="text-gray-600 text-sm">No data yet</p>
                        : stats.topIssues.map(([issue, count], i) => {
                            const pct = Math.round((count / surveys.length) * 100)
                            return (
                              <div key={issue}>
                                <div className="flex justify-between text-xs sm:text-sm mb-1.5">
                                  <span className="text-gray-300 font-medium truncate mr-2">
                                    <span className="text-gray-600 mr-1">#{i+1}</span>{issue}
                                  </span>
                                  <span className="text-gray-400 flex-shrink-0">{count} ({pct}%)</span>
                                </div>
                                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full" style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            )
                          })
                      }
                    </div>
                  </div>

                  {/* Gender */}
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 sm:p-6">
                    <h3 className="text-white font-bold mb-5 flex items-center gap-2 text-sm sm:text-base">
                      <Users className="w-4 h-4 text-blue-400 flex-shrink-0" />Gender Breakdown
                    </h3>
                    <div className="space-y-3">
                      {GENDERS.map((g) => {
                        const count = stats.genderCount[g] || 0
                        const pct   = surveys.length ? Math.round((count / surveys.length) * 100) : 0
                        return (
                          <div key={g}>
                            <div className="flex justify-between text-xs sm:text-sm mb-1.5">
                              <span className="text-gray-300">{g}</span>
                              <span className="text-gray-400">{count} ({pct}%)</span>
                            </div>
                            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Age */}
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 sm:p-6">
                    <h3 className="text-white font-bold mb-5 flex items-center gap-2 text-sm sm:text-base">
                      <TrendingUp className="w-4 h-4 text-purple-400 flex-shrink-0" />Age Groups
                    </h3>
                    <div className="space-y-3">
                      {AGE_GROUPS.map((ag) => {
                        const count = stats.ageCount[ag] || 0
                        const pct   = surveys.length ? Math.round((count / surveys.length) * 100) : 0
                        return (
                          <div key={ag}>
                            <div className="flex justify-between text-xs sm:text-sm mb-1.5">
                              <span className="text-gray-300">{ag}</span>
                              <span className="text-gray-400">{count} ({pct}%)</span>
                            </div>
                            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ===== SURVEYS TAB ===== */}
            {activeTab === 'surveys' && (
              <div className="animate-fade-in space-y-4 sm:space-y-5">
                {/* Filters — stacked on mobile */}
                <div className="flex flex-col gap-3">
                  {/* Search */}
                  <div className="relative w-full">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                    <input type="text"
                      value={surveySearch} onChange={(e) => setSurveySearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[44px]"
                    />
                  </div>
                  {/* Dropdowns row */}
                  <div className="flex gap-3 flex-wrap">
                    <div className="relative flex-1 min-w-[130px]">
                      <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                      <select value={surveyCounty} onChange={(e) => setSurveyCounty(e.target.value)}
                        className="w-full pl-9 pr-3 py-3 bg-gray-900 border border-gray-700 rounded-xl text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none min-h-[44px]"
                      >
                        <option value="">All Counties</option>
                        {KENYA_COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="relative flex-1 min-w-[110px]">
                      <select value={surveyGender} onChange={(e) => setSurveyGender(e.target.value)}
                        className="w-full px-3 py-3 bg-gray-900 border border-gray-700 rounded-xl text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none min-h-[44px]"
                      >
                        <option value="">All Genders</option>
                        {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <button onClick={exportCSV}
                      className="flex items-center gap-2 bg-green-700 hover:bg-green-600 text-white text-sm font-semibold px-4 py-3 rounded-xl transition-all flex-shrink-0 min-h-[44px]"
                    >
                      <Download className="w-4 h-4" />
                      <span className="hidden xs:inline">Export</span>
                    </button>
                  </div>
                  <p className="text-gray-500 text-xs sm:text-sm">
                    {filteredSurveys.length} result{filteredSurveys.length !== 1 ? 's' : ''}
                  </p>
                </div>

                {filteredSurveys.length === 0 ? (
                  <div className="text-center py-16 text-gray-600">
                    <Vote className="w-12 h-12 mx-auto mb-4 text-gray-800" />
                    <p className="text-lg font-semibold">No responses found</p>
                    <p className="text-sm mt-1">Try adjusting your filters</p>
                  </div>
                ) : (
                  <>
                    {/* ── MOBILE CARDS (< md) ── */}
                    <div className="md:hidden space-y-3">
                      {filteredSurveys.map((s, i) => (
                        <div key={s.id} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                          <button
                            onClick={() => setExpandedRow(expandedRow === s.id ? null : s.id)}
                            className="w-full p-4 text-left"
                          >
                            <div className="flex items-start justify-between gap-3">
                              {/* Avatar + name */}
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-700 to-green-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                                  <span className="text-sm font-black text-white">{s.full_name.charAt(0)}</span>
                                </div>
                                <div className="min-w-0">
                                  <p className="text-white font-bold text-sm truncate">{s.full_name}</p>
                                  <p className="text-gray-500 text-xs">{s.gender} · {s.age_group}</p>
                                </div>
                              </div>
                              {/* Row number + expand */}
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-gray-700 text-xs">#{i + 1}</span>
                                {expandedRow === s.id
                                  ? <ChevronUp  className="w-4 h-4 text-gray-500" />
                                  : <ChevronDown className="w-4 h-4 text-gray-500" />}
                              </div>
                            </div>
                            {/* Summary line */}
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <span className="flex items-center gap-1 text-xs text-gray-400">
                                <MapPin className="w-3 h-3" />{s.county}
                              </span>
                              <span className="text-gray-700">·</span>
                              <span className="text-xs bg-orange-900/40 text-orange-300 px-2 py-0.5 rounded-full font-medium">
                                {s.biggest_issue}
                              </span>
                              <span className="text-gray-700 ml-auto">·</span>
                              <span className="flex items-center gap-1 text-xs text-gray-600">
                                <Calendar className="w-3 h-3" />{fmtDate(s.created_at)}
                              </span>
                            </div>
                          </button>

                          {expandedRow === s.id && (
                            <div className="px-4 pb-4 border-t border-gray-800 pt-4 space-y-4 animate-fade-in">
                              <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                                {[
                                  { l: 'County',       v: s.county },
                                  { l: 'Constituency', v: s.constituency },
                                  { l: 'Ward',         v: s.ward },
                                  { l: 'Phone',        v: s.phone_number },
                                  { l: 'Governor',     v: s.preferred_governor },
                                  { l: 'Issue',        v: s.biggest_issue },
                                ].map(({ l, v }) => (
                                  <div key={l}>
                                    <p className="text-gray-600 text-xs mb-0.5">{l}</p>
                                    <p className="text-gray-200 text-sm font-semibold truncate">{v}</p>
                                  </div>
                                ))}
                              </div>
                              <div>
                                <p className="text-green-400 text-xs font-bold uppercase tracking-wider mb-1.5">Support Reason</p>
                                <p className="text-gray-300 text-sm bg-gray-800 rounded-xl p-3 leading-relaxed">{s.support_reason}</p>
                              </div>
                              {s.issue_details && (
                                <div>
                                  <p className="text-orange-400 text-xs font-bold uppercase tracking-wider mb-1.5">Issue Details</p>
                                  <p className="text-gray-300 text-sm bg-gray-800 rounded-xl p-3 leading-relaxed">{s.issue_details}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* ── DESKTOP TABLE (≥ md) ── */}
                    <div className="hidden md:block bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                      <div className="grid grid-cols-[2rem_1.5fr_1fr_1fr_1fr_5.5rem] gap-4 px-5 py-3 border-b border-gray-800 text-xs font-bold text-gray-500 uppercase tracking-wider">
                        <span>#</span><span>Name</span><span>County / Ward</span>
                        <span>Gov. Candidate</span><span>Issue</span><span>Date</span>
                      </div>
                      <div className="divide-y divide-gray-800/50">
                        {filteredSurveys.map((s, i) => (
                          <div key={s.id}>
                            <button
                              className="w-full grid grid-cols-[2rem_1.5fr_1fr_1fr_1fr_5.5rem] gap-4 px-5 py-4 text-left hover:bg-gray-800/50 transition-colors items-center"
                              onClick={() => setExpandedRow(expandedRow === s.id ? null : s.id)}
                            >
                              <span className="text-gray-600 text-sm">{i + 1}</span>
                              <div className="min-w-0">
                                <p className="text-white font-semibold text-sm truncate">{s.full_name}</p>
                                <p className="text-gray-500 text-xs">{s.gender} · {s.age_group}</p>
                              </div>
                              <div className="min-w-0">
                                <p className="text-gray-300 text-sm truncate">{s.county}</p>
                                <p className="text-gray-500 text-xs truncate">{s.ward}</p>
                              </div>
                              <p className="text-gray-300 text-sm truncate">{s.preferred_governor}</p>
                              <span className="text-xs bg-orange-900/40 text-orange-300 px-2 py-1 rounded-full font-medium truncate block w-fit max-w-full">
                                {s.biggest_issue}
                              </span>
                              <div className="flex items-center justify-between min-w-0">
                                <p className="text-gray-500 text-xs">{fmtDate(s.created_at)}</p>
                                {expandedRow === s.id
                                  ? <ChevronUp   className="w-4 h-4 text-gray-600 flex-shrink-0" />
                                  : <ChevronDown className="w-4 h-4 text-gray-600 flex-shrink-0" />}
                              </div>
                            </button>

                            {expandedRow === s.id && (
                              <div className="px-5 pb-5 bg-gray-800/30 border-t border-gray-800 animate-fade-in">
                                <div className="grid grid-cols-2 gap-6 pt-4">
                                  <div className="space-y-3">
                                    <h4 className="text-green-400 font-bold text-xs uppercase tracking-wider">Location</h4>
                                    {[['County', s.county],['Constituency', s.constituency],['Ward', s.ward]].map(([l, v]) => (
                                      <div key={l} className="flex justify-between text-sm">
                                        <span className="text-gray-500">{l}</span>
                                        <span className="text-gray-200 font-medium">{v}</span>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="space-y-3">
                                    <h4 className="text-blue-400 font-bold text-xs uppercase tracking-wider">Personal</h4>
                                    {[['Phone', s.phone_number],['Gender', s.gender],['Age Group', s.age_group]].map(([l, v]) => (
                                      <div key={l} className="flex justify-between text-sm">
                                        <span className="text-gray-500">{l}</span>
                                        <span className="text-gray-200 font-medium">{v}</span>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="col-span-2">
                                    <h4 className="text-red-400 font-bold text-xs uppercase tracking-wider mb-2">
                                      Why They Support {s.preferred_governor}
                                    </h4>
                                    <p className="text-gray-300 text-sm bg-gray-800 rounded-xl p-4 leading-relaxed">{s.support_reason}</p>
                                  </div>
                                  {s.issue_details && (
                                    <div className="col-span-2">
                                      <h4 className="text-orange-400 font-bold text-xs uppercase tracking-wider mb-2">Issue Details</h4>
                                      <p className="text-gray-300 text-sm bg-gray-800 rounded-xl p-4 leading-relaxed">{s.issue_details}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ===== ASPIRANTS TAB ===== */}
            {activeTab === 'aspirants' && (
              <div className="animate-fade-in space-y-4 sm:space-y-5">
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                    <input type="text"
                      value={aspSearch} onChange={(e) => setAspSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[44px]"
                    />
                  </div>
                  <div className="relative sm:w-48">
                    <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                    <select value={aspCounty} onChange={(e) => setAspCounty(e.target.value)}
                      className="w-full pl-9 pr-3 py-3 bg-gray-900 border border-gray-700 rounded-xl text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none min-h-[44px]"
                    >
                      <option value="">All Counties</option>
                      {KENYA_COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <p className="text-gray-500 text-xs sm:text-sm self-center sm:flex-shrink-0">
                    {filteredAspirants.length} aspirant{filteredAspirants.length !== 1 ? 's' : ''}
                  </p>
                </div>

                {filteredAspirants.length === 0 ? (
                  <div className="text-center py-16 text-gray-600">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-800" />
                    <p className="text-lg font-semibold">No aspirants found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                    {filteredAspirants.map((a) => (
                      <div key={a.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 sm:p-6 hover:border-gray-700 transition-all">
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-green-700 to-green-500 flex items-center justify-center shadow-lg flex-shrink-0">
                            <span className="text-lg sm:text-xl font-black text-white">{a.full_name.charAt(0)}</span>
                          </div>
                          <div className="flex items-center gap-1 ml-3">
                            <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                            <span className="text-green-500 text-xs font-semibold">Registered</span>
                          </div>
                        </div>
                        <h3 className="text-white font-black text-sm sm:text-base mb-2">{a.full_name}</h3>
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${SEAT_COLORS[a.seat] || 'bg-gray-700 text-gray-300'}`}>
                            {a.seat}
                          </span>
                          <span className="text-xs bg-gray-800 text-gray-400 px-2.5 py-1 rounded-full">{a.county}</span>
                        </div>
                        {a.party && <p className="text-xs text-gray-500 mb-2">🏛️ {a.party}</p>}
                        <p className="text-gray-400 text-sm line-clamp-3 leading-relaxed mb-4">{a.brief_bio}</p>
                        <div className="pt-4 border-t border-gray-800 flex items-center justify-between gap-2">
                          <p className="text-xs text-gray-600 flex items-center gap-1 min-w-0">
                            <Phone className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{a.phone_number}</span>
                          </p>
                          <p className="text-xs text-gray-700 flex-shrink-0">{fmtDate(a.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
