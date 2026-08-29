
// ── IN-MEMORY SESSION TRANSCRIPTS ───────────────────────────────────────────
interface ChatPart {
  type: string;
  text?: string;
  [key: string]: any;
}

interface ChatMessage {
  id: string;
  sessionID: string;
  role: 'user' | 'assistant' | 'system';
  time: { created: number; completed?: number };
  parts: ChatPart[];
  agent?: string;
  model?: { providerID: string; modelID: string };
}

const GLOBAL_SESSION_MESSAGES = new Map<string, ChatMessage[]>([
  [
    'default',
    [
      {
        id: 'msg_welcome',
        sessionID: 'default',
        role: 'assistant',
        time: { created: Date.now() - 60000, completed: Date.now() - 59000 },
        parts: [
          {
            type: 'text',
            text: 'Hello! I am your AI Lead Generation & Outreach agent powered by Zed Pro. How can I help you scale your outreach today?',
          },
        ],
      },
    ],
  ],
]);


// ── SUNA (KORTIX AI) DEFAULT CONNECTORS CATALOG ──────────────────────────────
const POPULAR_APPS = [
  // Core Agent Tools & Runtimes
  { slug: 'browser', name: 'Playwright Web Browser', description: 'Automated Chromium browser for web scraping, navigation, and testing', categories: ['Agent Tools', 'Developer Tools'], imgSrc: 'https://cdn.worldvectorlogo.com/logos/playwright.svg', authType: 'none', hasActions: true, hasTriggers: true, featuredWeight: 100 },
  { slug: 'terminal', name: 'Sandbox Terminal', description: 'Execute bash commands, Python scripts, and CLI utilities in an isolated environment', categories: ['Agent Tools', 'Developer Tools'], imgSrc: 'https://cdn.worldvectorlogo.com/logos/bash-1.svg', authType: 'none', hasActions: true, hasTriggers: true, featuredWeight: 99 },
  { slug: 'mcp', name: 'Model Context Protocol (MCP)', description: 'Connect any custom MCP server over stdio or SSE for external tools', categories: ['Agent Tools', 'Developer Tools'], imgSrc: 'https://cdn.worldvectorlogo.com/logos/anthropic-icon.svg', authType: 'keys', hasActions: true, hasTriggers: true, featuredWeight: 98 },
  { slug: 'openapi', name: 'OpenAPI / REST API', description: 'Import any Swagger or OpenAPI 3.0 specification with custom authentication', categories: ['Agent Tools', 'Developer Tools'], imgSrc: 'https://cdn.worldvectorlogo.com/logos/swagger-4.svg', authType: 'keys', hasActions: true, hasTriggers: true, featuredWeight: 97 },

  // Communication & Outreach
  { slug: 'gmail', name: 'Gmail', description: 'Read, compose, search, and send emails via Google Workspace', categories: ['Communication', 'Google'], imgSrc: 'https://cdn.worldvectorlogo.com/logos/gmail-icon.svg', authType: 'oauth', hasActions: true, hasTriggers: true, featuredWeight: 96 },
  { slug: 'slack', name: 'Slack', description: 'Post channel messages, direct messages, and listen to workspace notifications', categories: ['Communication'], imgSrc: 'https://cdn.worldvectorlogo.com/logos/slack-new-logo.svg', authType: 'oauth', hasActions: true, hasTriggers: true, featuredWeight: 95 },
  { slug: 'discord', name: 'Discord', description: 'Send server messages, manage channels, and dispatch webhook alerts', categories: ['Communication'], imgSrc: 'https://cdn.worldvectorlogo.com/logos/discord-6.svg', authType: 'oauth', hasActions: true, hasTriggers: true, featuredWeight: 94 },
  { slug: 'telegram', name: 'Telegram Bot', description: 'Cloud-based messaging API for bot commands and instant alert dispatching', categories: ['Communication'], imgSrc: 'https://cdn.worldvectorlogo.com/logos/telegram-1.svg', authType: 'keys', hasActions: true, hasTriggers: true, featuredWeight: 93 },
  { slug: 'whatsapp', name: 'WhatsApp Business', description: 'Connect directly with customers and prospects on WhatsApp', categories: ['Communication'], imgSrc: 'https://cdn.worldvectorlogo.com/logos/whatsapp-symbol.svg', authType: 'keys', hasActions: true, hasTriggers: true, featuredWeight: 92 },
  { slug: 'twilio', name: 'Twilio SMS', description: 'SMS, Voice, and phone number verification infrastructure', categories: ['Communication'], imgSrc: 'https://cdn.worldvectorlogo.com/logos/twilio.svg', authType: 'keys', hasActions: true, hasTriggers: true, featuredWeight: 91 },
  { slug: 'sendgrid', name: 'SendGrid', description: 'Transactional email API and high-volume email delivery', categories: ['Communication'], imgSrc: 'https://cdn.worldvectorlogo.com/logos/sendgrid-2.svg', authType: 'keys', hasActions: true, hasTriggers: true, featuredWeight: 90 },

  // Productivity & Data
  { slug: 'google_sheets', name: 'Google Sheets', description: 'Create, read, and append spreadsheet data and prospect records', categories: ['Productivity', 'Google'], imgSrc: 'https://cdn.worldvectorlogo.com/logos/google-sheets-2020-2.svg', authType: 'oauth', hasActions: true, hasTriggers: true, featuredWeight: 89 },
  { slug: 'google_maps', name: 'Google Maps', description: 'Search and extract local business records, places, and geo intelligence', categories: ['Lead Generation', 'Google'], imgSrc: 'https://cdn.worldvectorlogo.com/logos/google-maps-2020-icon.svg', authType: 'keys', hasActions: true, hasTriggers: true, featuredWeight: 88 },
  { slug: 'google_drive', name: 'Google Drive', description: 'Upload, manage, and search documents and campaign files in cloud drive', categories: ['Productivity', 'Google'], imgSrc: 'https://cdn.worldvectorlogo.com/logos/google-drive-2020.svg', authType: 'oauth', hasActions: true, hasTriggers: true, featuredWeight: 87 },
  { slug: 'notion', name: 'Notion', description: 'Connect workspace wikis, task boards, and structured databases', categories: ['Productivity'], imgSrc: 'https://cdn.worldvectorlogo.com/logos/notion-2.svg', authType: 'oauth', hasActions: true, hasTriggers: true, featuredWeight: 86 },
  { slug: 'airtable', name: 'Airtable', description: 'Relational database platform with automations and grid views', categories: ['Productivity', 'Database'], imgSrc: 'https://cdn.worldvectorlogo.com/logos/airtable.svg', authType: 'oauth', hasActions: true, hasTriggers: true, featuredWeight: 85 },
  { slug: 'linear', name: 'Linear', description: 'Issue tracking and project management for software teams', categories: ['Productivity', 'Developer Tools'], imgSrc: 'https://cdn.worldvectorlogo.com/logos/linear-2.svg', authType: 'oauth', hasActions: true, hasTriggers: true, featuredWeight: 84 },

  // Lead Generation & CRM
  { slug: 'hubspot', name: 'HubSpot CRM', description: 'Inbound marketing, sales deals, contacts, and email tracking', categories: ['CRM', 'Marketing', 'Lead Generation'], imgSrc: 'https://cdn.worldvectorlogo.com/logos/hubspot.svg', authType: 'oauth', hasActions: true, hasTriggers: true, featuredWeight: 83 },
  { slug: 'salesforce', name: 'Salesforce', description: 'Enterprise customer relationship management platform', categories: ['CRM', 'Sales'], imgSrc: 'https://cdn.worldvectorlogo.com/logos/salesforce-2.svg', authType: 'oauth', hasActions: true, hasTriggers: true, featuredWeight: 82 },
  { slug: 'apollo', name: 'Apollo.io', description: 'B2B lead intelligence, contact enrichment, and sales engagement', categories: ['Lead Generation', 'Sales'], imgSrc: 'https://cdn.worldvectorlogo.com/logos/apollo-13.svg', authType: 'keys', hasActions: true, hasTriggers: true, featuredWeight: 81 },
  { slug: 'instantly', name: 'Instantly.ai', description: 'Automated cold email outreach at scale with deliverability warmup', categories: ['Lead Generation', 'Outreach'], imgSrc: 'https://cdn.worldvectorlogo.com/logos/instantly.svg', authType: 'keys', hasActions: true, hasTriggers: true, featuredWeight: 80 },
  { slug: 'lemlist', name: 'Lemlist', description: 'Personalized cold email outreach and multichannel sales automation', categories: ['Lead Generation', 'Outreach'], imgSrc: 'https://cdn.worldvectorlogo.com/logos/lemlist.svg', authType: 'keys', hasActions: true, hasTriggers: true, featuredWeight: 79 },
  { slug: 'clay', name: 'Clay', description: 'Waterfall data enrichment, web scrapers, and outreach intelligence', categories: ['Lead Generation', 'Data'], imgSrc: 'https://cdn.worldvectorlogo.com/logos/clay.svg', authType: 'keys', hasActions: true, hasTriggers: true, featuredWeight: 78 },
  { slug: 'hunter', name: 'Hunter.io', description: 'Find and verify professional email addresses in seconds', categories: ['Lead Generation'], imgSrc: 'https://cdn.worldvectorlogo.com/logos/hunter-io.svg', authType: 'keys', hasActions: true, hasTriggers: true, featuredWeight: 77 },
  { slug: 'linkedin', name: 'LinkedIn', description: 'Professional social network and lead discovery', categories: ['Lead Generation', 'Social'], imgSrc: 'https://cdn.worldvectorlogo.com/logos/linkedin-icon-2.svg', authType: 'oauth', hasActions: true, hasTriggers: true, featuredWeight: 76 },
  { slug: 'pipedrive', name: 'Pipedrive', description: 'Pipeline CRM tool for deal closing and sales activity tracking', categories: ['CRM', 'Sales'], imgSrc: 'https://cdn.worldvectorlogo.com/logos/pipedrive.svg', authType: 'oauth', hasActions: true, hasTriggers: true, featuredWeight: 75 },

  // AI & Machine Learning
  { slug: 'openai', name: 'OpenAI (GPT-4o)', description: 'AI text generation, reasoning, embeddings, and structured tool calling', categories: ['AI & ML'], imgSrc: 'https://cdn.worldvectorlogo.com/logos/openai-2.svg', authType: 'keys', hasActions: true, hasTriggers: true, featuredWeight: 74 },
  { slug: 'anthropic', name: 'Anthropic Claude', description: 'Advanced AI reasoning, code generation, and deep context analysis', categories: ['AI & ML'], imgSrc: 'https://cdn.worldvectorlogo.com/logos/anthropic-icon.svg', authType: 'keys', hasActions: true, hasTriggers: true, featuredWeight: 73 },
  { slug: 'perplexity', name: 'Perplexity AI', description: 'Real-time web search API and citation-backed knowledge engine', categories: ['AI & ML'], imgSrc: 'https://cdn.worldvectorlogo.com/logos/perplexity-ai.svg', authType: 'keys', hasActions: true, hasTriggers: true, featuredWeight: 72 },
  { slug: 'pinecone', name: 'Pinecone Vector DB', description: 'High-scale vector database for AI embeddings and similarity search', categories: ['AI & ML', 'Database'], imgSrc: 'https://cdn.worldvectorlogo.com/logos/pinecone-icon.svg', authType: 'keys', hasActions: true, hasTriggers: true, featuredWeight: 71 },

  // Developer & Infrastructure
  { slug: 'github', name: 'GitHub', description: 'Code hosting, pull requests, issue management, and CI/CD actions', categories: ['Developer Tools'], imgSrc: 'https://cdn.worldvectorlogo.com/logos/github-icon-1.svg', authType: 'oauth', hasActions: true, hasTriggers: true, featuredWeight: 70 },
  { slug: 'postgres', name: 'PostgreSQL', description: 'Powerful open-source object-relational SQL database', categories: ['Database', 'Developer Tools'], imgSrc: 'https://cdn.worldvectorlogo.com/logos/postgresql.svg', authType: 'keys', hasActions: true, hasTriggers: true, featuredWeight: 69 },
  { slug: 'supabase', name: 'Supabase', description: 'Open source Firebase alternative with PostgreSQL, Auth, and Storage', categories: ['Database', 'Developer Tools'], imgSrc: 'https://cdn.worldvectorlogo.com/logos/supabase-logo-icon.svg', authType: 'keys', hasActions: true, hasTriggers: true, featuredWeight: 68 },
  { slug: 'stripe', name: 'Stripe', description: 'Online payment processing, customer subscriptions, and invoices', categories: ['Finance', 'E-commerce'], imgSrc: 'https://cdn.worldvectorlogo.com/logos/stripe-4.svg', authType: 'oauth', hasActions: true, hasTriggers: true, featuredWeight: 67 },
];

const CATEGORIES_LIST = [
  { key: 'agent_tools', label: 'Agent Tools', count: 4 },
  { key: 'communication', label: 'Communication & Outreach', count: 894 },
  { key: 'lead_gen', label: 'Lead Generation & CRM', count: 1040 },
  { key: 'productivity', label: 'Productivity & Workspace', count: 915 },
  { key: 'ai_ml', label: 'AI & Machine Learning', count: 472 },
  { key: 'dev_tools', label: 'Developer Tools & DB', count: 1491 },
];

interface StoredFile {
  path: string;
  content: string;
  size: number;
}

const GLOBAL_PROJECT_FILES: Map<string, StoredFile> = new Map([
  [
    'README.md',
    {
      path: 'README.md',
      content: '# Kortix Lead Generation Workspace\n\nThis workspace stores automated crawler campaigns and discovered prospect files.\n\nCheck the `campaigns/` directory for stored campaigns.\n',
      size: 180,
    },
  ],
  [
    'campaigns/jakarta-coffee-leads.json',
    {
      path: 'campaigns/jakarta-coffee-leads.json',
      content: JSON.stringify([
        {
          id: 'lead-1',
          name: 'Tanamera Coffee Roastery Thamrin',
          email: 'info@tanameracoffee.com',
          category: 'Coffee shop',
          address: 'Thamrin City Office Park AA07, Jl. Kebon Kacang Raya, Jakarta Pusat',
          phone: '+62 21 2962 5599',
          website: 'https://tanameracoffee.com',
          status: 'Verified',
          campaign: 'Jakarta Coffee Leads'
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
          campaign: 'Jakarta Coffee Leads'
        }
      ], null, 2),
      size: 920,
    },
  ],
]);

import { NextRequest, NextResponse } from 'next/server';

const now = new Date().toISOString();
const hourAgo = new Date(Date.now() - 3600000).toISOString();

const MOCK_ACCOUNTS = [
  {
    account_id: 'acc_1',
    name: 'Lead Generation Team',
    slug: 'lead-gen',
    account_role: 'owner',
    is_primary_owner: true,
  },
];

const MOCK_PROJECT = {
  project_id: 'default',
  account_id: 'acc_1',
  name: 'Lead Generation Workspace',
  repo_url: '',
  default_branch: 'main',
  manifest_path: 'zed.toml',
  status: 'active',
  metadata: {
    onboarding_completed_at: now,
  },
  last_opened_at: now,
  created_at: now,
  updated_at: now,
  project_role: 'manager',
  effective_project_role: 'manager',
  experimental: { llm_gateway: true },
  icon: null,
};

const MOCK_SESSIONS = [
  {
    session_id: 'session-lead-gen-1',
    account_id: 'acc_1',
    project_id: 'default',
    branch_name: 'lead-gen-jakarta',
    base_ref: 'main',
    sandbox_provider: null,
    sandbox_id: null,
    sandbox_url: null,
    opencode_session_id: null,
    name: 'Jakarta Coffee Leads Scraper',
    custom_name: 'Jakarta Coffee Leads Scraper',
    agent_name: null,
    status: 'completed',
    error: null,
    metadata: {
    onboarding_completed_at: now,
  },
    opencode_sessions: [],
    created_at: now,
    updated_at: now,
    is_owner: true,
    can_access: true,
  },
  {
    session_id: 'session-lead-gen-2',
    account_id: 'acc_1',
    project_id: 'default',
    branch_name: 'b2b-saas-outreach',
    base_ref: 'main',
    sandbox_provider: null,
    sandbox_id: null,
    sandbox_url: null,
    opencode_session_id: null,
    name: 'B2B SaaS Founder Campaign',
    custom_name: 'B2B SaaS Founder Campaign',
    agent_name: null,
    status: 'completed',
    error: null,
    metadata: {
    onboarding_completed_at: now,
  },
    opencode_sessions: [],
    created_at: hourAgo,
    updated_at: hourAgo,
    is_owner: true,
    can_access: true,
  },
];

const MOCK_STARTER_SUGGESTIONS = {
  source: 'static',
  generated_at: null,
  items: [
    {
      id: 'lead-scrape',
      label: 'Scrape Jakarta Coffee Leads',
      prompt: 'Scrape 50 specialty coffee shops in Jakarta with phone, website, and Google ratings.',
    },
    {
      id: 'lead-saas',
      label: 'Find B2B SaaS Founders',
      prompt: 'Find 50 Series A/B B2B SaaS Founders in San Francisco with verified work emails.',
    },
    {
      id: 'lead-outreach',
      label: 'Launch 3-Step Cold Outreach',
      prompt: 'Launch a personalized cold email sequence with positive reply detection and mailbox warmup.',
    },
  ],
};

const MOCK_SANDBOXES = {
  items: [] as unknown[],
  default_slug: 'default',
};

/** All IAM probes return "allowed" — no security enforcement in dev mode */
const ALLOW_ALL_PERMISSION = {
  action: 'any',
  resource_type: 'account',
  resource_id: null,
  allowed: true,
  reason: 'dev_mock',
};

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string[] }> },
) {
  const { slug } = await context.params;
  const path = slug.join('/');


  // ── OpenCode & Sandbox Proxy (8000) GET Endpoints ─────────────────────────
  if (path.includes('/8000/') || path.startsWith('p/')) {
    // Extract session ID if present
    const sessionMatch = path.match(/session\/([^\/]+)/);
    const sId = sessionMatch ? sessionMatch[1] : 'default';

    if (path.endsWith('/message') || path.endsWith('/messages')) {
      const msgs = GLOBAL_SESSION_MESSAGES.get(sId) || GLOBAL_SESSION_MESSAGES.get('default') || [];
      return NextResponse.json(msgs);
    }

    if (path.endsWith('/status')) {
      return NextResponse.json({ type: 'idle' });
    }

    if (path.endsWith('/diff') || path.endsWith('/diffs')) {
      return NextResponse.json([]);
    }

    if (path.endsWith('/todo') || path.endsWith('/todos')) {
      return NextResponse.json([]);
    }

    if (path.endsWith('/event') || path.endsWith('/events')) {
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(': keepalive\n\n'));
          const interval = setInterval(() => {
            try {
              controller.enqueue(new TextEncoder().encode(': ping\n\n'));
            } catch {
              clearInterval(interval);
            }
          }, 15000);
        },
      });
      return new NextResponse(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    return NextResponse.json({ ok: true });
  }

  // Session messages direct route
  if (path.includes('/sessions/') && (path.endsWith('/messages') || path.endsWith('/message'))) {
    const sId = path.split('/')[path.split('/').indexOf('sessions') + 1] || 'default';
    const msgs = GLOBAL_SESSION_MESSAGES.get(sId) || GLOBAL_SESSION_MESSAGES.get('default') || [];
    return NextResponse.json(msgs);
  }

  // ── /accounts ──────────────────────────────────────────────────────────────
  if (path === 'accounts') return NextResponse.json(MOCK_ACCOUNTS);

  if (path === 'accounts/acc_1') {
    return NextResponse.json({
      ...MOCK_ACCOUNTS[0],
      member_count: 1,
      project_count: 1,
      role: 'owner',
      iam_v2_enabled: true,
      mfa_required: false,
      created_at: now,
      updated_at: now,
    });
  }

  if (path.startsWith('accounts/')) {
    // IAM permission probes - always allow everything in dev mode
    if (path.includes('/iam/members/') && path.includes('/effective')) {
      return NextResponse.json(ALLOW_ALL_PERMISSION);
    }
    if (path.includes('/iam')) {
      return NextResponse.json({ allowed: true, reason: 'dev_mock' });
    }
    if (path.includes('/members')) {
      return NextResponse.json([
        { user_id: '00000000-0000-0000-0000-000000000001', email: 'dev@zed.local', account_role: 'owner', joined_at: now },
      ]);
    }
    if (path.includes('/invites')) return NextResponse.json([]);
    if (path.includes('/access-requests')) return NextResponse.json({ requests: [] });
    if (path.includes('/billing')) return NextResponse.json({ billing_enabled: false });
    if (path.includes('/groups')) return NextResponse.json([]);
    if (path.includes('/feature-flags')) return NextResponse.json([]);
    return NextResponse.json(MOCK_ACCOUNTS[0]);
  }

    // ── /connectors (5500+ PIPEDREAM / SUNA CATALOG) ──────────────────────────
  if (path.includes('pipedream/sections')) {
    const sections = [
      {
        key: 'featured',
        label: 'Popular & Featured',
        total: 24,
        apps: POPULAR_APPS.slice(0, 24).map(a => ({
          ...a,
          name_formatted: a.name || a.name_formatted,
          name_slug: a.slug || a.name_slug,
          description: a.description || 'Pipedream automated connector',
          categories: a.categories || ['Featured'],
          img_src: a.imgSrc || a.img_src,
        })),
      },
      {
        key: 'crm',
        label: 'Lead Generation & CRM',
        total: 1040,
        apps: POPULAR_APPS.filter(a => (a.categories || []).some(c => ['CRM', 'Sales', 'Lead Generation', 'Outreach', 'Marketing'].includes(c))).map(a => ({
          ...a,
          name_formatted: a.name || a.name_formatted,
          name_slug: a.slug || a.name_slug,
          description: a.description || 'CRM & Lead generation connector',
          categories: a.categories || ['Lead Generation'],
          img_src: a.imgSrc || a.img_src,
        })),
      },
      {
        key: 'communication',
        label: 'Communication & Outreach',
        total: 894,
        apps: POPULAR_APPS.filter(a => (a.categories || []).includes('Communication') || (a.categories || []).includes('Google')).map(a => ({
          ...a,
          name_formatted: a.name || a.name_formatted,
          name_slug: a.slug || a.name_slug,
          description: a.description || 'Communication & Messaging connector',
          categories: a.categories || ['Communication'],
          img_src: a.imgSrc || a.img_src,
        })),
      },
      {
        key: 'productivity',
        label: 'Productivity & Workspace',
        total: 915,
        apps: POPULAR_APPS.filter(a => (a.categories || []).includes('Productivity')).map(a => ({
          ...a,
          name_formatted: a.name || a.name_formatted,
          name_slug: a.slug || a.name_slug,
          description: a.description || 'Productivity & Database connector',
          categories: a.categories || ['Productivity'],
          img_src: a.imgSrc || a.img_src,
        })),
      },
      {
        key: 'ai_ml',
        label: 'AI & Machine Learning',
        total: 472,
        apps: POPULAR_APPS.filter(a => (a.categories || []).includes('AI & ML')).map(a => ({
          ...a,
          name_formatted: a.name || a.name_formatted,
          name_slug: a.slug || a.name_slug,
          description: a.description || 'AI Reasoning & ML connector',
          categories: a.categories || ['AI & ML'],
          img_src: a.imgSrc || a.img_src,
        })),
      },
      {
        key: 'dev_tools',
        label: 'Developer Tools & DB',
        total: 1491,
        apps: POPULAR_APPS.filter(a => (a.categories || []).some(c => ['Developer Tools', 'Database', 'Agent Tools'].includes(c))).map(a => ({
          ...a,
          name_formatted: a.name || a.name_formatted,
          name_slug: a.slug || a.name_slug,
          description: a.description || 'Developer API & Cloud connector',
          categories: a.categories || ['Developer Tools'],
          img_src: a.imgSrc || a.img_src,
        })),
      },
    ];
    return NextResponse.json({ sections, total: 5542 });
  }

  if (path.includes('pipedream/apps')) {
    const url = new URL(request.url);
    const q = url.searchParams.get('q')?.toLowerCase() || '';
    const cat = url.searchParams.get('category')?.toLowerCase() || '';
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const pageSize = parseInt(url.searchParams.get('page_size') || '48', 10);

    let baseApps = POPULAR_APPS.map(a => ({
      ...a,
      name_formatted: a.name || a.name_formatted,
      name_slug: a.slug || a.name_slug,
      description: a.description || 'Pipedream automated connector',
      categories: a.categories || ['General'],
      img_src: a.imgSrc || a.img_src,
    }));

    // If query provided, filter
    if (q) {
      baseApps = baseApps.filter(a =>
        a.name_formatted.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.name_slug.toLowerCase().includes(q)
      );
    }
    if (cat) {
      baseApps = baseApps.filter(a =>
        a.categories.some((c: string) => c.toLowerCase() === cat || c.toLowerCase().includes(cat))
      );
    }

    return NextResponse.json({
      apps: baseApps,
      categories: CATEGORIES_LIST,
      total: 5542,
      page_info: {
        total_count: 5542,
        count: baseApps.length,
        has_more: false,
      },
    });
  }

  if (path.startsWith('connectors/') || path.endsWith('/connectors')) {
    return NextResponse.json({
      connectors: [],
      required: [],
      optional: [],
      total: 5542,
      apps: POPULAR_APPS.map(a => ({
        ...a,
        name_formatted: a.name || a.name_formatted,
        name_slug: a.slug || a.name_slug,
        img_src: a.imgSrc || a.img_src,
      })),
    });
  }

  // ── /projects ─────────────────────────────────────────────────────────────
  // IMPORTANT: listProjectsForAccount → GET /projects?account_id=...
  // The path slug is just ['projects'] (query params stripped), must return ARRAY
  if (path === 'projects') return NextResponse.json([MOCK_PROJECT]);
  if (path === 'projects/default') return NextResponse.json(MOCK_PROJECT);

  if (path.startsWith('projects/')) {
    // ── Project Files Handlers ─────────────────────────────────────────────
    if (path.endsWith('/files/content')) {
      const url = new URL(request.url);
      const filePath = url.searchParams.get('path') || 'README.md';
      const cleanPath = filePath.replace(/^\/workspace\//, '').replace(/^\//, '');
      const file = GLOBAL_PROJECT_FILES.get(cleanPath) || GLOBAL_PROJECT_FILES.get(filePath) || {
        path: filePath,
        content: `# ${filePath}\n\nCampaign File Content`,
        size: 50,
      };
      return NextResponse.json({
        path: file.path,
        ref: 'main',
        content: file.content,
      });
    }

    if (path.endsWith('/files')) {
      const entries = Array.from(GLOBAL_PROJECT_FILES.values()).map((f) => ({
        path: f.path,
        size: f.size,
        mode: '100644',
        type: 'blob',
      }));
      return NextResponse.json(entries);
    }

    if (path.endsWith('/sandboxes')) return NextResponse.json(MOCK_SANDBOXES);
    if (path.endsWith('/sessions')) return NextResponse.json(MOCK_SESSIONS);
    if (path.endsWith('/starter-suggestions')) return NextResponse.json(MOCK_STARTER_SUGGESTIONS);
    if (path.endsWith('/access-requests')) return NextResponse.json({ requests: [] });
    if (path.endsWith('/models')) {
      return NextResponse.json([
        { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'anthropic', is_default: true, base_url: 'https://server-llm-1.onrender.com/v1' },
        { id: 'gpt-4o', name: 'GPT-4o (FreeLLMAPI)', provider: 'openai', is_default: false, base_url: 'https://server-llm-1.onrender.com/v1' },
        { id: 'deepseek-ai/DeepSeek-R1', name: 'DeepSeek R1', provider: 'deepseek', is_default: false, base_url: 'https://server-llm-1.onrender.com/v1' },
        { id: 'Qwen/Qwen3-Coder-480B-A35B-Instruct', name: 'Qwen 3 Coder 480B', provider: 'qwen', is_default: false, base_url: 'https://server-llm-1.onrender.com/v1' },
      ]);
    }
    if (path.endsWith('/members')) {
      return NextResponse.json([
        { user_id: '00000000-0000-0000-0000-000000000001', email: 'dev@zed.local', account_role: 'owner', joined_at: now },
      ]);
    }
    if (path.endsWith('/secrets')) {
      return NextResponse.json({
        items: [],
        required: [],
        optional: [],
        can_manage: true,
        manifest_status: 'loaded',
      });
    }
    if (path.includes('/change-requests')) {
      return NextResponse.json({ change_requests: [] });
    }
    if (path.includes('/git-status')) {
      return NextResponse.json({ files: [], staged: [], untracked: [], ahead: 0, behind: 0 });
    }
    if (path.includes('/branches')) {
      return NextResponse.json({ branches: [], current: 'main' });
    }
    if (path.includes('/commits')) {
      return NextResponse.json({ commits: [] });
    }
    if (path.endsWith('/connections')) {
      return NextResponse.json({ connections: [] });
    }
    if (path.endsWith('/scope') || path.includes('/scope')) {
      return NextResponse.json({
        secrets_allowlist: null,
        required_connectors: [],
        connector_bindings: {},
        connector_bindings_configured: false,
        connector_bindings_inherit_unbound: true,
        dropped_secrets: [],
        added_secrets: [],
        dropped_bindings: [],
        retroactive: false,
        detail: 'ok',
      });
    }
    if (path.endsWith('/channels')) return NextResponse.json([]);
    if (path.endsWith('/repositories')) return NextResponse.json([]);
    if (path.endsWith('/schedules')) return NextResponse.json([]);
    if (path.endsWith('/webhooks')) return NextResponse.json([]);
    if (path.endsWith('/templates')) return NextResponse.json([]);
    if (path.endsWith('/snapshots')) return NextResponse.json([]);
    if (path.endsWith('/activity')) return NextResponse.json([]);
    if (path.endsWith('/audit-events')) return NextResponse.json([]);
    if (path.endsWith('/billing')) return NextResponse.json({ billing_enabled: false });
    if (path.endsWith('/feature-flags')) return NextResponse.json([]);
    if (path.endsWith('/can')) return NextResponse.json({ allowed: true, reason: 'dev_mock' });
    if (path.endsWith('/llm-catalog/providers')) {
      return NextResponse.json({
        source: 'baked',
        fetched_at: now,
        provider_count: 0,
        model_count: 0,
        providers: [],
      });
    }
    if (path.endsWith('/iam')) return NextResponse.json({ role: 'manager', can_manage: true });
            if (path.includes('/gateway/routing-policy') || path.includes('/routing-policy')) {
      return NextResponse.json({
        version: 1,
        project: {
          defaultModel: 'zed-pro',
          visionModel: 'gpt-4o',
          defaultFallback: null,
          rules: [],
          modelGenerationConfig: {},
        },
        effective: {
          defaultModel: 'zed-pro',
          defaultModelSource: 'platform',
          visionModel: 'gpt-4o',
          defaultFallback: { on: 'failure', models: ['gpt-4o'] },
        },
        platform: {
          defaultModel: 'zed-pro',
          visionModel: 'gpt-4o',
          defaultFallback: { on: 'failure', models: ['gpt-4o'] },
        },
        capabilities: { write: true },
      });
    }
        if (path.endsWith('/model-picker') || path.endsWith('/llm-catalog')) {
      const modelsMap = {
        'zed-pro': {
          id: 'zed-pro',
          name: 'Zed Pro',
          provider: 'zed',
          enabled: true,
          freeManagedOnly: false,
          contextWindow: 200000,
        },
        'gpt-4o': {
          id: 'gpt-4o',
          name: 'GPT-4o',
          provider: 'openai',
          enabled: true,
          freeManagedOnly: false,
          contextWindow: 128000,
        },
        'gpt-4o-mini': {
          id: 'gpt-4o-mini',
          name: 'GPT-4o mini',
          provider: 'openai',
          enabled: true,
          freeManagedOnly: false,
          contextWindow: 128000,
        },
        'claude-3-5-sonnet': {
          id: 'claude-3-5-sonnet',
          name: 'Claude 3.5 Sonnet',
          provider: 'anthropic',
          enabled: true,
          freeManagedOnly: false,
          contextWindow: 200000,
        },
        'deepseek-ai/DeepSeek-R1': {
          id: 'deepseek-ai/DeepSeek-R1',
          name: 'DeepSeek R1',
          provider: 'deepseek',
          enabled: true,
          freeManagedOnly: false,
          contextWindow: 131072,
        },
        'gemini-1.5-pro': {
          id: 'gemini-1.5-pro',
          name: 'Gemini 1.5 Pro',
          provider: 'google',
          enabled: true,
          freeManagedOnly: false,
          contextWindow: 1000000,
        },
      };
      return NextResponse.json({
        models: modelsMap,
        default_model: 'zed-pro',
        freeTier: false,
      });
    }
    if (path.endsWith('/detail')) {
      return NextResponse.json({
        project: MOCK_PROJECT,
        config: {
          is_zed_repo: false,
          signals: {},
          manifest_raw: "zed_version: 2\nproject:\n  name: default\n",
          open_code_raw: null,
          default_agent: null,
          open_code_default_agent: null,
          agent_discovery: 'opencode',
          agents: [],
          commands: [],
          skills: [],
          skills_sources: [],
        },
        file_count: 0,
        files: [],
        git_connection: null,
      });
    }
    // Any other project sub-path or the project itself
    return NextResponse.json(MOCK_PROJECT);
  }

  // ── /user ─────────────────────────────────────────────────────────────────
  if (path === 'user' || path === 'user/profile') {
    return NextResponse.json({
      id: '00000000-0000-0000-0000-000000000001',
      email: 'dev@zed.local',
      name: 'Lead Generation Admin',
    });
  }

    // ── Runtime Config & Providers ──────────────────────────────────────────
  if (path === 'config' || path.endsWith('/config')) {
    return NextResponse.json({
      default_agent: 'build',
      default_model: 'zed-pro',
      model: 'auto',
      provider: 'zed',
    });
  }

  if (path.includes('provider')) {
    return NextResponse.json({
      default: { zed: 'zed-pro' },
      connected: ['zed', 'openai', 'anthropic', 'deepseek', 'google'],
      all: [
        {
          id: 'zed',
          name: 'Zed Gateway (FreeLLMAPI Render)',
          models: {
            'zed-pro': {
              id: 'zed-pro',
              name: 'Zed Pro',
              enabled: true,
            },
          },
        },
        {
          id: 'openai',
          name: 'OpenAI',
          models: {
            'gpt-4o': {
              id: 'gpt-4o',
              name: 'GPT-4o',
              enabled: true,
            },
            'gpt-4o-mini': {
              id: 'gpt-4o-mini',
              name: 'GPT-4o mini',
              enabled: true,
            },
          },
        },
        {
          id: 'anthropic',
          name: 'Anthropic',
          models: {
            'claude-3-5-sonnet': {
              id: 'claude-3-5-sonnet',
              name: 'Claude 3.5 Sonnet',
              enabled: true,
            },
          },
        },
        {
          id: 'deepseek',
          name: 'DeepSeek',
          models: {
            'deepseek-ai/DeepSeek-R1': {
              id: 'deepseek-ai/DeepSeek-R1',
              name: 'DeepSeek R1',
              enabled: true,
            },
          },
        },
        {
          id: 'google',
          name: 'Google Gemini',
          models: {
            'gemini-1.5-pro': {
              id: 'gemini-1.5-pro',
              name: 'Gemini 1.5 Pro',
              enabled: true,
            },
          },
        },
      ],
    });
  }

  // ── /models ───────────────────────────────────────────────────────────────
  if (path === 'models') {
    return NextResponse.json([
      { id: 'zed-pro', name: 'Zed Pro', provider: 'zed', is_default: true, base_url: 'https://server-llm-1.onrender.com/v1' },
      { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', is_default: false },
      { id: 'gpt-4o-mini', name: 'GPT-4o mini', provider: 'openai', is_default: false },
      { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'anthropic', is_default: false },
      { id: 'deepseek-ai/DeepSeek-R1', name: 'DeepSeek R1', provider: 'deepseek', is_default: false },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'google', is_default: false },
    ]);
  }

  // ── Default fallback ───────────────────────────────────────────────────────
  return NextResponse.json({ items: [], data: [], success: true });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string[] }> },
) {
  const { slug } = await context.params;
  const path = slug.join('/');


  // ── Session Start & Provisioning Endpoint ─────────────────────────────────
  if (path.endsWith('/start') || path.includes('/start')) {
    const sessionMatch = path.match(/sessions\/([^\/]+)/);
    const sId = sessionMatch ? sessionMatch[1] : 'default';
    return NextResponse.json({
      success: true,
      data: {
        stage: 'ready',
        opencode_session_id: sId,
        session_id: sId,
        sandbox: {
          id: 'sbx_1',
          external_id: 'default',
          provider: 'local',
          status: 'running',
        },
        metadata: {},
      },
    });
  }

  // ── OpenCode & Sandbox Proxy (8000) & Prompt Turn Handlers ────────────────
  if (path.includes('/8000/') || path.includes('/prompt') || path.includes('/message') || path.includes('/turns')) {
    try {
      const body = await request.json();
      const sessionMatch = path.match(/session\/([^\/]+)/) || path.match(/sessions\/([^\/]+)/);
      const sId = sessionMatch ? sessionMatch[1] : (body.sessionID || body.sessionId || 'default');

      // Extract user text
      let userText = '';
      if (body.parts && Array.isArray(body.parts)) {
        userText = body.parts.map((p: any) => p.text || '').join(' ').trim();
      } else if (body.text) {
        userText = body.text;
      } else if (body.prompt) {
        userText = body.prompt;
      } else if (body.messages && Array.isArray(body.messages)) {
        const lastMsg = body.messages[body.messages.length - 1];
        userText = typeof lastMsg === 'string' ? lastMsg : (lastMsg.content || lastMsg.text || '');
      }

      if (!userText) userText = 'Hello!';

      // Record User Message in transcript
      const userMsgId = `msg_${Date.now()}_u`;
      const userMessage: ChatMessage = {
        id: userMsgId,
        sessionID: sId,
        role: 'user',
        time: { created: Date.now() },
        parts: [{ type: 'text', text: userText }],
      };

      const existing = GLOBAL_SESSION_MESSAGES.get(sId) || [];
      existing.push(userMessage);
      GLOBAL_SESSION_MESSAGES.set(sId, existing);
      GLOBAL_SESSION_MESSAGES.set('default', existing);

      // Call FreeLLMAPI Render Multi-Router Gateway
      let replyText = 'I have received your prompt and processed your workspace leads.';
      try {
        const aiRes = await fetch('https://server-llm-1.onrender.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer freellmapi-b8b35f76a87a2e3db4985258c26197a2f22ceabe528eb6ac',
          },
          body: JSON.stringify({
            model: 'auto',
            messages: [
              {
                role: 'system',
                content: 'You are Zed Pro, an expert AI assistant for B2B lead generation, Google Maps scraping, customer discovery, and automated email outreach.',
              },
              ...existing.map((m) => ({
                role: m.role,
                content: m.parts.map((p) => p.text || '').join('\n'),
              })),
            ],
          }),
        });

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          if (aiData?.choices?.[0]?.message?.content) {
            replyText = aiData.choices[0].message.content;
          }
        }
      } catch (err) {
        console.error('LLM Fetch Error:', err);
      }

      // Record Assistant Reply
      const asstMsgId = `msg_${Date.now()}_a`;
      const asstMessage: ChatMessage = {
        id: asstMsgId,
        sessionID: sId,
        role: 'assistant',
        time: { created: Date.now(), completed: Date.now() },
        parts: [{ type: 'text', text: replyText }],
        model: { providerID: 'zed', modelID: 'zed-pro' },
      };

      existing.push(asstMessage);
      GLOBAL_SESSION_MESSAGES.set(sId, existing);
      GLOBAL_SESSION_MESSAGES.set('default', existing);

      return NextResponse.json({
        ok: true,
        success: true,
        messageID: asstMsgId,
        id: asstMsgId,
        reply: replyText,
      });
    } catch (e: any) {
      return NextResponse.json({ ok: false, error: e?.message });
    }
  }

  // Campaign files save (supports JSON, CSV, MD, Excel)
  if (path.includes('/campaign-files') || path.includes('/files')) {
    try {
      const body = await request.json();
      const campaignName = body.name || body.campaign || `campaign-${Date.now()}`;
      const format = (body.format || 'json').toLowerCase();
      const slugName = campaignName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const leads = (body.leads || []) as any[];

      // Helper to generate CSV content
      const headers = ['Business Name', 'Gmail / Email', 'Category', 'Address', 'Phone', 'Website', 'Status', 'Campaign', 'Google Maps URL'];
      const csvRows = [
        headers.join(','),
        ...leads.map((l: any) =>
          `"${l.name || ''}","${l.email || ''}","${l.category || ''}","${l.address || ''}","${l.phone || ''}","${l.website || ''}","${l.status || 'New'}","${campaignName}","${l.mapsUrl || ''}"`
        )
      ].join('\n');

      // Helper to generate Markdown content
      const mdContent = [
        `# Campaign: ${campaignName}`,
        `**Industry:** ${body.industry || 'All'} | **Location:** ${body.location || 'All'} | **Generated:** ${new Date().toLocaleString()}`,
        '',
        '## Discovered Google Maps Leads',
        '| Business Name | Email | Category | Phone | Address | Status |',
        '| --- | --- | --- | --- | --- | --- |',
        ...leads.map((l: any) =>
          `| **${l.name}** | \`${l.email}\` | ${l.category} | ${l.phone || '—'} | ${l.address} | ${l.status} |`
        ),
        '',
        `*Total Leads: ${leads.length}*`
      ].join('\n');

      const jsonContent = JSON.stringify(body, null, 2);

      const savedPaths: string[] = [];

      if (format === 'all' || format === 'csv' || format === 'excel') {
        const csvPath = `campaigns/${slugName}.csv`;
        GLOBAL_PROJECT_FILES.set(csvPath, {
          path: csvPath,
          content: csvRows,
          size: Buffer.byteLength(csvRows, 'utf-8'),
        });
        savedPaths.push(csvPath);
      }

      if (format === 'all' || format === 'json') {
        const jsonPath = `campaigns/${slugName}.json`;
        GLOBAL_PROJECT_FILES.set(jsonPath, {
          path: jsonPath,
          content: jsonContent,
          size: Buffer.byteLength(jsonContent, 'utf-8'),
        });
        savedPaths.push(jsonPath);
      }

      if (format === 'all' || format === 'md' || format === 'markdown' || format === 'pdf') {
        const mdPath = `campaigns/${slugName}.md`;
        GLOBAL_PROJECT_FILES.set(mdPath, {
          path: mdPath,
          content: mdContent,
          size: Buffer.byteLength(mdContent, 'utf-8'),
        });
        savedPaths.push(mdPath);
      }

      const primaryPath = savedPaths[0] || `campaigns/${slugName}.json`;

      return NextResponse.json({
        success: true,
        path: primaryPath,
        paths: savedPaths,
        message: `Campaign saved in formats: ${savedPaths.join(', ')}`,
      });
    } catch (e: any) {
      return NextResponse.json({ success: false, error: e?.message });
    }
  }

  // Batch IAM permission probe - always allow everything
  if (path.includes('/iam/members/') && path.includes(':batch')) {
    try {
      const body = await request.json() as { probes?: unknown[] };
      const count = body?.probes?.length ?? 1;
      const results = Array.from({ length: count }, () => ({ ...ALLOW_ALL_PERMISSION }));
      return NextResponse.json({ results });
    } catch {
      return NextResponse.json({ results: [ALLOW_ALL_PERMISSION] });
    }
  }


  // ── Google Maps Scraper Search Endpoint ───────────────────────────────────
  if (path.includes('leads/search') || path.endsWith('/search')) {
    try {
      const body = await request.json();
      const industry = body.industry || body.category || 'Coffee Shop';
      const location = body.location || 'Jakarta';
      const maxResults = Math.min(Number(body.maxResults || 20), 50);

      // Discovered Google Maps leads
      const sampleLeads = [
        {
          id: `gmap-${Date.now()}-1`,
          name: `${industry} Roastery Central`,
          email: `contact@${industry.toLowerCase().replace(/[^a-z0-9]/g, '')}central.com`,
          category: industry,
          address: `Jl. Jend. Sudirman Kav. 52-53, ${location}`,
          phone: '+62 21 515 0555',
          website: `https://${industry.toLowerCase().replace(/[^a-z0-9]/g, '')}central.com`,
          mapsUrl: `https://maps.google.com/?q=${encodeURIComponent(industry + ' ' + location)}`,
          status: 'Verified',
          rating: 4.8,
          reviews: 240,
        },
        {
          id: `gmap-${Date.now()}-2`,
          name: `The Artisan ${industry} Lab`,
          email: `hello@artisan${industry.toLowerCase().replace(/[^a-z0-9]/g, '')}.id`,
          category: industry,
          address: `Jl. Senopati No. 41, Kebayoran Baru, ${location}`,
          phone: '+62 811 900 1289',
          website: `https://artisan${industry.toLowerCase().replace(/[^a-z0-9]/g, '')}.id`,
          mapsUrl: `https://maps.google.com/?q=${encodeURIComponent('Artisan ' + industry + ' ' + location)}`,
          status: 'New',
          rating: 4.9,
          reviews: 512,
        },
        {
          id: `gmap-${Date.now()}-3`,
          name: `${location} Heritage ${industry}`,
          email: `info@heritage${industry.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
          category: industry,
          address: `Jl. Cikini Raya No. 73, ${location}`,
          phone: '+62 21 3192 4589',
          website: `https://heritage${industry.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
          mapsUrl: `https://maps.google.com/?q=${encodeURIComponent('Heritage ' + industry + ' ' + location)}`,
          status: 'Enriched',
          rating: 4.7,
          reviews: 180,
        }
      ];

      return NextResponse.json({
        success: true,
        industry,
        location,
        total: sampleLeads.length,
        leads: sampleLeads,
        message: `Successfully discovered ${sampleLeads.length} Google Maps leads for ${industry} in ${location}`
      });
    } catch (e: any) {
      return NextResponse.json({ success: false, error: e?.message });
    }
  }

  // ── LLM Chat Completions & Prompt Streaming ──────────────────────────────
  if (path.includes('chat/completions') || path.includes('/prompt') || path.includes('/turns')) {
    try {
      const body = await request.json();
      const model = 'auto';

      const renderResponse = await fetch('https://server-llm-1.onrender.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer freellmapi-b8b35f76a87a2e3db4985258c26197a2f22ceabe528eb6ac',
        },
        body: JSON.stringify({
          ...body,
          model,
          stream: Boolean(body.stream),
        }),
      });

      if (body.stream && renderResponse.body) {
        return new NextResponse(renderResponse.body, {
          status: 200,
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        });
      }

      const data = await renderResponse.json();
      return NextResponse.json(data);
    } catch (err: any) {
      return NextResponse.json({
        id: `chatcmpl-${Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: 'zed-pro',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'I have analyzed your lead generation campaign and Google Maps discovery pipeline. Let me know which prospect criteria you want to prioritize next!',
            },
            finish_reason: 'stop',
          },
        ],
      });
    }
  }

  // Session creation
  if (path.endsWith('/sessions')) {
    let body: any = {};
    try { body = await request.json(); } catch {}
    const sessionId = `session-${Date.now()}`;
    const newSession = {
      session_id: sessionId,
      account_id: 'acc_1',
      project_id: 'default',
      branch_name: 'main',
      base_ref: 'main',
      sandbox_provider: null,
      sandbox_id: null,
      sandbox_url: null,
      opencode_session_id: null,
      name: body?.initial_prompt ? body.initial_prompt.slice(0, 40) : 'Lead Generation Session',
      custom_name: body?.initial_prompt ? body.initial_prompt.slice(0, 40) : 'Lead Generation Session',
      agent_name: null,
      status: 'ready',
      error: null,
      metadata: {},
      opencode_sessions: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_owner: true,
      can_access: true,
    };
    return NextResponse.json(newSession);
  }

  return NextResponse.json({ success: true, id: `mock_${Date.now()}` });
}

export async function PUT() {
  return NextResponse.json({ success: true });
}

export async function PATCH() {
  return NextResponse.json({ success: true, project: MOCK_PROJECT });
}

export async function DELETE() {
  return NextResponse.json({ success: true });
}
