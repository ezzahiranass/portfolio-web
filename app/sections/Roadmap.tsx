"use client";

import { useMemo, useState } from "react";
import experienceData from "../../public/data/experience.json";
import educationData from "../../public/data/education.json";

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

type RoadmapEntry = {
  title: string;
  subtitle: string;
  period: string;
  tag?: string;
  bullets: string[];
};

const fixText = (value: string) =>
  value
    .replace(/â€“/g, "–")
    .replace(/â€”/g, "—")
    .replace(/â€™/g, "’")
    .replace(/Ã©/g, "é")
    .replace(/Ã‰/g, "É")
    .replace(/Ã¨/g, "è")
    .replace(/Ãª/g, "ê")
    .replace(/Ã´/g, "ô")
    .replace(/Ã¼/g, "ü")
    .replace(/Ã±/g, "ñ");

export default function Roadmap() {
  const [activeTab, setActiveTab] = useState<"experience" | "education">(
    "experience"
  );
  const [expanded, setExpanded] = useState(false);

  const timelineItems = useMemo<RoadmapEntry[]>(() => {
    if (activeTab === "experience") {
      return (experienceData as RoadmapExperienceItem[]).map((item) => ({
        title: fixText(item.role),
        subtitle: fixText(item.organization),
        period: fixText(item.period),
        tag: item.type ? fixText(item.type) : undefined,
        bullets: item.responsibilities.map(fixText),
      }));
    }

    return (educationData as RoadmapEducationItem[]).map((item) => ({
      title: fixText(item.degree),
      subtitle: fixText(item.institution),
      period: fixText(item.period),
      tag: fixText(item.location),
      bullets: item.details.map(fixText),
    }));
  }, [activeTab]);

  const visibleItems = expanded ? timelineItems : timelineItems.slice(0, 3);
  const hasOverflow = timelineItems.length > 3;

  return (
    <section id="roadmap" className="section">
      <div className="container">
        <div className="section-heading">
          <div>
            <p className="eyebrow mono">Experience / Education</p>
            <h2 className="title">Architecture, research, and tooling.</h2>
          </div>
          <p className="subtitle">
            A timeline spanning architectural practice, computational research,
            and software development.
          </p>
        </div>
        <div className="roadmap-tabs">
          <button
            className={`tab-btn${activeTab === "experience" ? " tab-btn--active" : ""}`}
            type="button"
            onClick={() => {
              setExpanded(false);
              setActiveTab("experience");
            }}
          >
            Experience
          </button>
          <button
            className={`tab-btn${activeTab === "education" ? " tab-btn--active" : ""}`}
            type="button"
            onClick={() => {
              setExpanded(false);
              setActiveTab("education");
            }}
          >
            Education
          </button>
        </div>
        <div className="timeline roadmap-list">
          {visibleItems.map((item) => (
            <div
              key={`${item.title}-${item.period}`}
              className="timeline-item roadmap-card"
            >
              <div className="roadmap-meta">
                <div>
                  <p className="mono">{item.period}</p>
                  <h3>{item.title}</h3>
                  <p className="subtitle">{item.subtitle}</p>
                  {item.tag ? (
                    <span className="pill mono roadmap-tag">{item.tag}</span>
                  ) : null}
                </div>
              </div>
              <ul className="roadmap-bullets">
                {item.bullets.map((bullet) => (
                  <li key={`${item.title}-${bullet}`}>
                    <span className="roadmap-dot" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {!expanded && hasOverflow ? <div className="roadmap-fade" /> : null}
        </div>
        {hasOverflow ? (
          <button
            className="roadmap-toggle"
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
          >
            {expanded ? "Show Less" : "Show More"}
          </button>
        ) : null}
      </div>
    </section>
  );
}
