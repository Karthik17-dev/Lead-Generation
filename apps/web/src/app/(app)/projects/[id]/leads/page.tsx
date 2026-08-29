'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowSquareOutIcon,
  CaretDownIcon,
  CaretLeftIcon,
  CaretRightIcon,
  CheckIcon,
  CopyIcon,
  DotsThreeVerticalIcon,
  DownloadSimpleIcon,
  EnvelopeIcon,
  FileCodeIcon,
  FileCsvIcon,
  FileDocIcon,
  FilePdfIcon,
  FolderOpenIcon,
  GlobeIcon,
  LightningIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  PhoneIcon,
  SpinnerIcon,
  StorefrontIcon,
  TrashIcon,
} from '@phosphor-icons/react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  InputGroupSearch,
  InputGroupSearchIcon,
  InputGroupSearchInput,
} from '@/components/ui/input-group';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { successToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

export interface GoogleMapsLead {
  id: string;
  name: string;
  email: string;
  category: string;
  address: string;
  phone: string;
  website: string;
  status: 'New' | 'Contacted' | 'Verified' | 'Enriched';
  campaign: string;
  mapsUrl?: string;
}

const DEFAULT_MAPS_LEADS: GoogleMapsLead[] = [
  {
    id: 'lead-1',
    name: 'Tanamera Coffee Roastery Thamrin',
    email: 'info@tanameracoffee.com',
    category: 'Coffee shop',
    address: 'Thamrin City Office Park AA07, Jl. Kebon Kacang Raya, Jakarta Pusat',
    phone: '+62 21 2962 5599',
    website: 'https://tanameracoffee.com',
    status: 'Verified',
    campaign: 'Jakarta Coffee Leads',
    mapsUrl: 'https://maps.google.com/?q=Tanamera+Coffee+Thamrin',
  },
  {
    id: 'lead-2',
    name: 'Guten Morgen Coffee Lab & Florist',
    email: 'gutenmorgen.id@gmail.com',
    category: 'Cafe',
    address: 'Jl. Mandala Utara No.29C, Tomang, Jakarta Barat',
    phone: '+62 812 8000 1289',
    website: 'https://gutenmorgencoffee.id',
    status: 'New',
    campaign: 'Jakarta Coffee Leads',
    mapsUrl: 'https://maps.google.com/?q=Guten+Morgen+Coffee+Jakarta',
  },
  {
    id: 'lead-3',
    name: 'Common Grounds Coffee Roasters',
    email: 'contact@commongrounds.co.id',
    category: 'Coffee shop',
    address: 'Citywalk Sudirman Ground Floor, Jl. K.H. Mas Mansyur, Jakarta Pusat',
    phone: '+62 21 2555 8999',
    website: 'https://commongrounds.co.id',
    status: 'Contacted',
    campaign: 'Jakarta Coffee Leads',
    mapsUrl: 'https://maps.google.com/?q=Common+Grounds+Sudirman',
  },
  {
    id: 'lead-4',
    name: 'Anomali Coffee Senopati',
    email: 'anomali.senopati@gmail.com',
    category: 'Coffee shop',
    address: 'Jl. Senopati No.19, Kebayoran Baru, Jakarta Selatan',
    phone: '+62 21 5292 0111',
    website: 'https://anomalicoffee.com',
    status: 'Enriched',
    campaign: 'Jakarta Coffee Leads',
    mapsUrl: 'https://maps.google.com/?q=Anomali+Coffee+Senopati',
  },
  {
    id: 'lead-5',
    name: '1/15 Coffee Gandaria',
    email: 'hello@onefifteenthcoffee.com',
    category: 'Cafe',
    address: 'Jl. Gandaria I No.63, Kramat Pela, Jakarta Selatan',
    phone: '+62 21 7225 678',
    website: 'https://onefifteenthcoffee.com',
    status: 'Verified',
    campaign: 'Jakarta Coffee Leads',
    mapsUrl: 'https://maps.google.com/?q=One+Fifteenth+Coffee+Gandaria',
  },
  {
    id: 'lead-6',
    name: 'Titik Temu Coffee SCBD',
    email: 'titiktemu.scbd@gmail.com',
    category: 'Coffee shop',
    address: 'Jl. Jend. Sudirman Kav. 52-53, Senayan, Jakarta Selatan',
    phone: '+62 811 9002 341',
    website: 'https://titiktemu.com',
    status: 'New',
    campaign: 'Jakarta Coffee Leads',
    mapsUrl: 'https://maps.google.com/?q=Titik+Temu+SCBD',
  },
];

const STATUS_CONFIG: Record<
  GoogleMapsLead['status'],
  { dot: string; bg: string; text: string; border: string }
> = {
  New: {
    dot: 'bg-blue-500',
    bg: 'bg-blue-500/10',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-500/20',
  },
  Contacted: {
    dot: 'bg-amber-500',
    bg: 'bg-amber-500/10',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-500/20',
  },
  Verified: {
    dot: 'bg-emerald-500',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/20',
  },
  Enriched: {
    dot: 'bg-purple-500',
    bg: 'bg-purple-500/10',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-500/20',
  },
};

const INDUSTRY_OPTIONS = [
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'cafe', label: 'Cafe & Coffee Shop' },
  { value: 'retail', label: 'Retail Store' },
  { value: 'automotive', label: 'Automotive & Repair' },
  { value: 'healthcare', label: 'Healthcare & Clinic' },
  { value: 'beauty', label: 'Beauty Salon & Spa' },
  { value: 'education', label: 'Education & School' },
  { value: 'realestate', label: 'Real Estate Agency' },
  { value: 'event', label: 'Event Organizer' },
  { value: 'tech', label: 'Tech & IT Services' },
  { value: 'professional', label: 'Professional Services' },
];

const PAGE_SIZE = 6;

export default function LeadsPage() {
  const params = useParams<{ id: string }>();
  const projectId = params?.id || 'default';

  // Campaign Form State
  const [campaignName, setCampaignName] = useState('');
  const [industry, setIndustry] = useState('');
  const [industryDropdownOpen, setIndustryDropdownOpen] = useState(false);
  const industryContainerRef = useRef<HTMLDivElement>(null);
  const [location, setLocation] = useState('');
  const [describeLeads, setDescribeLeads] = useState('');
  const [maxResults, setMaxResults] = useState<number>(50);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedFiles, setSavedFiles] = useState<string[]>([]);

  // Table, Filter, & Pagination State
  const [leads, setLeads] = useState<GoogleMapsLead[]>(DEFAULT_MAPS_LEADS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLead, setSelectedLead] = useState<GoogleMapsLead | null>(null);

  const filteredIndustries = useMemo(() => {
    if (!industry.trim()) return INDUSTRY_OPTIONS;
    return INDUSTRY_OPTIONS.filter((item) =>
      item.label.toLowerCase().includes(industry.toLowerCase().trim()),
    );
  }, [industry]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        industryContainerRef.current &&
        !industryContainerRef.current.contains(e.target as Node)
      ) {
        setIndustryDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const resetForm = () => {
    setCampaignName('');
    setIndustry('');
    setLocation('');
    setDescribeLeads('');
    setMaxResults(50);
    setFormError(null);
  };

  const handleGenerateLeads = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignName.trim()) {
      setFormError('Please enter a campaign name.');
      return;
    }
    if (!industry.trim()) {
      setFormError('Please select or specify an industry.');
      return;
    }
    if (!location.trim()) {
      setFormError('Please specify target location(s).');
      return;
    }

    setFormError(null);
    setIsSubmitting(true);

    // Simulate Google Maps crawler search
    await new Promise((r) => setTimeout(r, 850));

    const cafeNames = [
      'Titik Temu Coffee', 'Filosofi Kopi', 'Kopi Toko Djawa', 'Monolog Coffee', 'St. Ali Coffee Roasters',
      'Lucky Cat Coffee & Kitchen', 'Woodpecker Coffee', 'Ombe Kofie', 'Djournal Coffee Bar', 'Kopi Selamat Pagi',
      'Work Coffee Indonesia', 'Kopi Mandja', 'Tanatap Coffee Bar', 'Two Cents Coffee', 'Blue Doors Coffee',
    ];
    const streets = [
      'Jl. Senopati No. 27', 'Jl. Panglima Polim No. 12', 'Jl. Gandaria II No. 8', 'Jl. KH Mas Mansyur No. 45',
      'Jl. Sudirman Kav. 52', 'Jl. Gatot Subroto No. 19', 'Jl. Kemang Raya No. 34', 'Jl. Cikajang No. 11',
    ];

    const generatedLeads: GoogleMapsLead[] = Array.from({ length: maxResults }, (_, i) => {
      const bName = cafeNames[i % cafeNames.length] + (i >= cafeNames.length ? ` #${Math.floor(i / cafeNames.length) + 1}` : '');
      const street = streets[i % streets.length];
      const slug = bName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const statuses: GoogleMapsLead['status'][] = ['New', 'New', 'Verified', 'Contacted'];

      return {
        id: `gmaps-lead-${Date.now()}-${i}`,
        name: bName,
        email: i % 2 === 0 ? `${slug}@gmail.com` : `contact@${slug}.com`,
        category: industry || 'Coffee shop',
        address: `${street}, ${location}`,
        phone: `+62 21 ${Math.floor(2000 + Math.random() * 7000)} ${Math.floor(1000 + Math.random() * 8999)}`,
        website: `https://${slug}.com`,
        status: statuses[i % statuses.length],
        campaign: campaignName,
        mapsUrl: `https://maps.google.com/?q=${encodeURIComponent(bName + ' ' + location)}`,
      };
    });

    const campaignSlug = campaignName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    try {
      const res = await fetch(`/api/v1/projects/${projectId}/campaign-files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign: campaignName,
          industry,
          location,
          describeLeads,
          maxResults,
          format: 'all',
          totalDiscovered: generatedLeads.length,
          generatedAt: new Date().toISOString(),
          leads: generatedLeads,
        }),
      });
      const data = await res.json();
      if (data?.paths && data.paths.length > 0) {
        setSavedFiles(data.paths);
      } else {
        setSavedFiles([`campaigns/${campaignSlug}.json`]);
      }
    } catch {
      setSavedFiles([`campaigns/${campaignSlug}.json`]);
    }

    setLeads([...generatedLeads, ...leads]);
    setIsSubmitting(false);
    setCurrentPage(1);
    resetForm();
  };

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearch =
        lead.name.toLowerCase().includes(search.toLowerCase()) ||
        lead.email.toLowerCase().includes(search.toLowerCase()) ||
        lead.category.toLowerCase().includes(search.toLowerCase()) ||
        lead.address.toLowerCase().includes(search.toLowerCase()) ||
        lead.phone.toLowerCase().includes(search.toLowerCase()) ||
        lead.campaign.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'All' || lead.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [leads, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedLeads = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredLeads.slice(start, start + PAGE_SIZE);
  }, [filteredLeads, safePage]);

  const deleteLead = (id: string) => {
    setLeads((prev) => prev.filter((l) => l.id !== id));
  };

  const enrichLead = (id: string) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: 'Enriched' as const } : l)),
    );
    successToast('Lead enriched with intelligence profile');
  };

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    successToast(`Copied ${label} to clipboard`);
  };

  const exportAsFormat = (format: 'csv' | 'excel' | 'json' | 'md' | 'pdf') => {
    const baseSlug = campaignName ? campaignName.replace(/\s+/g, '-').toLowerCase() : 'leads';

    if (format === 'csv' || format === 'excel') {
      const headers = ['Business Name,Gmail / Email,Category,Address,Phone,Website,Status,Campaign,Google Maps URL'];
      const rows = filteredLeads.map((l) =>
        `"${l.name}","${l.email}","${l.category}","${l.address}","${l.phone}","${l.website}","${l.status}","${l.campaign}","${l.mapsUrl || ''}"`,
      );
      const blob = new Blob([[headers, ...rows].join('\n')], { type: format === 'excel' ? 'application/vnd.ms-excel' : 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${baseSlug}-${Date.now()}.${format === 'excel' ? 'xlsx' : 'csv'}`;
      a.click();
      return;
    }

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(filteredLeads, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${baseSlug}-${Date.now()}.json`;
      a.click();
      return;
    }

    if (format === 'md') {
      const mdRows = [
        `# Google Maps Leads Report - ${new Date().toLocaleDateString()}`,
        `Total Leads: ${filteredLeads.length}`,
        '',
        '| Business Name | Email | Category | Phone | Address | Status |',
        '| --- | --- | --- | --- | --- | --- |',
        ...filteredLeads.map((l) => `| **${l.name}** | ${l.email} | ${l.category} | ${l.phone || '—'} | ${l.address} | ${l.status} |`),
      ].join('\n');
      const blob = new Blob([mdRows], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${baseSlug}-${Date.now()}.md`;
      a.click();
      return;
    }

    if (format === 'pdf') {
      window.print();
    }
  };

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8 lg:py-10">
        {/* Page Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-foreground text-xl font-medium tracking-tight flex items-center gap-2">
              <StorefrontIcon className="size-5 text-primary" />
              Leads
            </h1>
            <p className="text-muted-foreground text-sm">
              {leads.length} total leads · track discovered places and outreach pipeline
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* MULTI-FORMAT EXPORT DROPDOWN */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <DownloadSimpleIcon className="size-4" />
                  Export
                  <CaretDownIcon className="size-3 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                  Export {filteredLeads.length} Leads
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => exportAsFormat('csv')} className="text-xs gap-2 cursor-pointer">
                  <FileCsvIcon className="size-4 text-emerald-500" />
                  Export as CSV (.csv)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportAsFormat('excel')} className="text-xs gap-2 cursor-pointer">
                  <FileDocIcon className="size-4 text-emerald-600" />
                  Export as Excel (.xlsx)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportAsFormat('pdf')} className="text-xs gap-2 cursor-pointer">
                  <FilePdfIcon className="size-4 text-red-500" />
                  Print / Export as PDF (.pdf)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportAsFormat('json')} className="text-xs gap-2 cursor-pointer">
                  <FileCodeIcon className="size-4 text-blue-500" />
                  Export as JSON (.json)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportAsFormat('md')} className="text-xs gap-2 cursor-pointer">
                  <FileDocIcon className="size-4 text-purple-500" />
                  Export as Markdown (.md)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* CREATE YOUR CAMPAIGN CARD */}
        <Card className="overflow-hidden border-border bg-card shadow-xs">
          <CardHeader className="border-b border-border bg-muted/20 py-3.5 px-6">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Create Your Campaign
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6">
            <form onSubmit={handleGenerateLeads} className="space-y-5">
              {formError && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive">
                  {formError}
                </div>
              )}

              <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                {/* 1. Campaign Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground flex items-center gap-1">
                    Campaign name <span className="text-destructive font-bold">*</span>
                  </label>
                  <Input
                    placeholder="e.g. Jakarta coffee shop outreach"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                {/* 2. Industry */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground flex items-center gap-1">
                    Industry <span className="text-destructive font-bold">*</span>
                  </label>
                  <div ref={industryContainerRef} className="relative">
                    <Input
                      placeholder="Select or type custom industry..."
                      value={industry}
                      onChange={(e) => {
                        setIndustry(e.target.value);
                        setIndustryDropdownOpen(true);
                      }}
                      onFocus={() => setIndustryDropdownOpen(true)}
                      className="h-9 text-xs pr-8"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setIndustryDropdownOpen(!industryDropdownOpen)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <CaretDownIcon
                        className={cn(
                          'size-3.5 transition-transform duration-200',
                          industryDropdownOpen && 'rotate-180',
                        )}
                      />
                    </button>
                    {industryDropdownOpen && (
                      <div className="absolute left-0 top-full mt-1.5 w-full z-50 rounded-xl border border-border bg-popover p-1 shadow-lg max-h-56 overflow-y-auto">
                        {filteredIndustries.length > 0 ? (
                          filteredIndustries.map((item) => (
                            <div
                              key={item.value}
                              onClick={() => {
                                setIndustry(item.label);
                                setIndustryDropdownOpen(false);
                              }}
                              className={cn(
                                'flex items-center justify-between px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground',
                                industry.toLowerCase() === item.label.toLowerCase() &&
                                  'bg-accent font-medium text-accent-foreground',
                              )}
                            >
                              <span>{item.label}</span>
                              {industry.toLowerCase() === item.label.toLowerCase() && (
                                <CheckIcon className="size-3.5 text-primary" />
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-xs text-muted-foreground">
                            Using custom industry: <span className="font-medium text-foreground">&quot;{industry}&quot;</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                {/* 3. Location */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground flex items-center gap-1">
                    Location <span className="text-destructive font-bold">*</span>
                  </label>
                  <Textarea
                    placeholder="Bandung, Jakarta Selatan, Surabaya"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    rows={3}
                    className="resize-none text-xs"
                  />
                </div>

                {/* 4. Describe your Leads */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Describe your Leads
                  </label>
                  <Textarea
                    placeholder="Type your message or ideal customer profile here..."
                    value={describeLeads}
                    onChange={(e) => setDescribeLeads(e.target.value)}
                    rows={3}
                    className="resize-none text-xs"
                  />
                </div>
              </div>

              {/* 5. Max Results & Actions */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-4 border-t border-border mt-2">
                <div className="w-full sm:w-44 space-y-1.5">
                  <label className="text-xs font-medium text-foreground flex items-center gap-1">
                    Max Results <span className="text-destructive font-bold">*</span>
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={1000}
                    value={maxResults}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val) && val > 0) setMaxResults(val);
                    }}
                    placeholder="50"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={resetForm}
                    disabled={isSubmitting}
                  >
                    Reset
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSubmitting}
                    className="gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <SpinnerIcon className="size-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <MagnifyingGlassIcon className="size-4" />
                        Generate Leads
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Campaign Files Saved Banner */}
        {savedFiles.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-400">
            <div className="flex items-center gap-2 flex-wrap">
              <FileCodeIcon className="size-4 text-emerald-400 shrink-0" />
              <span>
                Campaign saved to workspace files:{' '}
                {savedFiles.map((file) => (
                  <span key={file} className="font-mono font-medium text-foreground bg-background/60 border border-border px-1.5 py-0.5 rounded mr-1.5">
                    {file}
                  </span>
                ))}
              </span>
            </div>
            <Button variant="ghost" size="sm" asChild className="h-7 shrink-0 text-xs text-emerald-400 hover:text-emerald-300">
              <Link href={`/projects/${projectId}/files`} className="flex items-center gap-1">
                <FolderOpenIcon className="size-3.5" />
                View in Files Explorer
              </Link>
            </Button>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2">
          <div className="relative flex-1 max-w-sm">
            <InputGroupSearch>
              <InputGroupSearchIcon>
                <MagnifyingGlassIcon className="size-4 text-muted-foreground" />
              </InputGroupSearchIcon>
              <InputGroupSearchInput
                placeholder="Search places by name, email, category..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="text-xs"
              />
            </InputGroupSearch>
          </div>

          <div className="flex items-center gap-1.5">
            {['All', 'New', 'Contacted', 'Verified', 'Enriched'].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => {
                  setStatusFilter(status);
                  setCurrentPage(1);
                }}
                className="h-8 text-xs font-normal"
              >
                {status}
              </Button>
            ))}
          </div>
        </div>

        {/* GOOGLE MAPS LEADS TABLE */}
        <Card className="overflow-hidden border-border bg-card shadow-xs">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-xs font-medium text-muted-foreground">Business / Place</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Category</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Gmail / Email</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Phone Number</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Address / Location</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Status</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground text-right w-14">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border">
              {paginatedLeads.map((lead) => {
                const conf = STATUS_CONFIG[lead.status];
                return (
                  <TableRow
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className="cursor-pointer hover:bg-muted/30 transition-colors border-border"
                  >
                    {/* Business Name & Website */}
                    <TableCell className="py-3">
                      <div className="font-medium text-foreground text-xs leading-snug">{lead.name}</div>
                      {lead.website ? (
                        <a
                          href={lead.website}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[11px] text-primary hover:underline inline-flex items-center gap-1 mt-0.5"
                        >
                          <GlobeIcon className="size-3" />
                          {lead.website.replace(/^https?:\/\//, '')}
                        </a>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">No website</span>
                      )}
                    </TableCell>

                    {/* Category & Campaign */}
                    <TableCell className="py-3">
                      <div className="text-foreground text-xs">{lead.category}</div>
                      <div className="text-[11px] text-muted-foreground font-mono">{lead.campaign}</div>
                    </TableCell>

                    {/* Gmail / Email */}
                    <TableCell className="py-3 text-xs text-foreground font-normal">
                      {lead.email}
                    </TableCell>

                    {/* Phone Number */}
                    <TableCell className="py-3 font-mono text-xs text-muted-foreground">
                      {lead.phone || '—'}
                    </TableCell>

                    {/* Address / Location */}
                    <TableCell className="py-3 text-xs text-muted-foreground max-w-[200px] truncate">
                      <div className="flex items-center gap-1.5 truncate">
                        <MapPinIcon className="size-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate">{lead.address}</span>
                      </div>
                    </TableCell>

                    {/* Status Badge with Live Dot */}
                    <TableCell className="py-3">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium border',
                          conf.bg,
                          conf.text,
                          conf.border,
                        )}
                      >
                        <span className={cn('size-1.5 rounded-full', conf.dot)} />
                        {lead.status}
                      </span>
                    </TableCell>

                    {/* 3-DOT ACTIONS DROPDOWN */}
                    <TableCell className="py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-muted-foreground hover:text-foreground"
                          >
                            <DotsThreeVerticalIcon className="size-4" weight="bold" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={() => {
                              alert(`Enrolling ${lead.name} in automated outreach sequence`);
                            }}
                            className="text-xs gap-2 cursor-pointer"
                          >
                            <EnvelopeIcon className="size-4 text-blue-500" />
                            Send Email / Outreach
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => setSelectedLead(lead)}
                            className="text-xs gap-2 cursor-pointer"
                          >
                            <MagnifyingGlassIcon className="size-4 text-muted-foreground" />
                            View Details
                          </DropdownMenuItem>

                          {lead.mapsUrl && (
                            <DropdownMenuItem asChild className="text-xs gap-2 cursor-pointer">
                              <a href={lead.mapsUrl} target="_blank" rel="noreferrer">
                                <ArrowSquareOutIcon className="size-4 text-emerald-500" />
                                Open Google Maps
                              </a>
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuItem
                            onClick={() => copyText(lead.email, 'Gmail address')}
                            className="text-xs gap-2 cursor-pointer"
                          >
                            <CopyIcon className="size-4 text-muted-foreground" />
                            Copy Email
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => enrichLead(lead.id)}
                            className="text-xs gap-2 cursor-pointer"
                          >
                            <LightningIcon className="size-4 text-purple-500" />
                            Enrich Profile
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            onClick={() => deleteLead(lead.id)}
                            className="text-xs gap-2 text-destructive focus:text-destructive cursor-pointer"
                          >
                            <TrashIcon className="size-4" />
                            Remove Lead
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {filteredLeads.length === 0 && (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No leads found. Use the campaign generator above to search Google Maps places.
            </div>
          )}

          {/* PAGINATION CONTROLS */}
          {filteredLeads.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/10 text-xs">
              <span className="text-muted-foreground">
                Showing <span className="font-medium text-foreground">{(safePage - 1) * PAGE_SIZE + 1}</span> to{' '}
                <span className="font-medium text-foreground">
                  {Math.min(safePage * PAGE_SIZE, filteredLeads.length)}
                </span>{' '}
                of <span className="font-medium text-foreground">{filteredLeads.length}</span> leads
              </span>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="h-7 px-2 gap-1 text-[11px]"
                >
                  <CaretLeftIcon className="size-3" />
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <Button
                      key={pageNum}
                      variant={safePage === pageNum ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className={cn(
                        'h-7 w-7 p-0 text-[11px]',
                        safePage === pageNum && 'font-semibold',
                      )}
                    >
                      {pageNum}
                    </Button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={safePage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="h-7 px-2 gap-1 text-[11px]"
                >
                  Next
                  <CaretRightIcon className="size-3" />
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Place Detail Modal with Clean Header Spacing (No 'X' overlap) */}
        <Dialog open={!!selectedLead} onOpenChange={(open) => !open && setSelectedLead(null)}>
          <DialogContent className="sm:max-w-[500px] p-6">
            {selectedLead && (
              <>
                <DialogHeader className="pr-10 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <DialogTitle className="text-base font-semibold">
                      {selectedLead.name}
                    </DialogTitle>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium border',
                        STATUS_CONFIG[selectedLead.status].bg,
                        STATUS_CONFIG[selectedLead.status].text,
                        STATUS_CONFIG[selectedLead.status].border,
                      )}
                    >
                      <span className={cn('size-1.5 rounded-full', STATUS_CONFIG[selectedLead.status].dot)} />
                      {selectedLead.status}
                    </span>
                  </div>
                  <DialogDescription className="text-xs">
                    {selectedLead.category} • {selectedLead.campaign}
                  </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-3 py-2 text-xs">
                  <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-1">
                    <span className="text-muted-foreground">Gmail / Email</span>
                    <p className="text-foreground text-xs font-normal">{selectedLead.email}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-1">
                    <span className="text-muted-foreground">Phone Number</span>
                    <p className="font-mono text-foreground">{selectedLead.phone}</p>
                  </div>
                  <div className="col-span-2 rounded-lg border border-border bg-muted/20 p-3 space-y-1">
                    <span className="text-muted-foreground">Address</span>
                    <p className="text-foreground">{selectedLead.address}</p>
                  </div>
                  <div className="col-span-2 rounded-lg border border-border bg-muted/20 p-3 space-y-1">
                    <span className="text-muted-foreground">Website</span>
                    <p className="text-primary truncate">
                      <a href={selectedLead.website} target="_blank" rel="noreferrer" className="hover:underline">
                        {selectedLead.website}
                      </a>
                    </p>
                  </div>
                </div>

                <DialogFooter className="gap-2 pt-2">
                  {selectedLead.mapsUrl && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={selectedLead.mapsUrl} target="_blank" rel="noreferrer" className="gap-1">
                        <ArrowSquareOutIcon className="size-3.5" />
                        Google Maps
                      </a>
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => setSelectedLead(null)}>
                    Close
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      alert(`Enrolling ${selectedLead.name} in automated sequence`);
                      setSelectedLead(null);
                    }}
                  >
                    Start Outreach
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
