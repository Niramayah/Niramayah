
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PlaceholderPage() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto">
      <div className="inline-flex items-center justify-center px-4 py-1.5 mb-6 text-sm font-medium text-niramayah-orange bg-niramayah-orange/10 border border-niramayah-orange/20 rounded-full">
        Under Development
      </div>
      
      <h1 className="text-4xl md:text-5xl font-serif font-bold text-niramayah-navy mb-4">
        System Audit Logs
      </h1>
      
      <p className="text-lg text-niramayah-gray mb-8">
        Track administrative actions and security events.
      </p>
      
      <div className="p-6 bg-gray-50 border border-gray-100 rounded-xl mb-8 w-full">
        <h3 className="font-semibold text-niramayah-navy mb-2">Coming Soon</h3>
        <p className="text-sm text-niramayah-gray">
          This module is currently being built. Please check back later or contact support if you need immediate assistance.
        </p>
      </div>

      <Link 
        href="/" 
        className="inline-flex items-center text-sm font-medium text-niramayah-green hover:text-niramayah-green/80 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Return to Homepage
      </Link>
    </div>
  );
}
