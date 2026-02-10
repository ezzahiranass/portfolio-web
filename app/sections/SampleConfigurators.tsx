const configurators = [
  {
    title: "Facade Mixer",
    description: "Dial perforation, shading, and material logic.",
    options: ["Perforation +2", "Shading On", "Panel Depth"],
  },
  {
    title: "Parametric Layout",
    description: "Switch between linear, courtyard, and cluster systems.",
    options: ["Linear", "Courtyard", "Cluster"],
  },
  {
    title: "Diagram Scale",
    description: "Adjust hierarchy for plans, sections, or narratives.",
    options: ["Plans", "Sections", "Narrative"],
  },
];

export default function SampleConfigurators() {
  return (
    <section id="configurators" className="section">
      <div className="container">
        <div className="section-heading">
          <div>
            <p className="eyebrow mono">Sample Configurators</p>
            <h2 className="title">Parametric controls for spatial systems.</h2>
          </div>
          <p className="subtitle">
            Minimal UI controls that shape the geometry, logic, and rhythm of
            each study.
          </p>
        </div>
        <div className="config-grid">
          {configurators.map((config) => (
            <div key={config.title} className="config-card">
              <h3>{config.title}</h3>
              <p>{config.description}</p>
              <div className="pill-row">
                {config.options.map((option) => (
                  <span key={option} className="pill mono">
                    {option}
                  </span>
                ))}
              </div>
              <div className="slider" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
