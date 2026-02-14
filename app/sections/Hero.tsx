"use client";

import ParticleGrid from "../components/ParticleGrid";
import HeroCubeViewer from "../components/viewers/HeroCubeViewer";

export default function Hero() {
  return (
    <section id="hero" className="hero">
      <ParticleGrid className="hero-shell">
        <div className="hero-overlay-grid" aria-hidden="true" />
        <div className="container hero-grid">
        <HeroCubeViewer />
          <div className="hero-content">
            <span className="eyebrow mono">PORTFOLIO</span>
            <h1 className="hero-title">
              Design Through Technology.
            </h1>
            <p className="hero-copy">
              Computational Architecture, Crafted for Real World Impact.
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
        </div>
      </ParticleGrid>
    </section>
  );
}
