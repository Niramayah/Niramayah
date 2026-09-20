import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PricingPage() {
  const plans = [
    { 
      name: "Free", price: "₹0", period: "forever", credits: "100 credits/mo", 
      features: ["1 AI test = 50 credits", "Basic general health screening", "Digital reports"],
      theme: "white" 
    },
    { 
      name: "Basic", price: "₹249", period: "/month", credits: "500 credits/mo", 
      features: ["1 AI test = 50 credits", "Basic general health screening", "Digital reports", "Priority email support"],
      theme: "green" 
    },
    { 
      name: "Pro", price: "₹799", period: "/month", credits: "1000 credits/mo", 
      features: ["1 AI test = 50 credits", "Up to 5 disease concerns", "Detailed disease analysis", "24/7 Priority support"], 
      recommended: true, 
      theme: "saffron" 
    },
    { 
      name: "Pro Plus", price: "₹4999", period: "/month", credits: "100,000 credits/mo", 
      features: ["Advanced reasoning mode", "For medical professionals", "Unlimited symptom analysis", "Dedicated account manager"],
      theme: "violet" 
    }
  ];

  return (
    <div className="min-h-screen bg-niramayah-navy text-white flex flex-col">
      {/* Return to Dashboard */}
      <div className="container mx-auto px-4 md:px-6 pt-8 pb-4">
        <Link 
          href="/dashboard" 
          className="inline-flex items-center text-sm font-medium text-niramayah-green hover:text-niramayah-green/80 transition-colors"
        >
          ← Return to Dashboard
        </Link>
      </div>

      <div className="flex-1 flex flex-col justify-center py-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center px-4 py-1.5 mb-6 text-sm font-medium text-niramayah-orange bg-niramayah-orange/10 border border-niramayah-orange/20 rounded-full">
              Pricing & Plans
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">
              Simple, Transparent Pricing
            </h1>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Start for free and upgrade as your needs grow. Pay only for what you use.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {plans.map((plan, i) => (
              <div key={i} className="group relative h-full">
                {/* Hover Glow Effect */}
                <div className={`absolute -inset-1 rounded-2xl blur opacity-0 group-hover:opacity-30 transition duration-500
                  ${plan.theme === 'white' ? 'bg-white group-hover:opacity-20' : 
                    plan.theme === 'green' ? 'bg-gradient-to-r from-niramayah-green to-emerald-400' : 
                    plan.theme === 'saffron' ? 'bg-gradient-to-r from-niramayah-orange to-amber-400' : 
                    'bg-gradient-to-r from-violet-600 to-purple-400'}
                `}></div>
                
                <Card 
                  className={`h-full relative flex flex-col bg-niramayah-navy text-white transition-all duration-300 group-hover:-translate-y-2 group-hover:scale-[1.02] group-hover:bg-[#142B4D] border-2 border-slate-700/50
                  ${plan.theme === 'white' ? 'group-hover:border-gray-200' : 
                    plan.theme === 'green' ? 'group-hover:border-emerald-500' : 
                    plan.theme === 'saffron' ? 'group-hover:border-orange-500 shadow-niramayah-orange/10' : 
                    'group-hover:border-purple-500'}
                  `}
                >
                  {plan.recommended && (
                    <div className="absolute top-4 right-4 bg-niramayah-orange text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg z-20">
                      Most Popular
                    </div>
                  )}
                  
                  <CardHeader className="pt-8">
                    <CardTitle className="text-2xl font-serif text-white">{plan.name}</CardTitle>
                    <div className="flex items-baseline mt-4">
                      <span className="text-4xl font-bold text-white">{plan.price}</span>
                      <span className="ml-1 text-sm text-gray-400">{plan.period}</span>
                    </div>
                    <CardDescription className={`mt-2 font-bold uppercase text-[11px] tracking-wider
                      ${plan.theme === 'white' ? 'text-white/70' : 
                        plan.theme === 'green' ? 'text-niramayah-green' : 
                        plan.theme === 'saffron' ? 'text-niramayah-orange' : 
                        'text-violet-400'}
                    `}>
                      {plan.credits}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="flex flex-col flex-1">
                    <ul className="space-y-4 mb-8">
                      {plan.features.map((feature, j) => (
                        <li key={j} className="flex items-start">
                          <CheckCircle2 className={`h-5 w-5 mr-3 flex-shrink-0 
                            ${plan.theme === 'white' ? 'text-white' : 
                              plan.theme === 'green' ? 'text-niramayah-green' : 
                              plan.theme === 'saffron' ? 'text-niramayah-orange' : 
                              'text-violet-400'}
                          `} />
                          <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-auto pt-4">
                      <Link href="/signup" className="block w-full">
                        <Button className={`w-full transition-all duration-300 border
                          ${plan.theme === 'white' ? 'bg-transparent border-white text-white hover:bg-white hover:text-niramayah-navy' : 
                            plan.theme === 'green' ? 'bg-niramayah-green hover:bg-[#00664D] border-transparent text-white shadow-lg' : 
                            plan.theme === 'saffron' ? 'bg-niramayah-orange hover:bg-orange-600 border-transparent text-white shadow-lg' : 
                            'bg-violet-600 hover:bg-violet-700 border-transparent text-white shadow-lg'}
                          `}
                        >
                          Choose Plan
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
