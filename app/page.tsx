"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  HeartPulse, 
  Activity, 
  ShieldCheck, 
  FileText, 
  ArrowRight, 
  CheckCircle2, 
  Mail, 
  Twitter, 
  Info, 
  User,
  Link2 as Linkedin, 
  Link2 as Github 
} from "lucide-react";
import { BlogPreview } from "@/components/blog/BlogPreview";
import { NewsPreview } from "@/components/news/NewsPreview";

export default function Home() {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaders = async () => {
      try {
        const res = await fetch('/api/team');
        const data = await res.json();
        if (data.leaders) {
          let processedLeaders = [...data.leaders];
          
          // Rename 'arnab' to 'Arnab Ghorai'
          processedLeaders = processedLeaders.map((leader: any) => {
            if (leader.name === 'arnab' || leader.name === 'Arnab') {
              return { ...leader, name: 'Arnab Ghorai' };
            }
            return leader;
          });

          // Reorder the cards: Abhirup, Bikram, Arnab, Riya
          const order = ["Abhirup Chattopadhyay", "Bikram Das", "Arnab Ghorai", "Riya Pal"];
          processedLeaders.sort((a: any, b: any) => {
            const posA = order.indexOf(a.name);
            const posB = order.indexOf(b.name);
            return (posA === -1 ? 99 : posA) - (posB === -1 ? 99 : posB);
          });

          setLeaders(processedLeaders);
        }
      } catch (error) {
        console.error("Error fetching leaders:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaders();
  }, []);

  const handleScrollToTech = (e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById('technology');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <>
      <Navbar />
      <main className="flex-1 flex flex-col items-center w-full">
        {/* HERO SECTION */}
        <section id="home" className="w-full bg-niramayah-light py-20 md:py-32">
          <div className="container mx-auto px-4 md:px-6 flex flex-col items-center text-center space-y-8">
            <div className="inline-flex items-center rounded-full border border-niramayah-green/20 bg-niramayah-green/10 px-3 py-1 text-sm text-niramayah-green">
              <span className="flex h-2 w-2 rounded-full bg-niramayah-green mr-2"></span>
              AI-Powered Screening Available
            </div>
            <h1 className="text-4xl md:text-6xl font-serif font-bold text-niramayah-navy max-w-4xl tracking-tight leading-tight">
              NIRAMAYAH &ndash; Precision Cardiac Diagnosis
            </h1>
            <p className="text-lg md:text-xl text-niramayah-gray max-w-2xl">
              Enhancing Cardiac Diagnosis Through Non-Invasive Innovation. Discover your possible heart health risks early with our advanced AI-assisted screening platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/dashboard/ai-test">
                <Button size="lg" className="bg-niramayah-green hover:bg-niramayah-green/90 text-white w-full sm:w-auto text-base h-12 px-8 transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg active:scale-95">
                  Start AI Risk Assessment <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button 
                onClick={handleScrollToTech}
                size="lg" 
                variant="outline" 
                className="border-niramayah-navy text-niramayah-navy hover:bg-niramayah-navy hover:text-white w-full sm:w-auto text-base h-12 px-8 transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg active:scale-95"
              >
                View Technology
              </Button>
            </div>
          </div>
        </section>

        {/* POSTER SHOWCASE SECTION */}
        <section id="technology" className="w-full py-20 bg-white">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col md:flex-row gap-12 items-center">
              <div className="md:w-1/2 space-y-6">
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-niramayah-navy">
                  Revolutionizing Cardiac Care
                </h2>
                <p className="text-lg text-niramayah-gray leading-relaxed">
                  Our state-of-the-art non-invasive technology bridges the gap between symptoms and early intervention. We analyze your health parameters using cutting-edge models to identify potential risks before they become emergencies.
                </p>
                <ul className="space-y-4">
                  {[
                    "No physical procedures required",
                    "Instant screening reports",
                    "Backed by the latest AI health models",
                    "Secure, private, and encrypted"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center text-niramayah-navy">
                      <CheckCircle2 className="h-5 w-5 text-niramayah-green mr-3 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="md:w-1/2 w-full">
                <div className="rounded-2xl overflow-hidden shadow-2xl border border-niramayah-light">
                  <Image 
                    src="/angiography-poster.jpg" 
                    alt="NIRAMAYAH Technology" 
                    width={800} 
                    height={600}
                    className="w-full h-auto object-cover hover:scale-105 transition-transform duration-700"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section className="w-full py-20 bg-niramayah-light">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-niramayah-navy mb-12">
              Why Choose NIRAMAYAH?
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  title: "Non-invasive Innovation",
                  description: "Assess your risk entirely digitally without hospital visits or painful procedures.",
                  icon: Activity
                },
                {
                  title: "AI-Powered Screening",
                  description: "Advanced algorithms trained to identify hidden patterns in your health data.",
                  icon: HeartPulse
                },
                {
                  title: "Risk Assessment Reports",
                  description: "Download detailed PDF reports to share with your healthcare provider.",
                  icon: FileText
                },
                {
                  title: "Secure Health Data",
                  description: "Your data is encrypted and strictly protected under privacy laws.",
                  icon: ShieldCheck
                }
              ].map((feature, i) => (
                <Card key={i} className="border-0 shadow-lg bg-white hover:-translate-y-2 transition-transform duration-300">
                  <CardHeader className="items-center pb-2">
                    <div className="h-16 w-16 rounded-full bg-niramayah-green/10 flex items-center justify-center mb-4">
                      <feature.icon className="h-8 w-8 text-niramayah-green" />
                    </div>
                    <CardTitle className="text-xl text-niramayah-navy font-serif">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-niramayah-gray text-center">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section className="w-full py-24 bg-white overflow-hidden">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-niramayah-navy mb-20">
              How It Works
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
              {/* Connecting Line - made more subtle */}
              <div className="hidden lg:block absolute top-1/3 left-0 right-0 h-0.5 bg-niramayah-green/10 z-0"></div>
              
              {[
                { step: "1", title: "Enter Parameters", desc: "Input your vitals, lifestyle, and symptoms.", theme: "saffron" },
                { step: "2", title: "AI Analysis", desc: "Our engine processes multiple risk indicators.", theme: "gray" },
                { step: "3", title: "Get Report", desc: "Receive your color-coded risk assessment.", theme: "navy" },
                { step: "4", title: "Take Action", desc: "Consult a professional if recommended.", theme: "green" }
              ].map((item, i) => (
                <div key={i} className="group relative z-10 cursor-pointer">
                  {/* Hover Glow Effect */}
                  <div className={`absolute -inset-2 rounded-3xl blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500 
                    ${item.theme === 'saffron' ? 'bg-[#FF8A00]/10' : 
                      item.theme === 'gray' ? 'bg-slate-400/10' : 
                      item.theme === 'navy' ? 'bg-slate-900/10' : 
                      'bg-[#008060]/10'}`}
                  ></div>
                  
                  <div className={`relative bg-white p-8 rounded-2xl border border-gray-100 shadow-sm transition-all duration-300 group-hover:-translate-y-2 group-hover:scale-[1.02] h-full flex flex-col items-center
                    ${item.theme === 'saffron' ? 'group-hover:border-[#FF8A00]/50 group-hover:shadow-[0_0_25px_rgba(255,138,0,0.25)]' : 
                      item.theme === 'gray' ? 'group-hover:border-slate-300 group-hover:shadow-[0_0_25px_rgba(203,213,225,0.6)]' : 
                      item.theme === 'navy' ? 'group-hover:border-[#000080]/50 group-hover:shadow-[0_0_25px_rgba(0,0,128,0.25)]' : 
                      'group-hover:border-[#008060]/50 group-hover:shadow-[0_0_25px_rgba(0,128,96,0.25)]'}
                  `}>
                    <div className={`w-20 h-20 rounded-full bg-white border-4 border-slate-200 text-slate-400 flex items-center justify-center text-3xl font-bold mb-6 shadow-sm group-hover:scale-110 transition-all duration-300
                      ${item.theme === 'saffron' ? 'group-hover:border-[#FF8A00] group-hover:text-[#FF8A00] group-hover:shadow-[0_0_15px_rgba(255,138,0,0.4)]' : 
                        item.theme === 'gray' ? 'group-hover:border-slate-400 group-hover:text-slate-500 group-hover:shadow-[0_0_15px_rgba(203,213,225,0.7)]' : 
                        item.theme === 'navy' ? 'group-hover:border-[#000080] group-hover:text-[#000080] group-hover:shadow-[0_0_15px_rgba(0,0,128,0.4)]' : 
                        'group-hover:border-[#008060] group-hover:text-[#008060] group-hover:shadow-[0_0_15px_rgba(0,128,96,0.4)]'}`}
                    >
                      {item.step}
                    </div>
                    <h3 className="text-xl font-bold text-niramayah-navy mb-3">{item.title}</h3>
                    <p className="text-niramayah-gray leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING SECTION */}
        <section id="pricing" className="w-full py-24 bg-niramayah-navy text-white">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">
                Simple, Transparent Pricing
              </h2>
              <p className="text-gray-300 max-w-2xl mx-auto">
                Start for free and upgrade as your needs grow. Pay only for what you use.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pt-6">
              {[
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
              ].map((plan, i) => (
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
        </section>

        {/* OUR JOURNEY SECTION (ABOUT INJECTION) */}
        <section id="about" className="w-full py-24 bg-white">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
              <div className="max-w-2xl">
                <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6 italic tracking-tight">
                  <span className="text-slate-900">Our</span> <span className="text-niramayah-green">Journey.</span>
                </h2>
                <p className="text-lg text-niramayah-gray leading-relaxed">
                  NIRAMAYAH is a clinical-grade cardiac screening ecosystem born from the fusion of medical research and artificial intelligence. We are dedicated to making professional heart health monitoring accessible to everyone.
                </p>
              </div>
              <Link href="/about">
                <Button variant="outline" className="border-niramayah-navy text-niramayah-navy hover:bg-niramayah-navy hover:text-white rounded-xl h-12 px-8 font-bold">
                  Learn More <Info className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {loading ? (
                Array(4).fill(0).map((_, i) => (
                  <div key={i} className="aspect-square bg-slate-100 rounded-3xl animate-pulse"></div>
                ))
              ) : (
                leaders.map((member, i) => (
                  <motion.div
                    key={member.id || i}
                    initial={{ opacity: 0, x: i < 2 ? -100 : 100 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full"
                  >
                    <Card className="h-full border-slate-200 shadow-sm hover:shadow-xl transition-all duration-500 rounded-3xl overflow-hidden group border bg-white">
                      <CardContent className="p-0 h-full flex flex-col">
                        <div className="aspect-square relative overflow-hidden bg-slate-50 flex items-center justify-center">
                          {member.profileImage ? (
                            <Image 
                              src={member.profileImage} 
                              alt={member.name} 
                              fill 
                              className="object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                          ) : (
                            <div className="flex flex-col items-center text-slate-300">
                              <User className="h-16 w-16 mb-2" />
                              <span className="text-[10px] font-bold uppercase tracking-widest">No Portrait</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-niramayah-navy/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        </div>
                        <div className="p-6 text-center flex-1 flex flex-col justify-center">
                          <h3 className="text-lg font-bold text-niramayah-navy group-hover:text-niramayah-green transition-colors capitalize">{member.name}</h3>
                          <p className="text-[10px] font-black text-niramayah-green uppercase tracking-[0.2em] mt-1">{member.coreRoleTitle || member.role}</p>
                          <div className="flex justify-center gap-4 mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                            <Link href={member.linkedinUrl || "#"}><Linkedin className="h-4 w-4 text-niramayah-navy hover:text-niramayah-green" /></Link>
                            <Link href={member.githubUrl || "#"}><Github className="h-4 w-4 text-niramayah-navy hover:text-niramayah-green" /></Link>
                            <Link href="#"><Mail className="h-4 w-4 text-niramayah-navy hover:text-niramayah-green" /></Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </section>

        <section id="blogs" className="w-full py-20 bg-white">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-niramayah-navy mb-8">
              Latest Health Insights
            </h2>
            <p className="text-niramayah-gray mb-12 max-w-2xl mx-auto">
              Stay updated with the latest research in cardiac health and AI diagnostic innovations.
            </p>
            <BlogPreview />
            <Link href="/blogs">
              <Button variant="outline" className="border-niramayah-navy">View All Blogs</Button>
            </Link>
          </div>
        </section>
        {/* NEWS SECTION PREVIEW */}
        <section id="news" className="w-full py-20 bg-slate-50">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-niramayah-navy mb-8">
              Latest Health News
            </h2>
            <p className="text-niramayah-gray mb-12 max-w-2xl mx-auto">
              Breaking updates and press releases from the Niramayah cardiac research lab.
            </p>
            <NewsPreview />
            <Link href="/news">
              <Button variant="outline" className="border-niramayah-navy">View All News</Button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
