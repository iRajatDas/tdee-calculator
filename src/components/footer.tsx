import React from "react";

const Footer = () => {
  return (
    <footer className="bg-brand-background-light py-8 px-0 mt-12 border border-brand-border">
      <div className="app-container">
        <hr className="my-8 border-0 border-t border-brand-border" />
        <div style={{ textAlign: "center" }}>
          <p className="font-medium mb-4">
            © {new Date().getFullYear()} TDEE Calculator. All rights reserved.
          </p>
          <p className="text-brand-text-light text-sm">
            Please use responsibly. Consult a healthcare professional for
            personalized advice.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
