const reels = [
  {
    title: "Daylight Sweep",
    tag: "Loop 01",
    description: "Facade rhythms and sun-tracking studies in motion.",
    src: "/images/urban.gif",
  },
  {
    title: "Section Pulse",
    tag: "Loop 02",
    description: "Interiors and core circulation rendered as a timed loop.",
    src: "/images/diagram5.png",
  },
  {
    title: "Parametric Flow",
    tag: "Loop 03",
    description: "Generative patterns and material transitions in context.",
    src: "/images/diagram6.png",
  },
];

export default function GifShowcase() {
  return (
    <section id="gifs" className="section section--alt">
      <div className="container">
        <div className="section-heading">
          <div>
            <p className="eyebrow mono">Gif Showcase</p>
            <h2 className="title">Motion studies for architecture.</h2>
          </div>
          <p className="subtitle">
            Three focused loops that highlight spatial rhythm, daylight, and
            computational patterning.
          </p>
        </div>
        <div className="gif-stack">
          {reels.map((reel, index) => (
            <div
              key={reel.title}
              className={`gif-row${index === 1 ? " gif-row--reverse" : ""}`}
            >
              <div className="gif-media">
                <img src={reel.src} alt={reel.title} />
              </div>
              <div className="gif-copy">
                <span className="mono">{reel.tag}</span>
                <h3>{reel.title}</h3>
                <p className="subtitle">{reel.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
