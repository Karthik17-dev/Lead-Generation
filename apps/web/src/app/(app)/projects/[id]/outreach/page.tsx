'use client';

import React, { useState } from 'react';
import {
  PaperPlaneTiltIcon,
  PlayIcon,
  PauseIcon,
  PlusIcon,
  ClockIcon,
  ChartLineUpIcon,
  CheckCircleIcon,
  EnvelopeIcon,
  SparkleIcon,
  UserCheckIcon,
} from '@phosphor-icons/react';

interface Campaign {
  id: string;
  name: string;
  status: 'Active' | 'Paused' | 'Draft' | 'Completed';
  sent: number;
  opened: number;
  replied: number;
  positiveReplies: number;
  templateSubject: string;
  nextStep: string;
}

const INITIAL_CAMPAIGNS: Campaign[] = [
  {
    id: 'camp-1',
    name: 'B2B SaaS Founder AI Outreach (SF)',
    status: 'Active',
    sent: 142,
    opened: 98,
    replied: 31,
    positiveReplies: 14,
    templateSubject: 'Quick question regarding {{company}} AI infrastructure',
    nextStep: 'Follow-up step 2 sending in 4h',
  },
  {
    id: 'camp-2',
    name: 'Jakarta Specialty Coffee Scraper Sequence',
    status: 'Active',
    sent: 85,
    opened: 64,
    replied: 22,
    positiveReplies: 9,
    templateSubject: 'Partnership inquiry for {{company}}',
    nextStep: 'Step 1 actively delivering',
  },
  {
    id: 'camp-3',
    name: 'Enterprise Tech VP Sequence',
    status: 'Paused',
    sent: 210,
    opened: 130,
    replied: 45,
    positiveReplies: 18,
    templateSubject: 'Automating developer workflows at {{company}}',
    nextStep: 'Paused for list replenishment',
  },
];

export default function OutreachPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(INITIAL_CAMPAIGNS);
  const [activeTab, setActiveTab] = useState<'campaigns' | 'templates' | 'warmup'>('campaigns');

  const totalSent = campaigns.reduce((acc, c) => acc + c.sent, 0);
  const totalOpened = campaigns.reduce((acc, c) => acc + c.opened, 0);
  const totalReplied = campaigns.reduce((acc, c) => acc + c.replied, 0);
  const totalPositive = campaigns.reduce((acc, c) => acc + c.positiveReplies, 0);

  const openRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0;
  const replyRate = totalSent > 0 ? Math.round((totalReplied / totalSent) * 100) : 0;

  return (
    <div className="flex flex-1 flex-col overflow-y-auto p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
            <PaperPlaneTiltIcon className="size-6 text-blue-400" />
            Outreach Campaigns
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage multi-step automated email outreach sequences, positive reply detection, and mailbox deliverability.
          </p>
        </div>

        <button
          onClick={() => {
            const newCamp: Campaign = {
              id: `camp-${Date.now()}`,
              name: 'New Automated Sequence',
              status: 'Draft',
              sent: 0,
              opened: 0,
              replied: 0,
              positiveReplies: 0,
              templateSubject: 'Re: Collaboration with {{company}}',
              nextStep: 'Drafting initial step',
            };
            setCampaigns([newCamp, ...campaigns]);
          }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
        >
          <PlusIcon className="size-4" />
          Create Sequence
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Delivered</span>
            <EnvelopeIcon className="size-4 text-muted-foreground" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-foreground">{totalSent}</p>
          <span className="text-xs text-muted-foreground mt-1 inline-block">Across active mailboxes</span>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Open Rate</span>
            <ChartLineUpIcon className="size-4 text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-foreground">{openRate}%</p>
          <span className="text-xs text-emerald-400 mt-1 inline-block">{totalOpened} emails opened</span>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Reply Rate</span>
            <UserCheckIcon className="size-4 text-blue-400" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-foreground">{replyRate}%</p>
          <span className="text-xs text-blue-400 mt-1 inline-block">{totalReplied} responses</span>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Positive Sentiment</span>
            <SparkleIcon className="size-4 text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-emerald-400">{totalPositive}</p>
          <span className="text-xs text-muted-foreground mt-1 inline-block">Interested meetings booked</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border/50 pb-2 text-sm font-medium">
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`px-3 py-1.5 rounded-md transition-colors ${
            activeTab === 'campaigns'
              ? 'bg-muted text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Active Sequences ({campaigns.length})
        </button>
        <button
          onClick={() => setActiveTab('warmup')}
          className={`px-3 py-1.5 rounded-md transition-colors ${
            activeTab === 'warmup'
              ? 'bg-muted text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Mailbox Deliverability & Warmup
        </button>
      </div>

      {/* Sequences List */}
      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          {campaigns.map((c) => (
            <div
              key={c.id}
              className="rounded-xl border border-border/50 bg-card p-5 shadow-sm space-y-4 hover:border-border/80 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-semibold text-base text-foreground">{c.name}</h3>
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium border ${
                        c.status === 'Active'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : c.status === 'Paused'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-muted text-muted-foreground border-border/40'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Subject: <span className="font-mono text-foreground">{c.templateSubject}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setCampaigns(
                        campaigns.map((camp) =>
                          camp.id === c.id
                            ? { ...camp, status: camp.status === 'Active' ? 'Paused' : 'Active' }
                            : camp,
                        ),
                      );
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-border/60 bg-muted/20 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/50 transition-colors"
                  >
                    {c.status === 'Active' ? (
                      <>
                        <PauseIcon className="size-3.5" /> Pause
                      </>
                    ) : (
                      <>
                        <PlayIcon className="size-3.5" /> Resume
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 border-t border-border/30 pt-3 text-xs">
                <div>
                  <span className="text-muted-foreground">Sent</span>
                  <p className="font-semibold text-sm text-foreground mt-0.5">{c.sent}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Open Rate</span>
                  <p className="font-semibold text-sm text-foreground mt-0.5">
                    {c.sent > 0 ? Math.round((c.opened / c.sent) * 100) : 0}%
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Replies</span>
                  <p className="font-semibold text-sm text-foreground mt-0.5">{c.replied}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Positive</span>
                  <p className="font-semibold text-sm text-emerald-400 mt-0.5">{c.positiveReplies}</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/20 pt-2">
                <div className="flex items-center gap-1.5">
                  <ClockIcon className="size-3.5 text-blue-400" />
                  <span>{c.nextStep}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Warmup View */}
      {activeTab === 'warmup' && (
        <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Active Mailbox Pool</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Automated ramp-up schedule protecting domain reputation and ensuring 99%+ primary inbox placement.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-border/60 bg-muted/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm text-foreground">sales@kortix-leads.com</span>
                <span className="rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 text-xs">
                  Health: 99%
                </span>
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Daily Warmup Volume</span>
                  <span className="text-foreground font-mono">45 / 50</span>
                </div>
                <div className="flex justify-between">
                  <span>SPF / DKIM / DMARC</span>
                  <span className="text-emerald-400">All Passed</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border/60 bg-muted/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm text-foreground">founder@kortix-outreach.io</span>
                <span className="rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 text-xs">
                  Health: 97%
                </span>
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Daily Warmup Volume</span>
                  <span className="text-foreground font-mono">35 / 40</span>
                </div>
                <div className="flex justify-between">
                  <span>SPF / DKIM / DMARC</span>
                  <span className="text-emerald-400">All Passed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
