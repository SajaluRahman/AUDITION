'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { auditionSchema, AuditionInput } from '@/lib/validation-schema';
import { useToast } from '@/components/Providers';
import { 
  User, 
  Phone, 
  MapPin, 
  Video, 
  Camera, 
  FileText, 
  ArrowLeft, 
  ArrowRight, 
  Upload, 
  Check, 
  X, 
  Loader2 
} from 'lucide-react';

const STEPS = [
  { id: 1, title: 'Personal Info', icon: User },
  { id: 2, title: 'Contact & Address', icon: Phone },
  { id: 3, title: 'Talent & Socials', icon: MapPin },
  { id: 4, title: 'Upload Media', icon: Video },
];

export default function ApplyPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Individual file upload states (progress percent and status)
  const [uploads, setUploads] = useState<Record<string, { progress: number; status: 'idle' | 'uploading' | 'success' | 'error'; url?: string; name?: string }>>({
    profilePhoto: { progress: 0, status: 'idle' },
    resume: { progress: 0, status: 'idle' },
    video: { progress: 0, status: 'idle' },
  });

  // Portfolio list upload state
  const [portfolioList, setPortfolioList] = useState<{ id: string; name: string; progress: number; status: 'uploading' | 'success' | 'error'; url?: string }[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<AuditionInput>({
    resolver: zodResolver(auditionSchema) as any,
    mode: 'onTouched',
    defaultValues: {
      firstName: '',
      lastName: '',
      gender: '',
      dob: '',
      phone: '',
      whatsApp: '',
      email: '',
      address: '',
      city: '',
      state: '',
      country: '',
      height: '',
      weight: '',
      instagram: '',
      facebook: '',
      youtube: '',
      occupation: '',
      experience: '',
      languages: '',
      talentCategory: '',
      bio: '',
      reason: '',
      profilePhotoUrl: '',
      portfolioUrls: '',
      resumeUrl: '',
      videoUrl: '',
    }
  });

  // Watch field values for dynamic checks (like showing term agreement status)
  const watchedTerms = watch('termsAccepted');
  const profilePhotoUrl = watch('profilePhotoUrl');
  const portfolioUrls = watch('portfolioUrls');
  const resumeUrl = watch('resumeUrl');
  const videoUrl = watch('videoUrl');

  // Handle standard small file uploads (Photos, Resume) via /api/upload
  const handleSmallFileUpload = async (file: File, key: string, folderName: string) => {
    try {
      setUploads((prev) => ({ ...prev, [key]: { progress: 10, status: 'uploading', name: file.name } }));

      const formData = new FormData();
      formData.append('file', file);
      formData.append('folderName', folderName);

      // We use XMLHttpRequest so we can capture upload progress event
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/upload', true);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploads((prev) => ({ ...prev, [key]: { ...prev[key], progress: Math.min(percent, 95) } }));
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          const res = JSON.parse(xhr.responseText);
          if (res.success) {
            setUploads((prev) => ({ ...prev, [key]: { progress: 100, status: 'success', url: res.url, name: file.name } }));
            setValue(key + 'Url' as any, res.url, { shouldValidate: true });
            toast({ type: 'success', title: 'File uploaded successfully', description: file.name });
          } else {
            throw new Error(res.error || 'Server rejected file');
          }
        } else {
          throw new Error('Upload failed with status ' + xhr.status);
        }
      };

      xhr.onerror = () => {
        throw new Error('Network error during upload');
      };

      xhr.send(formData);

    } catch (err: any) {
      console.error(err);
      setUploads((prev) => ({ ...prev, [key]: { progress: 0, status: 'error', name: file.name } }));
      toast({ type: 'error', title: 'Upload failed', description: err.message || 'Please try again.' });
    }
  };

  // Handle multiple portfolio photo uploads (limit to max 5)
  const handlePortfolioUpload = async (file: File) => {
    if (portfolioList.length >= 5) {
      toast({ type: 'warning', title: 'Portfolio limit reached', description: 'You can upload a maximum of 5 portfolio photos.' });
      return;
    }

    const fileId = Math.random().toString(36).substring(2, 9);
    const newUpload = { id: fileId, name: file.name, progress: 10, status: 'uploading' as const };
    
    // Add item to local checklist
    setPortfolioList((prev) => [...prev, newUpload]);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folderName', 'Portfolio');

      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/upload', true);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setPortfolioList((prev) =>
            prev.map((item) => (item.id === fileId ? { ...item, progress: Math.min(percent, 95) } : item))
          );
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          const res = JSON.parse(xhr.responseText);
          if (res.success) {
            setPortfolioList((prev) => {
              const updated = prev.map((item) => (item.id === fileId ? { ...item, progress: 100, status: 'success' as const, url: res.url } : item));
              // Update form state with new list of comma-separated URLs
              const urls = updated.filter((item) => item.status === 'success' && item.url).map((item) => item.url).join(',');
              setValue('portfolioUrls', urls, { shouldValidate: true });
              return updated;
            });
            toast({ type: 'success', title: 'Portfolio image uploaded', description: file.name });
          } else {
            throw new Error(res.error || 'Server rejected file');
          }
        } else {
          throw new Error('Upload failed');
        }
      };

      xhr.onerror = () => {
        throw new Error('Network error');
      };

      xhr.send(formData);

    } catch (err: any) {
      setPortfolioList((prev) =>
        prev.map((item) => (item.id === fileId ? { ...item, progress: 0, status: 'error' as const } : item))
      );
      toast({ type: 'error', title: 'Portfolio upload failed', description: err.message || 'Error uploading file' });
    }
  };

  const removePortfolioItem = (id: string) => {
    setPortfolioList((prev) => {
      const filtered = prev.filter((item) => item.id !== id);
      const urls = filtered.filter((item) => item.status === 'success' && item.url).map((item) => item.url).join(',');
      setValue('portfolioUrls', urls, { shouldValidate: true });
      return filtered;
    });
  };

  // Handle large video file upload up to 500MB via Drive Resumable Upload
  const handleVideoUpload = async (file: File) => {
    try {
      setUploads((prev) => ({ ...prev, video: { progress: 5, status: 'uploading', name: file.name } }));

      // Step 1: Initiate session with Server API to retrieve Resumable Upload URL
      const sessionResponse = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resumable',
          fileName: file.name,
          mimeType: file.type,
          folderName: 'Videos',
        }),
      });

      if (!sessionResponse.ok) {
        const errJson = await sessionResponse.json();
        throw new Error(errJson.error || 'Failed to initiate resumable upload session');
      }

      const sessionData = await sessionResponse.json();
      const { uploadUrl } = sessionData;

      if (!uploadUrl) {
        throw new Error('Upload session URL not returned by server.');
      }

      // Step 2: Perform direct chunked binary PUT upload from browser to Google Drive
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl, true);
      xhr.setRequestHeader('Content-Type', file.type);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploads((prev) => ({ ...prev, video: { ...prev.video, progress: percent } }));
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200 || xhr.status === 201) {
          const res = JSON.parse(xhr.responseText);
          const fileId = res.id;
          // Construct public access URL
          const publicUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;

          setUploads((prev) => ({ ...prev, video: { progress: 100, status: 'success', url: publicUrl, name: file.name } }));
          setValue('videoUrl', publicUrl, { shouldValidate: true });
          toast({ type: 'success', title: 'Audition video uploaded', description: file.name });
        } else {
          throw new Error(`Upload failed with status ${xhr.status}`);
        }
      };

      xhr.onerror = () => {
        throw new Error('Network error uploading video directly to Drive');
      };

      xhr.send(file);

    } catch (error: any) {
      console.error('Video Upload Error:', error);
      setUploads((prev) => ({ ...prev, video: { progress: 0, status: 'error', name: file.name } }));
      toast({ type: 'error', title: 'Video upload failed', description: error.message || 'Error occurred.' });
    }
  };

  // Helper validation for file drops/inputs
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    if (key === 'profilePhoto') {
      if (!file.type.startsWith('image/')) {
        toast({ type: 'error', title: 'Invalid file type', description: 'Please select an image file.' });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({ type: 'error', title: 'File too large', description: 'Profile photo must be less than 10MB.' });
        return;
      }
      handleSmallFileUpload(file, 'profilePhoto', 'Photos');
    } else if (key === 'resume') {
      if (file.type !== 'application/pdf') {
        toast({ type: 'error', title: 'Invalid file type', description: 'Please select a PDF document.' });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({ type: 'error', title: 'File too large', description: 'Resume PDF must be less than 10MB.' });
        return;
      }
      handleSmallFileUpload(file, 'resume', 'Resume');
    } else if (key === 'portfolio') {
      if (!file.type.startsWith('image/')) {
        toast({ type: 'error', title: 'Invalid file type', description: 'Please select an image file.' });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({ type: 'error', title: 'File too large', description: 'Portfolio images must be less than 10MB.' });
        return;
      }
      handlePortfolioUpload(file);
    } else if (key === 'video') {
      const allowedExts = ['video/mp4', 'video/quicktime', 'video/x-msvideo']; // mp4, mov, avi
      if (!allowedExts.includes(file.type) && !file.name.match(/\.(mp4|mov|avi)$/i)) {
        toast({ type: 'error', title: 'Invalid video format', description: 'Only MP4, MOV, and AVI formats are allowed.' });
        return;
      }
      if (file.size > 500 * 1024 * 1024) {
        toast({ type: 'error', title: 'Video too large', description: 'Audition video must be less than 500MB.' });
        return;
      }
      handleVideoUpload(file);
    }
  };

  // Move between form steps with field validation check
  const nextStep = async () => {
    let fieldsToValidate: any[] = [];
    if (currentStep === 1) {
      fieldsToValidate = ['firstName', 'lastName', 'age', 'gender', 'dob'];
    } else if (currentStep === 2) {
      fieldsToValidate = ['phone', 'whatsApp', 'email', 'address', 'city', 'state', 'country'];
    } else if (currentStep === 3) {
      fieldsToValidate = ['height', 'weight', 'occupation', 'experience', 'languages', 'talentCategory'];
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    } else {
      toast({ type: 'warning', title: 'Incomplete Fields', description: 'Please check and fill required fields correctly.' });
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Submit final payload to API
  const onSubmit = async (data: AuditionInput) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const res = await response.json();
      if (res.success) {
        toast({ type: 'success', title: 'Application Submitted', description: 'Your application has been received!' });
        router.push(`/success?id=${res.submissionId}&ref=${res.referenceNumber}`);
      } else {
        throw new Error(res.error || 'Server error saving submission');
      }
    } catch (error: any) {
      console.error(error);
      toast({ type: 'error', title: 'Submission failed', description: error.message || 'Check connection and try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 w-full flex-1 flex flex-col justify-center">
      {/* Page Title */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight sm:text-4xl">Audition Application</h1>
        <p className="mt-2 text-muted-foreground">Apply for "The Final Act". Fill out all steps thoroughly.</p>
      </div>

      {/* Step Indicators */}
      <div className="mb-10 px-2">
        <div className="flex justify-between items-center relative">
          <div className="absolute left-0 right-0 h-0.5 bg-border top-1/2 -translate-y-1/2 z-0" />
          <div 
            className="absolute left-0 h-0.5 bg-primary top-1/2 -translate-y-1/2 z-0 transition-all duration-300"
            style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
          />
          {STEPS.map((step) => {
            const Icon = step.icon;
            const isCompleted = currentStep > step.id;
            const isActive = currentStep === step.id;

            return (
              <div key={step.id} className="relative z-10 flex flex-col items-center">
                <button
                  type="button"
                  onClick={async () => {
                    // Prevent skip forward without validating
                    if (step.id < currentStep) {
                      setCurrentStep(step.id);
                    } else if (step.id > currentStep) {
                      let valid = true;
                      for (let i = currentStep; i < step.id; i++) {
                        let fields: any[] = [];
                        if (i === 1) fields = ['firstName', 'lastName', 'age', 'gender', 'dob'];
                        if (i === 2) fields = ['phone', 'whatsApp', 'email', 'address', 'city', 'state', 'country'];
                        if (i === 3) fields = ['height', 'weight', 'occupation', 'experience', 'languages', 'talentCategory'];
                        const ok = await trigger(fields);
                        if (!ok) valid = false;
                      }
                      if (valid) setCurrentStep(step.id);
                    }
                  }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all cursor-pointer ${
                    isCompleted 
                      ? 'bg-primary border-primary text-primary-foreground' 
                      : isActive 
                        ? 'bg-background border-primary text-primary scale-110 shadow-md ring-4 ring-primary/10' 
                        : 'bg-card border-border text-muted-foreground'
                  }`}
                >
                  {isCompleted ? <Check className="w-5 h-5 stroke-[3px]" /> : <Icon className="w-5 h-5" />}
                </button>
                <span className={`text-xs font-semibold mt-2 hidden sm:block ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Wizard Form Card */}
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 sm:p-8 rounded-3xl border border-border bg-card shadow-lg flex-1 flex flex-col justify-between min-h-[450px]">
        <AnimatePresence mode="wait">
          {/* STEP 1: PERSONAL INFO */}
          {currentStep === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <h3 className="text-xl font-bold text-foreground">Step 1: Personal Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">First Name *</label>
                  <input
                    type="text"
                    {...register('firstName')}
                    placeholder="Enter first name"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all"
                  />
                  {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Last Name *</label>
                  <input
                    type="text"
                    {...register('lastName')}
                    placeholder="Enter last name"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all"
                  />
                  {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Age *</label>
                  <input
                    type="number"
                    {...register('age')}
                    placeholder="Enter age"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all"
                  />
                  {errors.age && <p className="text-xs text-red-500 mt-1">{errors.age.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Gender *</label>
                  <select
                    {...register('gender')}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-Binary">Non-Binary</option>
                    <option value="Prefer Not to Say">Prefer Not to Say</option>
                  </select>
                  {errors.gender && <p className="text-xs text-red-500 mt-1">{errors.gender.message}</p>}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Date of Birth *</label>
                  <input
                    type="date"
                    {...register('dob')}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all cursor-pointer"
                  />
                  {errors.dob && <p className="text-xs text-red-500 mt-1">{errors.dob.message}</p>}
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: CONTACT & ADDRESS */}
          {currentStep === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <h3 className="text-xl font-bold text-foreground">Step 2: Contact Information & Address</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Phone Number *</label>
                  <input
                    type="tel"
                    {...register('phone')}
                    placeholder="+1 555-019-2834"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all"
                  />
                  {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">WhatsApp Number *</label>
                  <input
                    type="tel"
                    {...register('whatsApp')}
                    placeholder="+1 555-019-2834"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all"
                  />
                  {errors.whatsApp && <p className="text-xs text-red-500 mt-1">{errors.whatsApp.message}</p>}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Email Address *</label>
                  <input
                    type="email"
                    {...register('email')}
                    placeholder="actor@example.com"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all"
                  />
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Address *</label>
                  <input
                    type="text"
                    {...register('address')}
                    placeholder="Enter street address"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all"
                  />
                  {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">City *</label>
                  <input
                    type="text"
                    {...register('city')}
                    placeholder="Enter city"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all"
                  />
                  {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">State *</label>
                  <input
                    type="text"
                    {...register('state')}
                    placeholder="Enter state"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all"
                  />
                  {errors.state && <p className="text-xs text-red-500 mt-1">{errors.state.message}</p>}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Country *</label>
                  <input
                    type="text"
                    {...register('country')}
                    placeholder="Enter country"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all"
                  />
                  {errors.country && <p className="text-xs text-red-500 mt-1">{errors.country.message}</p>}
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: TALENT DETAILS & SOCIALS */}
          {currentStep === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <h3 className="text-xl font-bold text-foreground">Step 3: Performance Profile & Socials</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Height *</label>
                  <input
                    type="text"
                    {...register('height')}
                    placeholder="e.g. 5ft 11in or 180cm"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all"
                  />
                  {errors.height && <p className="text-xs text-red-500 mt-1">{errors.height.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Weight *</label>
                  <input
                    type="text"
                    {...register('weight')}
                    placeholder="e.g. 75kg or 165lbs"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all"
                  />
                  {errors.weight && <p className="text-xs text-red-500 mt-1">{errors.weight.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Occupation *</label>
                  <input
                    type="text"
                    {...register('occupation')}
                    placeholder="e.g. Student, Full-time Actor"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all"
                  />
                  {errors.occupation && <p className="text-xs text-red-500 mt-1">{errors.occupation.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Talent Category *</label>
                  <select
                    {...register('talentCategory')}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Select Talent Category</option>
                    <option value="Acting (Film/TV)">Acting (Film/TV)</option>
                    <option value="Theater Performance">Theater Performance</option>
                    <option value="Modeling">Modeling</option>
                    <option value="Dancing">Dancing</option>
                    <option value="Singing/Music">Singing/Music</option>
                  </select>
                  {errors.talentCategory && <p className="text-xs text-red-500 mt-1">{errors.talentCategory.message}</p>}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Acting Experience *</label>
                  <textarea
                    {...register('experience')}
                    rows={2}
                    placeholder="Describe your previous acting roles, productions or classes..."
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all resize-none"
                  />
                  {errors.experience && <p className="text-xs text-red-500 mt-1">{errors.experience.message}</p>}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Languages Known *</label>
                  <input
                    type="text"
                    {...register('languages')}
                    placeholder="e.g. English, Spanish (Fluent), French (Basic)"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all"
                  />
                  {errors.languages && <p className="text-xs text-red-500 mt-1">{errors.languages.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Instagram URL/Handle (Optional)</label>
                  <input
                    type="text"
                    {...register('instagram')}
                    placeholder="https://instagram.com/username"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Facebook URL/Handle (Optional)</label>
                  <input
                    type="text"
                    {...register('facebook')}
                    placeholder="https://facebook.com/username"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-foreground mb-1.5">YouTube Link / Showreel (Optional)</label>
                  <input
                    type="text"
                    {...register('youtube')}
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 4: UPLOADS & BIO */}
          {currentStep === 4 && (
            <motion.div
              key="step-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <h3 className="text-xl font-bold text-foreground">Step 4: Media Uploads & Application Statements</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Short Bio (Min 10 characters) *</label>
                  <textarea
                    {...register('bio')}
                    rows={2}
                    placeholder="Tell us about yourself..."
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all resize-none"
                  />
                  {errors.bio && <p className="text-xs text-red-500 mt-1">{errors.bio.message}</p>}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Why should we choose you? (Min 10 characters) *</label>
                  <textarea
                    {...register('reason')}
                    rows={2}
                    placeholder="What sets you apart from other talents?"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all resize-none"
                  />
                  {errors.reason && <p className="text-xs text-red-500 mt-1">{errors.reason.message}</p>}
                </div>

                {/* 1. Profile Photo Slot */}
                <div className="p-4 rounded-xl border border-border bg-card flex flex-col justify-between">
                  <div>
                    <h4 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-primary" />
                      <span>Profile Photo *</span>
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">Image file up to 10MB.</p>
                  </div>
                  <div className="mt-4">
                    {uploads.profilePhoto.status === 'success' ? (
                      <div className="flex items-center gap-2 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-2.5 rounded-lg">
                        <Check className="w-4 h-4 shrink-0" />
                        <span className="truncate flex-1 font-medium">{uploads.profilePhoto.name}</span>
                      </div>
                    ) : (
                      <label className="w-full flex items-center justify-center gap-2 border border-dashed border-border py-4 rounded-xl cursor-pointer hover:bg-muted/40 transition-colors text-xs font-semibold text-muted-foreground">
                        <Upload className="w-4 h-4" />
                        <span>Select Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => onFileChange(e, 'profilePhoto')}
                          disabled={uploads.profilePhoto.status === 'uploading'}
                        />
                      </label>
                    )}
                    {uploads.profilePhoto.status === 'uploading' && (
                      <div className="mt-2.5">
                        <div className="flex justify-between text-[10px] font-semibold text-primary mb-1">
                          <span>Uploading Photo...</span>
                          <span>{uploads.profilePhoto.progress}%</span>
                        </div>
                        <div className="w-full bg-border h-1.5 rounded-full overflow-hidden">
                          <div className="bg-primary h-full transition-all duration-300" style={{ width: `${uploads.profilePhoto.progress}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                  {errors.profilePhotoUrl && <p className="text-xs text-red-500 mt-2">{errors.profilePhotoUrl.message}</p>}
                </div>

                {/* 2. Resume PDF Slot (Optional) */}
                <div className="p-4 rounded-xl border border-border bg-card flex flex-col justify-between">
                  <div>
                    <h4 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-primary" />
                      <span>Resume PDF (Optional)</span>
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">PDF format up to 10MB.</p>
                  </div>
                  <div className="mt-4">
                    {uploads.resume.status === 'success' ? (
                      <div className="flex items-center gap-2 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-2.5 rounded-lg">
                        <Check className="w-4 h-4 shrink-0" />
                        <span className="truncate flex-1 font-medium">{uploads.resume.name}</span>
                      </div>
                    ) : (
                      <label className="w-full flex items-center justify-center gap-2 border border-dashed border-border py-4 rounded-xl cursor-pointer hover:bg-muted/40 transition-colors text-xs font-semibold text-muted-foreground">
                        <Upload className="w-4 h-4" />
                        <span>Select Resume PDF</span>
                        <input
                          type="file"
                          accept="application/pdf"
                          className="hidden"
                          onChange={(e) => onFileChange(e, 'resume')}
                          disabled={uploads.resume.status === 'uploading'}
                        />
                      </label>
                    )}
                    {uploads.resume.status === 'uploading' && (
                      <div className="mt-2.5">
                        <div className="flex justify-between text-[10px] font-semibold text-primary mb-1">
                          <span>Uploading Resume...</span>
                          <span>{uploads.resume.progress}%</span>
                        </div>
                        <div className="w-full bg-border h-1.5 rounded-full overflow-hidden">
                          <div className="bg-primary h-full transition-all duration-300" style={{ width: `${uploads.resume.progress}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Portfolio Photos (Up to 5) */}
                <div className="sm:col-span-2 p-4 rounded-xl border border-border bg-card">
                  <div>
                    <h4 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-primary" />
                      <span>Portfolio Photos * ({portfolioList.filter(p => p.status === 'success').length}/5)</span>
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">Upload at least 1 image showing your performance range (Max 10MB each).</p>
                  </div>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {portfolioList.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-2.5 border border-border rounded-lg bg-background text-xs">
                        <span className="truncate font-medium max-w-[150px]">{item.name}</span>
                        <div className="flex items-center gap-2">
                          {item.status === 'uploading' && (
                            <span className="font-semibold text-primary">{item.progress}%</span>
                          )}
                          {item.status === 'success' && (
                            <span className="text-emerald-500 font-semibold flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> Done
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => removePortfolioItem(item.id)}
                            className="p-1 hover:bg-muted rounded-md text-red-500"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {portfolioList.length < 5 && (
                      <label className="flex items-center justify-center gap-2 border border-dashed border-border py-4 rounded-xl cursor-pointer hover:bg-muted/40 transition-colors text-xs font-semibold text-muted-foreground h-[46px]">
                        <Upload className="w-4 h-4" />
                        <span>Add Portfolio Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => onFileChange(e, 'portfolio')}
                        />
                      </label>
                    )}
                  </div>
                  {errors.portfolioUrls && <p className="text-xs text-red-500 mt-2">{errors.portfolioUrls.message}</p>}
                </div>

                {/* 4. Audition Video (Up to 500MB) */}
                <div className="sm:col-span-2 p-4 rounded-xl border border-border bg-card">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <div>
                      <h4 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                        <Video className="w-4 h-4 text-primary" />
                        <span>Audition Video *</span>
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">MP4, MOV, or AVI up to 500MB.</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    {uploads.video.status === 'success' ? (
                      <div className="flex items-center gap-2 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-3 rounded-lg">
                        <Check className="w-4 h-4 shrink-0" />
                        <span className="truncate flex-1 font-semibold">{uploads.video.name}</span>
                      </div>
                    ) : (
                      <label className="w-full flex flex-col items-center justify-center border border-dashed border-border py-8 rounded-xl cursor-pointer hover:bg-muted/40 transition-colors text-xs text-muted-foreground gap-2">
                        <Upload className="w-6 h-6 text-primary animate-pulse" />
                        <span className="font-semibold">Select and upload audition monologue</span>
                        <span className="text-[10px] opacity-75">Uploading directly and securely to Google Drive</span>
                        <input
                          type="file"
                          accept="video/mp4,video/quicktime,video/x-msvideo"
                          className="hidden"
                          onChange={(e) => onFileChange(e, 'video')}
                          disabled={uploads.video.status === 'uploading'}
                        />
                      </label>
                    )}
                    {uploads.video.status === 'uploading' && (
                      <div className="mt-4 p-3 bg-muted/40 border border-border rounded-xl">
                        <div className="flex justify-between text-xs font-semibold text-primary mb-1.5">
                          <span className="flex items-center gap-1.5">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Uploading to Google Drive...
                          </span>
                          <span>{uploads.video.progress}%</span>
                        </div>
                        <div className="w-full bg-border h-2 rounded-full overflow-hidden">
                          <div className="bg-primary h-full transition-all duration-300" style={{ width: `${uploads.video.progress}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                  {errors.videoUrl && <p className="text-xs text-red-500 mt-2">{errors.videoUrl.message}</p>}
                </div>

                {/* 5. Terms and Conditions & Button */}
                <div className="sm:col-span-2 border-t border-border pt-6 mt-4">
                  <label className="flex items-start gap-3 text-xs leading-relaxed text-muted-foreground select-none cursor-pointer">
                    <input
                      type="checkbox"
                      {...register('termsAccepted')}
                      className="mt-0.5 rounded border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                    />
                    <span>
                      I agree to the Terms & Conditions. I understand my submission files will be stored inside the casting agency's Google Drive folders and details logged inside casting boards.
                    </span>
                  </label>
                  {errors.termsAccepted && <p className="text-xs text-red-500 mt-1">{errors.termsAccepted.message}</p>}
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Controls */}
        <div className="border-t border-border mt-8 pt-6 flex justify-between gap-4">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1 || isSubmitting}
            className={`px-5 py-3.5 rounded-xl border border-border bg-card/65 font-bold text-sm transition-all flex items-center gap-2 cursor-pointer hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={nextStep}
              className="px-6 py-3.5 rounded-xl font-bold bg-primary text-primary-foreground hover:opacity-90 shadow-md shadow-primary/10 text-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting || !watchedTerms}
              className="px-8 py-3.5 rounded-xl font-bold bg-primary text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/20 text-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting App...</span>
                </>
              ) : (
                <>
                  <span>Submit Audition</span>
                  <Check className="w-4 h-4 stroke-[3px]" />
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
