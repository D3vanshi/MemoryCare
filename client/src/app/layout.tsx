import { Providers } from "@/components/providers";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-[#e0eafc] to-[#cfdef3]">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
} 