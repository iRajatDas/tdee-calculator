import React from "react";

const Footer = () => {
  return (
    <footer
      style={{
        background: "var(--bg-light)",
        padding: "2rem 0",
        marginTop: "3rem",
        borderTop: "1px solid var(--border)",
      }}
    >
      <div className="app-container">
        <hr
          style={{
            border: "none",
            borderTop: "1px solid var(--border)",
            margin: "2rem 0",
          }}
        />
        <div style={{ textAlign: "center" }}>
          <p
            style={{
              color: "var(--text)",
              fontWeight: 500,
              marginBottom: "1rem",
            }}
          >
            © 2024 TDEE Calculator. All rights reserved.
          </p>
          <p style={{ color: "var(--text-light)", fontSize: "0.875rem" }}>
            Please use responsibly. Consult a healthcare professional for
            personalized advice.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
