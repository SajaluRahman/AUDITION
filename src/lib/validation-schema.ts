import { z } from 'zod';

export const auditionSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  age: z.coerce.number().min(1, 'Age must be greater than 0').max(120, 'Please enter a valid age'),
  gender: z.string().min(1, 'Gender is required'),
  dob: z.string().min(1, 'Date of birth is required'),
  phone: z.string().regex(/^\+?[0-9\s\-()]{10,20}$/, 'Please enter a valid phone number (10-20 digits)'),
  whatsApp: z.string().regex(/^\+?[0-9\s\-()]{10,20}$/, 'Please enter a valid WhatsApp number (10-20 digits)'),
  email: z.string().email('Please enter a valid email address'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  country: z.string().min(2, 'Country is required'),
  height: z.string().min(1, 'Height is required (e.g. 5\'8" or 173cm)'),
  weight: z.string().min(1, 'Weight is required (e.g. 70kg or 154lbs)'),
  instagram: z.string().optional().or(z.literal('')),
  facebook: z.string().optional().or(z.literal('')),
  youtube: z.string().optional().or(z.literal('')),
  occupation: z.string().min(2, 'Occupation is required'),
  experience: z.string().min(5, 'Acting experience description must be at least 5 characters'),
  languages: z.string().min(2, 'Languages known are required'),
  talentCategory: z.string().min(1, 'Please select a talent category'),
  bio: z.string().min(10, 'Short bio must be at least 10 characters'),
  reason: z.string().min(10, 'This field must be at least 10 characters'),
  
  // Upload URLs (the backend receives the URLs after the client uploads them)
  profilePhotoUrl: z.string().url('Profile photo is required. Please upload a file.'),
  portfolioUrls: z.string().min(1, 'At least one portfolio photo is required. Please upload portfolio photos.'),
  resumeUrl: z.string().optional().or(z.literal('')),
  videoUrl: z.string().url('Audition video is required. Please upload a video file.'),
  
  termsAccepted: z.literal(true, {
    message: 'You must accept the terms and conditions',
  }),
});

export type AuditionInput = z.infer<typeof auditionSchema>;
