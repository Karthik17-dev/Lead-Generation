import {
  ChartBarIcon as BarChart3,
  BuildingsIcon as Building2,
  GlobeIcon as Globe,
  PresentationIcon as Presentation,
  ScalesIcon as Scale,
  MagnifyingGlassIcon as Search,
  EnvelopeIcon as Mail,
  SparkleIcon as Sparkles,
  type Icon as LucideIcon,
} from '@phosphor-icons/react';

export interface StarterPrompt {
  id: string;
  label: string;
  prompt: string;
  icon: LucideIcon;
}

export const STARTER_PROMPTS: StarterPrompt[] = [
  {
    id: 'scrape-places',
    label: 'Scrape Jakarta Specialty Coffee',
    prompt: 'Extract 50 specialty coffee shops in Jakarta & Bandung with verified phone numbers, website, and Google ratings.',
    icon: Building2,
  },
  {
    id: 'b2b-saas',
    label: 'Find B2B SaaS Founders',
    prompt: 'Search 50 Series A/B tech startups in San Francisco with verified business emails and seniority classifications.',
    icon: Search,
  },
  {
    id: 'cold-outreach',
    label: 'Launch 3-Step Cold Outreach',
    prompt: 'Automate a 3-step personalized cold email sequence with positive reply detection and mailbox warmup.',
    icon: Mail,
  },
  {
    id: 'crm-sync',
    label: 'Sync Deals to HubSpot CRM',
    prompt: 'Enrich newly captured leads with Apollo intelligence and sync contact records into HubSpot & Salesforce.',
    icon: BarChart3,
  },
];

export const STARTER_PROMPTS_SHORT: StarterPrompt[] = STARTER_PROMPTS;
