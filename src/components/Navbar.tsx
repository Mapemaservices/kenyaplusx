import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Vote, Shield } from 'lucide-react'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => { setMenuOpen(false) }, [location])

  // Prevent body scroll when menu open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  const isActive = (path: string) => location.pathname === path

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled || menuOpen ? 'bg-gray-950 shadow-2xl shadow-black/20' : 'bg-transparent'
        }`}
      >
        {/* Kenya flag top stripe */}
        <div className="h-1 flex flex-shrink-0">
          <div className="flex-1 bg-black" />
          <div className="flex-1" style={{ background: '#BB0000' }} />
          <div className="flex-1 bg-green-700" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 min-w-0">
              <div className="kenya-stripe w-7 h-7 rounded-lg flex-shrink-0 shadow-md" />
              <span className="text-white font-black text-lg sm:text-xl tracking-tight">
                Kenya<span className="text-green-400">Plus</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {[
                { to: '/', label: 'Home' },
                { to: '/survey', label: 'Take Survey' },
              ].map(({ to, label }) => (
                <Link key={to} to={to}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive(to)
                      ? 'bg-green-600 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >{label}</Link>
              ))}
              <Link to="/admin"
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive('/admin')
                    ? 'bg-red-700 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />Admin
              </Link>
              <Link to="/survey"
                className="ml-3 flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all duration-200 shadow-lg shadow-green-900/30"
              >
                <Vote className="w-4 h-4" />Vote Now
              </Link>
            </div>

            {/* Mobile: CTA + burger */}
            <div className="flex md:hidden items-center gap-2">
              <Link to="/survey"
                className="flex items-center gap-1.5 bg-green-600 hover:bg-green-500 text-white font-bold px-3.5 py-2 rounded-xl text-sm transition-all"
              >
                <Vote className="w-3.5 h-3.5" />Survey
              </Link>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="text-white p-2 rounded-lg hover:bg-white/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              >
                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile full-screen overlay menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
          {/* Panel — slides in from right */}
          <div className="absolute top-0 right-0 bottom-0 w-72 bg-gray-950 border-l border-white/10 flex flex-col pt-20 pb-8 px-5 overflow-y-auto animate-slide-left">
            {/* Close */}
            <button
              onClick={() => setMenuOpen(false)}
              className="absolute top-5 right-4 text-gray-400 hover:text-white p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>

            <nav className="flex flex-col gap-2">
              {[
                { to: '/', label: 'Home', icon: null },
                { to: '/survey', label: 'Take Survey', icon: <Vote className="w-4 h-4" /> },
              ].map(({ to, label, icon }) => (
                <Link key={to} to={to}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all min-h-[48px] ${
                    isActive(to)
                      ? 'bg-green-700/60 text-green-300'
                      : 'text-gray-300 hover:bg-white/10'
                  }`}
                >
                  {icon}<span>{label}</span>
                </Link>
              ))}
            </nav>

            <div className="mt-6 pt-6 border-t border-white/10">
              <Link to="/survey"
                className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-500 text-white font-black py-4 rounded-2xl text-base transition-all"
              >
                <Vote className="w-5 h-5" />Take the Survey Now
              </Link>
            </div>

            <div className="mt-auto pt-8 flex items-center gap-2">
              <div className="kenya-stripe w-5 h-5 rounded" />
              <span className="text-gray-600 text-xs">KenyaPlus © {new Date().getFullYear()}</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
