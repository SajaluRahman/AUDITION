'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Download, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ExternalLink, 
  FileText, 
  Video, 
  Image as ImageIcon, 
  ArrowUpDown,
  Loader2,
  RefreshCw,
  Calendar,
  X,
  Lock,
  LogOut
} from 'lucide-react';
import { useToast } from '@/components/Providers';

export default function AdminDashboard() {
  const { toast } = useToast();
  
  // Authentication states
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  
  // Data loading states
  const [applicants, setApplicants] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Shortlisted' | 'Rejected'>('All');
  const [selectedApplicant, setSelectedApplicant] = useState<Record<string, any> | null>(null);

  // Check authentication status on mount
  useEffect(() => {
    const auth = sessionStorage.getItem('admin_authenticated');
    if (auth === 'true') {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === 'admin@gmail.com' && password === 'Admin123') {
      setIsLoggedIn(true);
      sessionStorage.setItem('admin_authenticated', 'true');
      toast({ type: 'success', title: 'Login Successful', description: 'Welcome to the casting board admin panel.' });
    } else {
      setAuthError('Invalid email or password.');
      toast({ type: 'error', title: 'Authentication Failed', description: 'Invalid email or password.' });
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    sessionStorage.removeItem('admin_authenticated');
    toast({ type: 'info', title: 'Logged Out', description: 'You have been safely logged out.' });
  };

  // Fetch applicant list from spreadsheet API
  const fetchApplicants = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await fetch('/api/status');
      if (!response.ok) {
        throw new Error('Failed to fetch data from casting server');
      }
      const res = await response.json();
      if (res.success) {
        setApplicants(res.data);
      } else {
        throw new Error(res.error || 'Server error reading spreadsheet');
      }
    } catch (error: any) {
      console.error(error);
      toast({ type: 'error', title: 'Data loading failed', description: error.message || 'Ensure your Service Account is configured.' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchApplicants();
    }
  }, [isLoggedIn]);

  // Update status (Shortlist / Reject)
  const handleUpdateStatus = async (submissionId: string, newStatus: 'Shortlisted' | 'Rejected' | 'Pending') => {
    try {
      const response = await fetch('/api/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId, status: newStatus }),
      });

      const res = await response.json();
      if (res.success) {
        toast({ type: 'success', title: `Applicant ${newStatus}`, description: `Submission ${submissionId} updated.` });
        
        // Sync local list
        setApplicants((prev) => 
          prev.map((app) => app['Submission ID'] === submissionId ? { ...app, 'Status': newStatus } : app)
        );

        // Sync selected applicant modal
        if (selectedApplicant && selectedApplicant['Submission ID'] === submissionId) {
          setSelectedApplicant((prev) => prev ? { ...prev, 'Status': newStatus } : null);
        }
      } else {
        throw new Error(res.error || 'Failed to update database');
      }
    } catch (error: any) {
      console.error(error);
      toast({ type: 'error', title: 'Status update failed', description: error.message });
    }
  };

  // Perform client-side filter and search mapping
  const filteredApplicants = applicants.filter((app) => {
    const firstName = app['First Name'] || '';
    const lastName = app['Last Name'] || '';
    const submissionId = app['Submission ID'] || '';
    const occupation = app['Occupation'] || '';
    const talent = app['Talent'] || '';
    
    const matchesSearch = 
      firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      submissionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      occupation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      talent.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'All' || app['Status'] === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate dashboard stats
  const stats = {
    total: applicants.length,
    pending: applicants.filter((a) => a['Status'] === 'Pending' || !a['Status']).length,
    shortlisted: applicants.filter((a) => a['Status'] === 'Shortlisted').length,
    rejected: applicants.filter((a) => a['Status'] === 'Rejected').length,
  };

  // Export filtered rows to CSV
  const handleExportCSV = () => {
    if (filteredApplicants.length === 0) {
      toast({ type: 'warning', title: 'No records to export', description: 'Filter list returns zero results.' });
      return;
    }

    try {
      // Define headers matching spreadsheet columns
      const headers = Object.keys(applicants[0]);
      
      const csvRows = [];
      // 1. Add headers row
      csvRows.push(headers.join(','));

      // 2. Add data rows, escaping values to prevent formatting breaks
      for (const row of filteredApplicants) {
        const values = headers.map((header) => {
          const val = row[header] !== undefined ? row[header] : '';
          const escaped = ('' + val).replace(/"/g, '""'); // escape double quotes
          return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
      }

      const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.join('\n');
      const encodedUri = encodeURI(csvContent);
      
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `audition_submissions_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({ type: 'success', title: 'CSV Export Completed', description: `${filteredApplicants.length} records exported.` });
    } catch (err: any) {
      toast({ type: 'error', title: 'CSV Export failed', description: err.message });
    }
  };

  // Helper formatting for timestamps
  const formatDateString = (isoString: string) => {
    try {
      if (!isoString) return '-';
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return isoString;
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 w-full flex-1 flex flex-col justify-center min-h-[70vh]">
        <div className="bg-card border border-border p-8 rounded-3xl shadow-xl flex flex-col items-center">
          <div className="p-4 bg-primary/10 text-primary rounded-full mb-6">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-foreground text-center">Admin Portal Login</h2>
          <p className="text-sm text-muted-foreground text-center mt-1.5 mb-8">
            Please authenticate to manage audition submissions.
          </p>

          <form onSubmit={handleLogin} className="w-full space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setAuthError('');
                }}
                required
                placeholder="admin@gmail.com"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setAuthError('');
                }}
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all"
              />
            </div>

            {authError && (
              <p className="text-xs text-red-500 font-semibold text-center mt-1">{authError}</p>
            )}

            <button
              type="submit"
              className="w-full py-3.5 mt-2 rounded-xl font-bold bg-primary text-primary-foreground hover:opacity-90 shadow-md shadow-primary/15 transition-all text-sm cursor-pointer flex items-center justify-center"
            >
              Log In
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
      {/* 1. Header with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
            <Users className="w-8 h-8 text-primary" />
            <span>Casting Board Dashboard</span>
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Manage, evaluate, and shortlist audition submissions synced directly from Google Sheets.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchApplicants(true)}
            disabled={loading || refreshing}
            className="p-2.5 rounded-lg border border-border bg-card/65 hover:bg-muted text-foreground transition-all cursor-pointer flex items-center justify-center shrink-0 disabled:opacity-50"
            aria-label="Refresh casting database"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleExportCSV}
            className="px-5 py-3 rounded-lg font-semibold bg-primary text-primary-foreground hover:opacity-90 shadow-md shadow-primary/10 text-sm transition-all flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-3 rounded-lg font-semibold border border-red-500/25 bg-red-500/5 hover:bg-red-500/10 text-red-500 text-sm transition-all flex items-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* 2. Stats Counters Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="p-5 rounded-2xl bg-card border border-border flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Submissions</p>
            <h3 className="text-3xl font-bold mt-1 text-foreground">{loading ? '-' : stats.total}</h3>
          </div>
          <div className="p-3 bg-primary/10 text-primary rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pending Evaluation</p>
            <h3 className="text-3xl font-bold mt-1 text-amber-500">{loading ? '-' : stats.pending}</h3>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Shortlisted</p>
            <h3 className="text-3xl font-bold mt-1 text-emerald-500">{loading ? '-' : stats.shortlisted}</h3>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rejected</p>
            <h3 className="text-3xl font-bold mt-1 text-red-500">{loading ? '-' : stats.rejected}</h3>
          </div>
          <div className="p-3 bg-red-500/10 text-red-500 rounded-xl">
            <XCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by Name, ID, category, occupation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-card/65 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground shrink-0 hidden sm:block" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-3 rounded-xl border border-border bg-card/65 focus:outline-none focus:ring-2 focus:ring-primary text-sm appearance-none cursor-pointer pr-10 relative bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2364748b%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.75rem] bg-[right_1rem_center] bg-no-repeat"
          >
            <option value="All">All Submissions</option>
            <option value="Pending">Pending</option>
            <option value="Shortlisted">Shortlisted</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* 4. Table Grid */}
      <div className="border border-border rounded-2xl bg-card overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-sm font-semibold">Loading data from Google Sheets...</p>
          </div>
        ) : filteredApplicants.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2 text-muted-foreground text-center px-4">
            <Users className="w-12 h-12 stroke-[1.5] mb-2 opacity-50" />
            <h4 className="font-bold text-lg text-foreground">No Submissions Found</h4>
            <p className="text-xs max-w-xs leading-relaxed">We couldn't find any submissions matching your search parameters or query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                  <th className="p-4">Submission ID</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Talent Category</th>
                  <th className="p-4">Age / Gender</th>
                  <th className="p-4">Date Applied</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredApplicants.map((app, idx) => {
                  let badgeColor = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25';
                  if (app['Status'] === 'Shortlisted') badgeColor = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25';
                  if (app['Status'] === 'Rejected') badgeColor = 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/25';

                  return (
                    <tr key={idx} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4 font-bold text-primary tracking-wide">{app['Submission ID']}</td>
                      <td className="p-4 font-semibold text-foreground">
                        {app['First Name']} {app['Last Name']}
                      </td>
                      <td className="p-4 text-muted-foreground">{app['Talent'] || '-'}</td>
                      <td className="p-4 text-muted-foreground">
                        {app['Age']} yrs / {app['Gender']}
                      </td>
                      <td className="p-4 text-muted-foreground flex items-center gap-1.5 mt-0.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDateString(app['Timestamp'])}</span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full border text-[11px] font-bold uppercase tracking-wider ${badgeColor}`}>
                          {app['Status'] || 'Pending'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => setSelectedApplicant(app)}
                          className="px-3.5 py-2 border border-border bg-card/65 hover:bg-muted text-foreground text-xs font-semibold rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <span>Review</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Applicant Detail Drawer Modal */}
      {selectedApplicant && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl h-full bg-card border-l border-border shadow-2xl flex flex-col justify-between overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-border bg-muted/20 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-primary uppercase tracking-wider">{selectedApplicant['Submission ID']}</span>
                <h3 className="text-2xl font-bold text-foreground mt-1">
                  {selectedApplicant['First Name']} {selectedApplicant['Last Name']}
                </h3>
              </div>
              <button
                onClick={() => setSelectedApplicant(null)}
                className="p-2 hover:bg-muted rounded-lg border border-border transition-colors cursor-pointer"
                aria-label="Close detail modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex-1 overflow-y-auto space-y-8">
              {/* Core Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contact Coordinates</h4>
                  <div className="mt-2.5 space-y-1.5 text-sm">
                    <p><span className="text-muted-foreground">Email:</span> <a href={`mailto:${selectedApplicant['Email']}`} className="text-primary hover:underline">{selectedApplicant['Email']}</a></p>
                    <p><span className="text-muted-foreground">Phone:</span> <a href={`tel:${selectedApplicant['Phone']}`} className="text-foreground hover:underline">{selectedApplicant['Phone']}</a></p>
                    <p><span className="text-muted-foreground">WhatsApp:</span> <span className="text-foreground">{selectedApplicant['WhatsApp']}</span></p>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Location Info</h4>
                  <div className="mt-2.5 space-y-1.5 text-sm">
                    <p><span className="text-muted-foreground">Address:</span> <span className="text-foreground">{selectedApplicant['Address']}</span></p>
                    <p><span className="text-muted-foreground">City/State:</span> <span className="text-foreground">{selectedApplicant['City']}, {selectedApplicant['State']}</span></p>
                    <p><span className="text-muted-foreground">Country:</span> <span className="text-foreground">{selectedApplicant['Country']}</span></p>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Physical Stats</h4>
                  <div className="mt-2.5 space-y-1.5 text-sm">
                    <p><span className="text-muted-foreground">Height:</span> <span className="text-foreground">{selectedApplicant['Height'] || '-'}</span></p>
                    <p><span className="text-muted-foreground">Weight:</span> <span className="text-foreground">{selectedApplicant['Weight'] || '-'}</span></p>
                    <p><span className="text-muted-foreground">Occupation:</span> <span className="text-foreground">{selectedApplicant['Occupation'] || '-'}</span></p>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Talent Details</h4>
                  <div className="mt-2.5 space-y-1.5 text-sm">
                    <p><span className="text-muted-foreground">Category:</span> <span className="text-foreground font-semibold text-primary">{selectedApplicant['Talent'] || '-'}</span></p>
                    <p><span className="text-muted-foreground">Languages:</span> <span className="text-foreground">{selectedApplicant['Languages'] || '-'}</span></p>
                  </div>
                </div>
              </div>

              {/* Bio Statement */}
              <div className="border-t border-border pt-5">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Short Bio</h4>
                <p className="text-sm text-foreground leading-relaxed bg-muted/30 p-4 rounded-xl border border-border/50">
                  {selectedApplicant['Bio'] || 'No biography details provided.'}
                </p>
              </div>

              {/* Application Reason Statement */}
              <div className="border-t border-border pt-5">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Why Choose This Talent?</h4>
                <p className="text-sm text-foreground leading-relaxed bg-muted/30 p-4 rounded-xl border border-border/50">
                  {selectedApplicant['Reason'] || 'No statements provided.'}
                </p>
              </div>

              {/* Experience Statement */}
              <div className="border-t border-border pt-5">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Acting Experience</h4>
                <p className="text-sm text-foreground leading-relaxed bg-muted/30 p-4 rounded-xl border border-border/50">
                  {selectedApplicant['Experience'] || 'No experience details logged.'}
                </p>
              </div>

              {/* Uploaded File Folders Links */}
              <div className="border-t border-border pt-5 space-y-4">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Uploaded Media Artifacts</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Profile photo view */}
                  {selectedApplicant['Profile Photo URL'] && (
                    <a
                      href={selectedApplicant['Profile Photo URL']}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 border border-border rounded-xl bg-card hover:bg-muted/50 transition-colors flex items-center gap-3 text-sm font-semibold text-foreground group"
                    >
                      <div className="p-2 bg-primary/10 text-primary rounded-lg">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                      <span className="flex-1 truncate">Profile Headshot</span>
                      <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </a>
                  )}

                  {/* Audition Video link */}
                  {selectedApplicant['Video URL'] && (
                    <a
                      href={selectedApplicant['Video URL']}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 border border-border rounded-xl bg-card hover:bg-muted/50 transition-colors flex items-center gap-3 text-sm font-semibold text-foreground group"
                    >
                      <div className="p-2 bg-secondary/10 text-secondary rounded-lg">
                        <Video className="w-5 h-5" />
                      </div>
                      <span className="flex-1 truncate">Audition Video Tape</span>
                      <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-secondary transition-colors" />
                    </a>
                  )}

                  {/* Resume PDF link */}
                  {selectedApplicant['Resume URL'] && (
                    <a
                      href={selectedApplicant['Resume URL']}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 border border-border rounded-xl bg-card hover:bg-muted/50 transition-colors flex items-center gap-3 text-sm font-semibold text-foreground group"
                    >
                      <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
                        <FileText className="w-5 h-5" />
                      </div>
                      <span className="flex-1 truncate">Resume PDF CV</span>
                      <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-amber-500 transition-colors" />
                    </a>
                  )}
                </div>

                {/* Portfolio URLs list */}
                {selectedApplicant['Portfolio URL'] && (
                  <div className="p-4 border border-border rounded-xl bg-card space-y-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <ImageIcon className="w-3.5 h-3.5 text-primary" />
                      <span>Portfolio Pictures</span>
                    </span>
                    <div className="flex flex-wrap gap-2.5 mt-2">
                      {selectedApplicant['Portfolio URL'].split(',').map((url: string, index: number) => (
                        <a
                          key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 border border-border hover:border-primary/50 text-xs font-medium text-muted-foreground hover:text-primary rounded-lg transition-colors flex items-center gap-1 bg-background"
                        >
                          <span>Photo {index + 1}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="p-6 border-t border-border bg-muted/20 flex gap-3">
              <button
                onClick={() => handleUpdateStatus(selectedApplicant['Submission ID'], 'Rejected')}
                disabled={selectedApplicant['Status'] === 'Rejected'}
                className="flex-1 px-5 py-3.5 border border-red-500/20 bg-red-500/5 hover:bg-red-500/15 text-red-500 font-bold rounded-xl text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                <span>Reject</span>
              </button>
              <button
                onClick={() => handleUpdateStatus(selectedApplicant['Submission ID'], 'Shortlisted')}
                disabled={selectedApplicant['Status'] === 'Shortlisted'}
                className="flex-1 px-5 py-3.5 border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/15 text-emerald-500 font-bold rounded-xl text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Shortlist</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
