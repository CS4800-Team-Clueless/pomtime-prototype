import "./Footer.css";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="pt-footer">
      <div className="pt-footer-inner">
        <p className="pt-footer-text">© {year} PomTime. All rights reserved.</p>

        <div className="pt-footer-links">
          <a href="/about" className="pt-footer-link">
            About
          </a>
          <a href="/privacy" className="pt-footer-link">
            Privacy
          </a>
          <a href="/terms" className="pt-footer-link">
            Terms
          </a>
        </div>
      </div>
    </footer>
  );
}
