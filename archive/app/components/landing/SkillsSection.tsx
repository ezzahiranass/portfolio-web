'use client';

import { useState } from 'react';
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

  return (
    <div className="flex flex-col gap-8">
      <SkillsCarousel
        skills={skills}
        selectedId={selectedId}
        onSelect={(skill) => setSelectedId(skill.id)}
      />
    </div>
  );
}
