const fs = require('fs');
const path = require('path');

const publicPages = [
  { path: 'app/about', title: 'About NIRAMAYAH', desc: 'Learn about our mission to democratize early cardiac risk detection.' },
  { path: 'app/technology', title: 'Our Technology', desc: 'Discover how our AI and medical algorithms power the platform.' },
  { path: 'app/pricing', title: 'Pricing & Plans', desc: 'Flexible plans for individuals and families.' },
  { path: 'app/blogs', title: 'Health Blog', desc: 'Insights and news on cardiac health and lifestyle.' },
  { path: 'app/contact', title: 'Contact Us', desc: 'Get in touch with our support and medical liaison teams.' },
  { path: 'app/disclaimer', title: 'Medical Disclaimer', desc: 'Important information regarding the limitations of our AI pre-screening.' },
  { path: 'app/privacy', title: 'Privacy Policy', desc: 'How we protect your sensitive health data.' },
  { path: 'app/terms', title: 'Terms of Service', desc: 'Terms and conditions for using the NIRAMAYAH platform.' }
];

const dashboardPages = [
  { path: 'app/dashboard/history', title: 'Assessment History', desc: 'Review your past cardiac risk assessments.' },
  { path: 'app/dashboard/subscription', title: 'Manage Subscription', desc: 'View or upgrade your current plan.' },
  { path: 'app/dashboard/support', title: 'Support Tickets', desc: 'Get help from our medical moderation team.' },
  { path: 'app/dashboard/profile', title: 'My Profile', desc: 'Manage your personal and medical information.' }
];

const adminPages = [
  { path: 'app/admin/users', title: 'User Management', desc: 'Manage registered users and their roles.' },
  { path: 'app/admin/roles', title: 'Role Based Access Control', desc: 'Configure permissions for admins and moderators.' },
  { path: 'app/admin/blogs', title: 'Blog Management', desc: 'Create and edit blog posts and news.' },
  { path: 'app/admin/news', title: 'News Announcements', desc: 'Broadcast platform updates to users.' },
  { path: 'app/admin/ai', title: 'AI Configuration', desc: 'Manage Ollama/OpenAI API settings and rule overrides.' },
  { path: 'app/admin/pricing', title: 'Pricing Plans', desc: 'Configure Stripe/Razorpay subscription tiers.' },
  { path: 'app/admin/payments', title: 'Payment History', desc: 'View transaction logs and invoices.' },
  { path: 'app/admin/audit-logs', title: 'System Audit Logs', desc: 'Track administrative actions and security events.' }
];

const moderatorPages = [
  { path: 'app/moderator', title: 'Moderator Dashboard', desc: 'Overview of pending support requests.' },
  { path: 'app/moderator/blogs', title: 'Blog Moderation', desc: 'Review submitted articles.' },
  { path: 'app/moderator/comments', title: 'Comment Moderation', desc: 'Review user comments for guidelines compliance.' },
  { path: 'app/moderator/tickets', title: 'Support Tickets', desc: 'Handle user inquiries and medical escalations.' },
  { path: 'app/moderator/tokens', title: 'Token Management', desc: 'Manage support token allocations.' }
];

const allPages = [...publicPages, ...dashboardPages, ...adminPages, ...moderatorPages];

const placeholderTemplate = (title, desc) => `
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PlaceholderPage() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto">
      <div className="inline-flex items-center justify-center px-4 py-1.5 mb-6 text-sm font-medium text-niramayah-orange bg-niramayah-orange/10 border border-niramayah-orange/20 rounded-full">
        Under Development
      </div>
      
      <h1 className="text-4xl md:text-5xl font-serif font-bold text-niramayah-navy mb-4">
        ${title}
      </h1>
      
      <p className="text-lg text-niramayah-gray mb-8">
        ${desc}
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
`;

allPages.forEach(page => {
  const fullPath = path.join(__dirname, page.path, 'page.tsx');
  fs.writeFileSync(fullPath, placeholderTemplate(page.title, page.desc));
});

console.log('Created all placeholder pages successfully.');
