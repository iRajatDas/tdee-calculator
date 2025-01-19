import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/header";
import Footer from "@/components/footer";

export const metadata: Metadata = {
  title: "TDEE Calculator: Find Your Total Daily Energy Expenditure",
  description:
    "Calculate your Total Daily Energy Expenditure (TDEE) with our easy-to-use online calculator. Simply enter your details and get an accurate estimate of your daily calorie needs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <section className="app-container">
          <Header />
        </section>
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
