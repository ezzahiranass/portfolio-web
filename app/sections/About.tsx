import ParticleGrid from "../components/ParticleGrid";
import { assetPath } from "../lib/assetPath";

export default function About() {
  return (
    <section id="about" className="section about-section">
      <img
        alt=""
        className="paper-border paper-border--about"
        src={assetPath("/images/paper-border.png")}
      />
      <ParticleGrid className="about-shell">
        <div className="hero-overlay-grid" aria-hidden="true" />
        
        <div className="container about-content">
          <div className="section-heading">
            <div>
              <p className="eyebrow mono">About</p>
              <h2 className="title">Architecture with a computational core.</h2>
            </div>
            <p className="subtitle">
              A practice that blends spatial design, computation, and production
              tooling.
            </p>
          </div>
          <div className="about-grid">
            <div className="about-copy">
              <p>
                I design architectural systems that translate cleanly from
                concept to construction. My focus is on computational design,
                parametric workflows, and the tooling that keeps projects
                precise and scalable.
              </p>
              <p>
                The portfolio is organized around built work, research studies,
                and automation projects that accelerate modeling, visualization,
                and documentation.
              </p>
            </div>
            <div className="about-aside">
              <span className="pill mono">Based in Casablanca</span>
              <span className="pill mono">Architecture + Tech</span>
              <span className="pill mono">Remote + Onsite</span>
              <div>
                <h3 className="title">Focus Areas</h3>
                <p className="subtitle">
                  Parametric systems, facade studies, automation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </ParticleGrid>
    </section>
  );
}
