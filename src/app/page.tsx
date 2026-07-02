'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  MapPin, 
  DollarSign, 
  Clock, 
  ChevronDown, 
  FileText, 
  Video, 
  Camera, 
  Award, 
  ArrowRight,
  ShieldCheck,
  Film,
  Users
} from 'lucide-react';

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const auditionDetails = [
    { icon: Calendar, label: "Audition Date", val: "July 5, 2026" },
    { icon: MapPin, label: "Venue Location", val: "Kerala Hut, Luton, UK" },
    { icon: Clock, label: "Audition Time", val: "10:00 AM - 5:00 PM BST" },
    { icon: Award, label: "Shoot Timeline", val: "September 2026 (UK)" },
    { icon: Film, label: "DOP / Cinematographer", val: "Shiju M. Bhasker" },
    { icon: Users, label: "Casting Director", val: "Sharan S S" },
  ];

  const requirements = [
    { 
      icon: Camera, 
      title: "Profile & Portfolio Photos", 
      desc: "1 main headshot and up to 5 portfolio/lifestyle shots showing range (Under 10MB each)." 
    },
    { 
      icon: Video, 
      title: "Audition Monologue", 
      desc: "2-minute monologue video (MP4, MOV, or AVI). Max size limit is 500MB." 
    },
    { 
      icon: FileText, 
      title: "Resume / CV (PDF)", 
      desc: "Highly recommended. Detail any acting, theater, or modeling experience." 
    },
    { 
      icon: Award, 
      title: "Target Roles", 
      desc: "Heroines (18-25y), College Students (18-25y), Professionals (25-45y), Parents (35-60y)." 
    },
  ];

  const faqs = [
    {
      q: "Where is the Walk-In audition located?",
      a: "Walk-in auditions will be held at Kerala Hut, 1 George St., Luton LU1 2AA, United Kingdom on July 5, 2026, from 10:00 AM to 5:00 PM."
    },
    {
      q: "What roles are you currently casting for?",
      a: "We are casting for: 1) Heroine roles (Ages 18-25), 2) College students (Ages 18-25), 3) Office staff & professionals (Ages 25-45), and 4) Father & Mother roles (Ages 35-60)."
    },
    {
      q: "Who is the creative team behind Mini & Cooper?",
      a: "Mini & Cooper is an upcoming feature film presented by producer Rold Thomas and directed by Jomy Kuriakose, with cinematography (DOP) by Shiju M. Bhasker and casting directed by Sharan S S."
    },
    {
      q: "How large can my video file be for online submission?",
      a: "Our portal supports direct browser uploads up to 500MB in size. We support MP4, MOV, and AVI formats."
    },
    {
      q: "How can I contact AWA Movies directly?",
      a: "You can reach us at awamovies.uk@gmail.com or contact the casting hotline via Phone/WhatsApp at +44 7597 311388."
    }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. Hero Section */}
      <section className="relative h-[85vh] min-h-[600px] flex items-center justify-center overflow-hidden">
        {/* Background Image with Dark Overlays */}
        <div className="absolute inset-0 z-0">
          <Image 
            src="/images/hero_stage_bg.png" 
            alt="Audition Portal Stage Spotlight" 
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-black/55" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 mx-auto max-w-5xl px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-6 backdrop-blur-sm"
          >
            <Award className="w-3.5 h-3.5" />
            <span>AWA MOVIES Presents</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight"
          >
            Walk-In Audition: <span className="text-primary bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Mini & Cooper</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-6 text-lg sm:text-xl text-slate-200 max-w-2xl mx-auto leading-relaxed"
          >
            Submit your portfolio, acting resume, and video monologue directly to our casting board for the upcoming feature film starring <strong>Dhyan Sreenivasan</strong>. Directed by <strong>Jomy Kuriakose</strong>.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link 
              href="/apply" 
              className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold bg-primary text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>Register for Audition</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <a 
              href="#details" 
              className="w-full sm:w-auto px-8 py-4 rounded-xl font-semibold border border-white/20 bg-white/5 text-white hover:bg-white/10 transition-colors backdrop-blur-sm flex items-center justify-center"
            >
              Requirements & Info
            </a>
          </motion.div>
        </div>
      </section>

      {/* 2. Audition Details & Deadline Banner */}
      <section id="details" className="py-20 bg-background/50 relative z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
            
            {/* Audition Details Grid */}
            <div className="lg:col-span-2 space-y-8">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground">
                  Production Information
                </h2>
                <p className="mt-2 text-muted-foreground">
                  Verify the cast and crew parameters below. Ensure your schedule accommodates the principal photography start date in the UK.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {auditionDetails.map((detail, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                    className="p-5 rounded-2xl glassmorphism flex gap-4 items-start"
                  >
                    <div className="p-3 rounded-xl bg-primary/10 text-primary">
                      <detail.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{detail.label}</p>
                      <h4 className="font-semibold text-lg text-foreground mt-1">{detail.val}</h4>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Deadline Sidebar Banner */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="p-6 rounded-3xl bg-gradient-to-br from-indigo-950 to-slate-950 border border-primary/20 text-white shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[300px]"
            >
              <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-primary/20 rounded-full blur-3xl" />
              <div>
                <span className="px-3 py-1 rounded-full bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 mb-4">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  Audition Event
                </span>
                <h3 className="text-2xl font-bold">July 5, 2026</h3>
                <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                  Walk-in auditions will occur at Kerala Hut, Luton from 10:00 AM to 5:00 PM. Please register online beforehand to streamline the check-in process.
                </p>
              </div>
              <div className="mt-6 border-t border-white/10 pt-4 flex items-center gap-2.5 text-xs text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Verified AWA Movies Casting Portal</span>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* 3. Requirements Section */}
      <section className="py-20 bg-card/25 border-y border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Submission Requirements</h2>
            <p className="mt-4 text-muted-foreground">
              Please prepare the following items to complete your audition form. Direct uploads are securely saved in our Google Drive folders.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {requirements.map((req, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="p-6 rounded-2xl bg-card border border-border flex flex-col items-center text-center hover:border-primary/50 transition-colors shadow-sm"
              >
                <div className="p-4 rounded-full bg-secondary/10 text-secondary mb-4">
                  <req.icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-lg text-foreground">{req.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{req.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. FAQ Section */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Frequently Asked Questions</h2>
            <p className="mt-2 text-muted-foreground">Everything you need to know about the audition submission process.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div 
                key={idx} 
                className="border border-border rounded-xl bg-card overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left font-semibold text-foreground hover:bg-muted/50 cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${
                    openFaq === idx ? 'rotate-180' : ''
                  }`} />
                </button>
                <motion.div
                  initial={false}
                  animate={{ height: openFaq === idx ? 'auto' : 0, opacity: openFaq === idx ? 1 : 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border/50 pt-4">
                    {faq.a}
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Bottom CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary/10 to-secondary/10 border-t border-border">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Ready to Take the Spotlight?</h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Our audition submissions are fully digitized. Prepare your photos, resume, and video, and start your journey today.
          </p>
          <div className="mt-8 flex justify-center">
            <Link 
              href="/apply" 
              className="px-10 py-5 rounded-2xl font-bold bg-primary text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/20 transition-all inline-flex items-center gap-2 group cursor-pointer"
            >
              <span>Launch Audition Form</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
