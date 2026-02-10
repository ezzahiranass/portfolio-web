"use client";

import ParticleGrid from "../components/ParticleGrid";
import { assetPath } from "../lib/assetPath";
import Image from "next/image"

export default function Hero() {
  return (
    <section id="hero" className="hero">
      
      <ParticleGrid className="hero-shell">
        <div className="hero-overlay-grid" aria-hidden="true" />
        <div className="relative w-full h-full">
        <Image
            alt="Paper border"
            className="pointer-events-none absolute left-0 right-0 top-[100px] z-30 w-full select-none"
            height={120}
            unoptimized
            src={assetPath("/images/paper-border.png")}
            width={2400}
          />
        </div>
        <div className="container hero-grid">
          <div className="hero-content">
            <span className="eyebrow mono">Design Technology</span>
            <h1 className="hero-title">
              Computational architecture, crafted for real-world impact.
            </h1>
            <p className="hero-copy">
              Architecture, parametric systems, and custom tooling for spatial
              workflows. From generative studies to production-ready drawings,
              the focus is on clarity, performance, and buildability.
            </p>
            <div className="hero-actions">
              <button className="btn btn--primary" type="button">
                View Projects
              </button>
              <button className="btn" type="button">
                See Tooling
              </button>
            </div>
          </div>
          <div className="hero-panel">
            <span className="panel-chip mono">CURRENT STUDY</span>
            <div>
              <h3 className="title">Parametric Facade Lab</h3>
              <p className="subtitle">
                Performance-driven skins, daylight analysis, and material
                rationalization.
              </p>
            </div>
            <div className="panel-metrics">
              <div className="metric">
                <h4>18</h4>
                <p className="mono">Built Projects</p>
              </div>
              <div className="metric">
                <h4>42</h4>
                <p className="mono">Design Scripts</p>
              </div>
              <div className="metric">
                <h4>09</h4>
                <p className="mono">Research Labs</p>
              </div>
              <div className="metric">
                <h4>4.8</h4>
                <p className="mono">Client Score</p>
              </div>
            </div>
          </div>
        </div>
      </ParticleGrid>
    </section>
  );
}
