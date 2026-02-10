export default function Contact() {
  return (
    <section id="contact" className="section section--alt">
      <div className="container">
        <div className="section-heading">
          <div>
            <p className="eyebrow mono">Contact</p>
            <h2 className="title">Start a project brief.</h2>
          </div>
          <p className="subtitle">
            Architecture, computation, or design tooling—share the scope and
            timeline.
          </p>
        </div>
        <div className="contact-grid">
          <form className="contact-form">
            <input className="input" placeholder="Full name" type="text" />
            <input className="input" placeholder="Email address" type="email" />
            <input className="input" placeholder="Project type" type="text" />
            <textarea className="textarea" placeholder="Tell me about the project" />
            <button className="btn btn--primary" type="submit">
              Send Brief
            </button>
          </form>
          <div className="contact-panel">
            <div>
              <p className="mono">Direct Line</p>
              <h3>hello@studio.local</h3>
            </div>
            <div>
              <p className="mono">Current Window</p>
              <p className="subtitle">April 2026 projects open</p>
            </div>
            <div>
              <p className="mono">Response Time</p>
              <p className="subtitle">Within 48 hours</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
