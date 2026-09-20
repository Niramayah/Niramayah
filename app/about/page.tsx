"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Mail, Ghost, Edit2, Info, Link2 as Linkedin, Link2 as Github } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthContext";

export default function AboutPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isAdmin = user?.role === 'ADMIN' || isSuperAdmin;
  
  const [team, setTeam] = useState<{ leaders: any[], active: any[], ghosts: any[] }>({
    leaders: [],
    active: [],
    ghosts: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const res = await fetch('/api/team');
        const data = await res.json();
        if (data.leaders) {
          setTeam(data);
        }
      } catch (error) {
        console.error("Error fetching team:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTeam();
  }, []);

  return (
    <div className="min-h-screen bg-white text-niramayah-navy flex flex-col">
      <Navbar />
      <main className="flex-1 pt-32 pb-24">
        {/* Back Button */}
        <div className="container mx-auto px-4 md:px-6 mb-8">
          <Link href="/">
            <Button variant="ghost" className="text-slate-500 hover:text-niramayah-green p-0 h-auto flex items-center gap-2 group transition-colors">
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Back to Home</span>
            </Button>
          </Link>
        </div>

        {/* Hero Section */}
        <div className="container mx-auto px-4 md:px-6 mb-24">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-6">
              <h1 className="text-5xl md:text-7xl font-serif font-bold tracking-tight italic">
                <span className="text-slate-900">Our</span> <span className="text-niramayah-green">Journey.</span>
              </h1>
              {isAdmin && (
                <Link href="/admin/about/general">
                  <Button variant="ghost" size="icon" className="text-slate-300 hover:text-niramayah-green">
                    <Edit2 className="h-5 w-5" />
                  </Button>
                </Link>
              )}
            </div>
            <p className="text-xl text-niramayah-gray leading-relaxed font-medium">
              NIRAMAYAH was born from a simple yet powerful goal: to make cardiac screening accessible, non-invasive, and intelligent. What started as a research project is now a growing ecosystem dedicated to saving lives through early detection.
            </p>
          </div>
        </div>

        {/* Section 1: The Founding Four */}
        <section className="container mx-auto px-4 md:px-6 mb-32">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-4">
              <div className="h-1 w-12 bg-niramayah-green rounded-full"></div>
              <h2 className="text-3xl font-serif font-bold tracking-tight">The Founding Four</h2>
            </div>
            {isSuperAdmin && (
              <Link href="/admin/about/leaders">
                <Button variant="outline" className="border-niramayah-green text-niramayah-green hover:bg-niramayah-green hover:text-white rounded-xl font-bold">
                  Manage Leaders <Edit2 className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {loading ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="aspect-square bg-slate-100 rounded-[2rem] animate-pulse"></div>
              ))
            ) : (
              team.leaders.map((member) => (
                <Card key={member.id} className="bg-white border-slate-200 border overflow-hidden group hover:border-niramayah-green transition-all duration-500 rounded-[2rem] shadow-sm hover:shadow-xl">
                  <CardContent className="p-0">
                    <div className="aspect-square relative overflow-hidden">
                      <Image 
                        src={member.profileImage || "/placeholder-avatar.jpg"} 
                        alt={member.name} 
                        fill 
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      {isSuperAdmin && (
                        <div className="absolute top-4 right-4 z-20">
                          <Link href={`/admin/about/edit/${member.id}`}>
                            <Button size="icon" variant="secondary" className="rounded-full bg-white/90 backdrop-blur shadow-lg h-10 w-10 text-niramayah-navy hover:text-niramayah-green">
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                    <div className="p-8 space-y-4">
                      <div>
                        <h3 className="text-xl font-bold text-niramayah-navy group-hover:text-niramayah-green transition-colors">{member.name}</h3>
                        <p className="text-xs font-black text-niramayah-green uppercase tracking-[0.2em] mt-1">{member.coreRoleTitle || member.role}</p>
                      </div>
                      <p className="text-sm text-niramayah-gray leading-relaxed line-clamp-3">
                        {member.bio || "Leading the NIRAMAYAH vision into the future of clinical AI."}
                      </p>
                      <div className="flex items-center gap-4 pt-2">
                        <Link href={member.linkedinUrl || "#"}><Linkedin className="h-4 w-4 text-slate-400 hover:text-niramayah-green cursor-pointer transition-colors" /></Link>
                        <Link href={member.githubUrl || "#"}><Github className="h-4 w-4 text-slate-400 hover:text-niramayah-green cursor-pointer transition-colors" /></Link>
                        <Link href="#"><Mail className="h-4 w-4 text-slate-400 hover:text-niramayah-green cursor-pointer transition-colors" /></Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </section>

        {/* Section 2: Active Members */}
        {team.active.length > 0 && (
          <section className="container mx-auto px-4 md:px-6 mb-32">
            <div className="flex items-center gap-4 mb-12">
              <div className="h-1 w-12 bg-slate-200 rounded-full"></div>
              <h2 className="text-3xl font-serif font-bold tracking-tight text-slate-800">Active Team</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {team.active.map((member) => (
                <Card key={member.id} className="bg-white border-slate-200 border overflow-hidden rounded-[2rem] group hover:border-slate-400 transition-colors shadow-sm">
                  <CardContent className="p-0">
                    <div className="aspect-square relative overflow-hidden">
                      <Image 
                        src={member.profileImage || "/placeholder-avatar.jpg"} 
                        alt={member.name} 
                        fill 
                        className="object-cover"
                      />
                    </div>
                    <div className="p-8">
                      <h3 className="text-xl font-bold text-niramayah-navy">{member.name}</h3>
                      <p className="text-xs font-black text-niramayah-green uppercase tracking-[0.2em] mt-1">{member.coreRoleTitle || member.role}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Section 3: The Hall of Respect (Ghosts) */}
        {team.ghosts.length > 0 && (
          <section className="container mx-auto px-4 md:px-6 mb-32 bg-slate-50 py-24 rounded-[3rem]">
            <div className="flex flex-col items-center text-center mb-16">
              <Ghost className="h-12 w-12 text-slate-300 mb-4" />
              <h2 className="text-4xl font-serif font-black tracking-tighter italic text-slate-400">The Hall of Respect</h2>
              <p className="text-slate-500 max-w-xl mt-4 italic">Honoring those who contributed their vision and effort to NIRAMAYAH before moving on to new chapters.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-700 px-8">
              {team.ghosts.map((member) => (
                <div key={member.id} className="flex flex-col items-center text-center space-y-4">
                  <div className="aspect-square w-full relative rounded-full overflow-hidden border-2 border-white shadow-xl bg-white">
                    <Image 
                      src={member.profileImage || "/placeholder-avatar.jpg"} 
                      alt={member.name} 
                      fill 
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-600">{member.name}</h3>
                    <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">{member.coreRoleTitle || "Past Contributor"}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Mission Statement Banner */}
        <section className="container mx-auto px-4 md:px-6">
          <div className="bg-niramayah-navy rounded-[3rem] p-12 relative overflow-hidden group shadow-2xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-niramayah-green/10 rounded-full blur-[120px] transition-all group-hover:bg-niramayah-green/20"></div>
            <div className="relative z-10 max-w-2xl">
              <h3 className="text-3xl font-serif font-bold mb-6 italic text-white">Engineering a Healthier Future.</h3>
              <p className="text-slate-300 leading-relaxed mb-8 text-lg">
                We believe that technology should be empathetic. At NIRAMAYAH, every line of code and every AI model is designed with the patient in mind, ensuring that professional cardiac monitoring is no longer a luxury, but a standard of care for everyone.
              </p>
              <Link href="/dashboard/ai-test">
                <Button className="bg-niramayah-green hover:bg-niramayah-green/90 text-white font-black rounded-xl h-12 px-8 uppercase tracking-widest text-xs transition-all hover:scale-105 shadow-lg">
                  Experience Our Tech <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
