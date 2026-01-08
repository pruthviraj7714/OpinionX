import { TrendingUp } from "lucide-react";

export default function Footer() {
    return (
      <footer className="bg-zinc-900 border-t border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-linear-to-r from-purple-500 to-pink-500 rounded-lg blur-md opacity-50" />
                <div className="relative bg-linear-to-br from-purple-600 to-pink-600 p-2 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="flex items-center">
                <span className="text-xl font-bold text-zinc-100">Opinion</span>
                <span className="ml-1 text-2xl font-black bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">X</span>
              </div>
            </div>
            <p className="text-zinc-400 text-sm leading-relaxed max-w-md">
              Trade on predictions and outcomes. Make informed decisions with real-time market data and community insights.
            </p>
            <div className="flex gap-4 mt-6">
              <a href="#" className="h-10 w-10 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-zinc-100 transition-all">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
                </svg>
              </a>
              <a href="#" className="h-10 w-10 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-zinc-100 transition-all">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </a>
              <a href="#" className="h-10 w-10 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-zinc-100 transition-all">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-zinc-100 font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><a href="/dashboard" className="text-zinc-400 hover:text-purple-400 text-sm transition-colors">Dashboard</a></li>
              <li><a href="/markets" className="text-zinc-400 hover:text-purple-400 text-sm transition-colors">All Markets</a></li>
              <li><a href="/how-it-works" className="text-zinc-400 hover:text-purple-400 text-sm transition-colors">How It Works</a></li>
              <li><a href="/about" className="text-zinc-400 hover:text-purple-400 text-sm transition-colors">About Us</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-zinc-100 font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              <li><a href="/help" className="text-zinc-400 hover:text-purple-400 text-sm transition-colors">Help Center</a></li>
              <li><a href="/terms" className="text-zinc-400 hover:text-purple-400 text-sm transition-colors">Terms of Service</a></li>
              <li><a href="/privacy" className="text-zinc-400 hover:text-purple-400 text-sm transition-colors">Privacy Policy</a></li>
              <li><a href="/contact" className="text-zinc-400 hover:text-purple-400 text-sm transition-colors">Contact Us</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-zinc-800 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-zinc-500 text-sm">
              © {new Date().getFullYear()} OpinionX. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="/status" className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                All Systems Operational
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
    )
}