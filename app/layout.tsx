import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "TaskFlow — Project Planning Demo",
  description: "A responsive Kanban and sprint planning showcase with local-only sample tasks.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
