'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import SkillsCarousel from './SkillsCarousel';
import skillsData from '../../../public/data/skills.json';

type Skill = {
  id: string;
  title: string;
  description: string;
  details: string[];
  image: string | null;
};

export default function SkillsSection() {
  const skills = skillsData as Skill[];
  const [selectedId, setSelectedId] = useState<string | null>(
    skills[0]?.id ?? null
  );

  const selectedSkill = useMemo(
    () => skills.find((skill) => skill.id === selectedId) ?? skills[0],
    [selectedId, skills]
  );

  return (
    <div className="flex flex-col gap-8">
      <SkillsCarousel
        skills={skills}
        selectedId={selectedId}
        onSelect={(skill) => setSelectedId(skill.id)}
      />
      {selectedSkill ? (
        <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-[0_20px_50px_-40px_rgba(0,0,0,0.5)] md:grid md:grid-cols-2">
          <div className="relative aspect-square bg-[var(--surface-strong)] md:aspect-auto md:h-full">
            {selectedSkill.image ? (
              <Image
                src={selectedSkill.image}
                alt={`${selectedSkill.title} thumbnail`}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-xs font-bold uppercase text-[var(--muted)]">
                Thumbnail
              </div>
            )}
            <div className="pointer-events-none absolute inset-y-0 right-0 w-2/3 bg-[linear-gradient(to_left,_var(--surface),_transparent)]" />
          </div>
          <div className="flex flex-col justify-between gap-4 p-6">
            <div>
              <h3 className="text-2xl font-semibold">{selectedSkill.title}</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">
                {selectedSkill.description}
              </p>
            </div>
            <ul className="space-y-2 text-sm text-[var(--muted)]">
              {selectedSkill.details.map((detail) => (
                <li key={detail} className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--foreground)]/40" />
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}
