'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle2, ShieldAlert, FileSearch, HelpCircle, ArrowRight, Home } from 'lucide-react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const submissionId = searchParams.get('id') || 'AUD-20260702-8827';
  const referenceNumber = searchParams.get('ref') || 'REF-389182';

  const nextSteps = [
    {
      title: "Data Logging",
      desc: "Your details have been securely synchronized into our active Google Sheet database."
    },
    {
      title: "Google Drive Storage",
      desc: "Your profile photo, portfolio items, and 500MB audition monologue were uploaded safely to Google Drive folders."
    },
    {
      title: "Casting Review",
      desc: "Our casting directors will review your tape. If shortlisted, you will receive an automated notification via WhatsApp/Email."
    }
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 w-full flex-1 flex flex-col justify-center items-center">
      {/* Circle Icon Checkmark */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="p-5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full mb-6"
      >
        <CheckCircle2 className="w-16 h-16 stroke-[1.5px]" />
      </motion.div>

      {/* Success Title */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="text-center"
      >
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight sm:text-4xl">
          Application Submitted!
        </h1>
        <p className="mt-3 text-muted-foreground max-w-md mx-auto">
          Thank you for applying. Your performer profile and media materials have been successfully uploaded to the audition board.
        </p>
      </motion.div>

      {/* Identifiers Box */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-full mt-8 p-6 rounded-2xl border border-border bg-card/65 text-sm grid grid-cols-1 sm:grid-cols-2 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-border"
      >
        <div className="flex flex-col items-center sm:items-start pb-4 sm:pb-0">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Submission ID</span>
          <span className="text-lg font-bold text-primary mt-1 tracking-wide select-all text-glow">{submissionId}</span>
        </div>
        <div className="flex flex-col items-center sm:items-start pt-4 sm:pt-0 sm:pl-6">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reference Number</span>
          <span className="text-lg font-bold text-foreground mt-1 tracking-wide select-all">{referenceNumber}</span>
        </div>
      </motion.div>

      {/* Checklist next steps */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="w-full mt-10 space-y-5"
      >
        <h3 className="font-bold text-lg text-foreground border-b border-border pb-2.5">What Happens Next?</h3>
        <div className="space-y-4">
          {nextSteps.map((step, idx) => (
            <div key={idx} className="flex gap-4 items-start">
              <span className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                {idx + 1}
              </span>
              <div>
                <h4 className="font-semibold text-sm text-foreground">{step.title}</h4>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mt-12 flex flex-col sm:flex-row gap-4 w-full"
      >
        <Link 
          href="/" 
          className="flex-1 px-6 py-4 border border-border bg-card/65 hover:bg-muted text-foreground font-semibold rounded-xl text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
        >
          <Home className="w-4 h-4" />
          <span>Return Home</span>
        </Link>
        <Link 
          href="/apply" 
          className="flex-1 px-6 py-4 bg-primary text-primary-foreground font-bold rounded-xl text-sm flex items-center justify-center gap-2 cursor-pointer hover:opacity-95 shadow-md shadow-primary/10 transition-opacity"
        >
          <span>Submit Another</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </motion.div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}

function Loader2(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
