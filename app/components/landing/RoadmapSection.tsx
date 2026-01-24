'use client';

import { useMemo, useState } from 'react';
import { BookOpen, Briefcase, CalendarDays } from 'lucide-react';

type RoadmapExperienceItem = {
  role: string;
  type?: string;
  period: string;
  organization: string;
  responsibilities: string[];
};

type RoadmapEducationItem = {
  degree: string;
  period: string;
  institution: string;
  location: string;
  details: string[];
};

type RoadmapData = {
  experience: RoadmapExperienceItem[];
  education: RoadmapEducationItem[];
};

type RoadmapEntry = {
  title: string;
  subtitle: string;
  period: string;
  tag?: string;
  bullets: string[];
  months: number;
  icon: 'experience' | 'education';
};

const monthMap: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

const parseMonthYear = (value: string): Date | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.toLowerCase() === 'present') {
    return new Date();
  }

  const parts = trimmed.split(' ');
  if (parts.length === 1) {
    const year = Number(parts[0]);
    if (!Number.isNaN(year)) {
      return new Date(year, 0, 1);
    }
  }

  if (parts.length >= 2) {
    const monthKey = parts[0].slice(0, 3).toLowerCase();
    const month = monthMap[monthKey];
    const year = Number(parts[1]);
    if (month !== undefined && !Number.isNaN(year)) {
      return new Date(year, month, 1);
    }
  }

  return null;
};

const parsePeriod = (period: string) => {
  const normalized = period.replace('–', '-').replace('—', '-');
  const [startRaw, endRaw] = normalized.split('-').map((part) => part.trim());
  const startDate = parseMonthYear(startRaw);
  const endDate = parseMonthYear(endRaw || startRaw);
  return { startDate, endDate };
};

const diffInMonths = (start: Date, end: Date) => {
  const years = end.getFullYear() - start.getFullYear();
  const months = end.getMonth() - start.getMonth();
  const total = years * 12 + months;
  return Math.max(total + 1, 1);
};

export default function RoadmapSection({ data }: { data: RoadmapData }) {
  const [activeTab, setActiveTab] = useState<'experience' | 'education'>(
    'experience'
  );
  const [expanded, setExpanded] = useState(false);

  const timelineItems = useMemo<RoadmapEntry[]>(() => {
    if (activeTab === 'experience') {
      return data.experience.map((item) => {
        const { startDate, endDate } = parsePeriod(item.period);
        const months =
          startDate && endDate ? diffInMonths(startDate, endDate) : 1;
        return {
          title: item.role,
          subtitle: item.organization,
          period: item.period,
          tag: item.type,
          bullets: item.responsibilities,
          months,
          icon: 'experience',
        };
      });
    }

    return data.education.map((item) => {
      const { startDate, endDate } = parsePeriod(item.period);
      const months =
        startDate && endDate ? diffInMonths(startDate, endDate) : 1;
      return {
        title: item.degree,
        subtitle: item.institution,
        period: item.period,
        tag: item.location,
        bullets: item.details,
        months,
        icon: 'education',
      };
    });
  }, [activeTab, data.education, data.experience]);

  const maxMonths = useMemo(() => {
    return timelineItems.reduce((max, item) => Math.max(max, item.months), 1);
  }, [timelineItems]);

  const visibleItems = expanded ? timelineItems : timelineItems.slice(0, 3);
  const hasOverflow = timelineItems.length > 3;

  return (
    <div className="relative">
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveTab('experience')}
            className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-widest transition-colors ${
              activeTab === 'experience'
                ? 'border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]'
                : 'border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-strong)]'
            }`}
          >
            Experience
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('education')}
            className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-widest transition-colors ${
              activeTab === 'education'
                ? 'border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]'
                : 'border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-strong)]'
            }`}
          >
            Education
          </button>
        </div>
      </div>

      <div className="relative mt-8">
        <div className="absolute left-3 top-0 h-full w-px bg-[var(--border)]" />
        <div className="space-y-8">
          {visibleItems.map((item, index) => {
            const connectorHeight = Math.round(
              48 + (item.months / maxMonths) * 96
            );
            const isLast = index === visibleItems.length - 1;
            const Icon = item.icon === 'experience' ? Briefcase : BookOpen;

            return (
              <div
                key={`${item.title}-${item.subtitle}-${item.period}`}
                className="relative"
              >
                <div className="absolute left-0 top-2 flex flex-col items-center">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] shadow-sm">
                    <Icon className="h-3.5 w-3.5 text-[var(--muted)]" />
                  </div>
                  {!isLast ? (
                    <div
                      className="w-px bg-[var(--border)]"
                      style={{ height: connectorHeight }}
                    />
                  ) : null}
                </div>
                <div className="ml-12 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_18px_45px_-40px_rgba(0,0,0,0.4)] transition-transform duration-300 hover:-translate-y-1">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--muted)]">
                        {item.subtitle}
                      </div>
                      <h3 className="mt-3 text-xl font-semibold">
                        {item.title}
                      </h3>
                      {item.tag ? (
                        <span className="mt-2 inline-flex rounded-full border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[var(--foreground)]">
                          {item.tag}
                        </span>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--muted)]">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {item.period}
                    </div>
                  </div>
                  <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                    {item.bullets.map((bullet) => (
                      <li
                        key={`${item.title}-${bullet}`}
                        className="flex gap-2"
                      >
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--foreground)]/40" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
        {!expanded && hasOverflow ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-[linear-gradient(to_top,_var(--background),_transparent)]" />
        ) : null}
      </div>
      {hasOverflow ? (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
          >
            {expanded ? 'Show Less' : 'Show More'}
          </button>
        </div>
      ) : null}
    </div>
  );
}
