import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Portal IEEE CEFET-RJ",
  description: "Sistema de Gestão Interna do Ramo Estudantil IEEE CEFET-RJ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 font-sans">
        {children}
      </body>
    </html>
  );
}
