import Link from 'next/link';
import { HeartPulse } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-niramayah-navy py-12 text-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="flex flex-col space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <HeartPulse className="h-8 w-8 text-niramayah-orange" />
              <span className="font-serif text-2xl font-bold tracking-tight">
                NIRAMAYAH
              </span>
            </Link>
            <p className="text-sm text-gray-400">
              Precision Cardiac Diagnosis.<br />
              Enhancing Cardiac Diagnosis Through Non-Invasive Innovation.
            </p>
          </div>
          <div>
            <h3 className="mb-4 text-lg font-semibold text-niramayah-green">Quick Links</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/technology" className="hover:text-white transition-colors">Technology</Link></li>
              <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              <li><Link href="/blogs" className="hover:text-white transition-colors">Blogs</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-lg font-semibold text-niramayah-green">Legal</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-lg font-semibold text-niramayah-green">Medical Disclaimer</h3>
            <div className="rounded-lg bg-white/10 p-4 border border-niramayah-orange/30">
              <p className="text-xs text-gray-300 leading-relaxed">
                <strong className="text-niramayah-orange block mb-1">IMPORTANT:</strong> 
                This platform is for pre-diagnostic cardiac risk assessment and screening support only. 
                It is <strong className="text-white">NOT</strong> a substitute for professional medical advice, diagnosis, or treatment. 
                If you are experiencing a medical emergency, please seek immediate medical help.
              </p>
            </div>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-white/10 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} NIRAMAYAH. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
