import Link from "next/link";
import React from "react";

const Header = () => {
  return (
    <header className="header !mb-0">
      <div className="brand">
        <div className="logo" />
        <Link href="/" style={{ textDecoration: "none" }}>
          <span
            style={{
              fontWeight: 700,
              color: "var(--primary)",
              fontSize: "2em",
              letterSpacing: "-1px",
            }}
          >
            TDEE Calculator
          </span>
        </Link>
      </div>
      <h1>Calculate Your Daily Calories</h1>
      <p className="subtitle">
        Get accurate calorie targets based on your body metrics and activity
        level.
      </p>
    </header>
  );
};

export default Header;
