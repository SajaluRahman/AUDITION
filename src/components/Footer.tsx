import React from 'react';
import { Film, Mail, MapPin, Phone } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card/30 py-8 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand Col */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 font-bold text-lg text-primary tracking-wide">
              <Film className="w-5 h-5 text-primary" />
              <span>AWA MOVIES</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              Casting and production portal for upcoming Malayalam and UK-based feature film productions.
            </p>
          </div>

          {/* Categories Col */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-3 text-foreground">Talent Categories</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Acting (Film, TV, Theater)</li>
              <li>Modeling (Fashion, Commercial)</li>
              <li>Dancing (Classical, Modern, Street)</li>
              <li>Singing & Musical Performance</li>
            </ul>
          </div>

          {/* Contact Col */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-3 text-foreground">Contact Casting</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary shrink-0" />
                <span>Kerala Hut, 1 George St., Luton LU1 2AA, UK</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary shrink-0" />
                <span>awamovies.uk@gmail.com</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary shrink-0" />
                <span>+44 7597 311388</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Audition Portal. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
            <span className="text-border">|</span>
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
