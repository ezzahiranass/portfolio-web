const links = [
  { label: "Skills", href: "#skills" },
  { label: "Portfolio", href: "#portfolio" },
  { label: "Roadmap", href: "#roadmap" },
  { label: "Gallery", href: "#gallery" },
  { label: "Contact", href: "#contact" },
];

export default function Navbar() {
  return (
    <header className="navbar">
      <div className="container nav-inner">
        <div className="nav-logo mono">ANASS / ARCH LAB</div>
        <nav className="nav-links" aria-label="Primary">
          {links.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
        <div className="nav-cta">
          <button className="btn" type="button">
            Download Portfolio
          </button>
          <button className="btn btn--primary" type="button">
            Start a Project
          </button>
        </div>
      </div>
    </header>
  );
}
