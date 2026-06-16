 function Footer() {
  return (
    <footer style={footerStyle}>
      <div style={footerGlow}></div>

      <div style={footerContent}>
        <h3 style={logoStyle}>MindSpark</h3>
        <p style={taglineStyle}>
          AI-powered assessment platform for smarter teaching and learning.
        </p>

        <div style={dividerStyle}></div>

        <p style={copyStyle}>
          © {new Date().getFullYear()} MindSpark. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

const footerStyle = {
  position: "relative",
  marginTop: "60px",
  padding: "40px 20px 28px",
  background:
    "linear-gradient(180deg, rgba(7,12,28,0.2) 0%, rgba(8,15,35,0.92) 35%, #050816 100%)",
  borderTop: "1px solid rgba(255,255,255,0.08)",
  overflow: "hidden",
};

const footerGlow = {
  position: "absolute",
  top: "-80px",
  left: "50%",
  transform: "translateX(-50%)",
  width: "420px",
  height: "180px",
  background:
    "radial-gradient(circle, rgba(99,102,241,0.28) 0%, rgba(59,130,246,0.16) 35%, rgba(0,0,0,0) 72%)",
  filter: "blur(28px)",
  pointerEvents: "none",
};

const footerContent = {
  position: "relative",
  zIndex: 2,
  maxWidth: "900px",
  margin: "0 auto",
  textAlign: "center",
  padding: "26px 24px",
  borderRadius: "22px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  backdropFilter: "blur(14px)",
  boxShadow: "0 18px 45px rgba(0,0,0,0.28)",
};

const logoStyle = {
  margin: 0,
  fontSize: "1.6rem",
  fontWeight: 700,
  letterSpacing: "0.5px",
  color: "#ffffff",
};

const taglineStyle = {
  margin: "10px auto 0",
  maxWidth: "560px",
  fontSize: "0.98rem",
  lineHeight: 1.7,
  color: "rgba(226,232,240,0.82)",
};

const dividerStyle = {
  width: "90px",
  height: "1px",
  margin: "20px auto 16px",
  background:
    "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(129,140,248,0.9) 50%, rgba(255,255,255,0) 100%)",
};

const copyStyle = {
  margin: 0,
  fontSize: "0.9rem",
  color: "#94a3b8",
};

export default Footer;