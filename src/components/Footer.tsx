import { useIsMobile } from "@/lib/useMediaQuery";

export function Footer() {
  const isMobile = useIsMobile();
  const cols = [
    {
      h: "Explore",
      l: [
        "All programs",
        "Browse by campus",
        "Browse by industry",
        "Spotlight stories",
        "Events calendar",
      ],
    },
    {
      h: "For founders",
      l: [
        "Funding directory",
        "Maker spaces",
        "Mentor network",
        "Submit a venture",
        "Office hours",
      ],
    },
    {
      h: "For partners",
      l: ["Become a mentor", "Sponsor a program", "Investor portal", "Industry partnerships"],
    },
    {
      h: "About",
      l: ["The initiative", "Submit a program", "Data & methodology", "Press", "Contact"],
    },
  ];

  return (
    <footer
      style={{
        background: "#002033",
        color: "#fff",
        padding: isMobile ? "48px 20px 20px" : "72px 32px 28px",
        marginTop: 0,
      }}
    >
      <div
        style={{
          maxWidth: 1440,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1.6fr 1fr 1fr 1fr 1fr",
          gap: isMobile ? 28 : 32,
        }}
      >
        <div>
          <img
            src={`${import.meta.env.BASE_URL}assets/uc-wordmark-white.png`}
            style={{ height: 42, marginBottom: 18, display: "block" }}
            alt="UC"
          />
          <div
            style={{
              fontFamily: "'Source Serif 4',Georgia,serif",
              fontSize: 20,
              lineHeight: 1.35,
              color: "#fff",
              maxWidth: 360,
              marginBottom: 16,
            }}
          >
            A central nervous system for entrepreneurship across the world’s leading public research
            university.
          </div>
          <div style={{ fontSize: 13, color: "#BDE3F6" }}>
            An initiative of the UC Office of the President.
          </div>
        </div>
        {cols.map((col) => (
          <div key={col.h}>
            <h6
              style={{
                margin: "0 0 14px",
                fontSize: 11.5,
                letterSpacing: ".14em",
                textTransform: "uppercase",
                color: "#FFB511",
                fontWeight: 700,
              }}
            >
              {col.h}
            </h6>
            <ul
              style={{
                margin: 0,
                padding: 0,
                listStyle: "none",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {col.l.map((item) => (
                <li key={item}>
                  <a href="#" style={{ color: "#fff", textDecoration: "none", fontSize: 14 }}>
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div
        style={{
          maxWidth: 1440,
          margin: "48px auto 0",
          paddingTop: 24,
          borderTop: "1px solid rgba(255,255,255,.12)",
          display: "flex",
          justifyContent: "space-between",
          fontSize: 13,
          color: "#BDE3F6",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>© Regents of the University of California</div>
        <div style={{ display: "flex", gap: 18 }}>
          <a href="#" style={{ color: "#BDE3F6" }}>
            Privacy
          </a>
          <a href="#" style={{ color: "#BDE3F6" }}>
            Terms
          </a>
          <a href="#" style={{ color: "#BDE3F6" }}>
            Accessibility
          </a>
        </div>
      </div>
    </footer>
  );
}
