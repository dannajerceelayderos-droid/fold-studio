import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/fraunces";
import "./globals.css";
import { Toaster } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: "Fold Studio — Design flat. See it folded.",
  description:
    "A browser-based packaging design studio. Design your box artwork on a flat dieline and see it folded into a live 3D package.",
};

export const viewport: Viewport = { themeColor: "#F7F7F5" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
