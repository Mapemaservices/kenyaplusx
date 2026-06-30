import { Link } from 'react-router-dom'
import { MapPin, Mail } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-400">
      {/* Kenya flag stripe */}
      <div className="h-1 flex">
        <div className="flex-1 bg-black" />
        <div className="flex-1 bg-kenya-red" />
        <div className="flex-1 bg-kenya-green" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="kenya-stripe w-7 h-7 rounded-lg" />
              <span className="text-white font-black text-xl">
                Kenya<span className="text-green-400">Plus</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed text-gray-500">
              Kenya's leading civic engagement platform — empowering every citizen to share
              their voice, connect with aspirants, and help shape a better tomorrow.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-green-400 transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/survey" className="hover:text-green-400 transition-colors">Take the Survey</Link>
              </li>
              <li>
                <Link to="/#aspirants" className="hover:text-green-400 transition-colors">Meet Aspirants</Link>
              </li>
            </ul>
          </div>

          {/* Contact / Info */}
          <div>
            <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">About</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Covering all 47 counties across Kenya</span>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>info@kenyaplus.co.ke</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 mt-10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} KenyaPlus. All rights reserved.
          </p>
          <p className="text-xs text-gray-600">
            Empowering Kenya's Democratic Voice 🇰🇪
          </p>
        </div>
      </div>
    </footer>
  )
}
