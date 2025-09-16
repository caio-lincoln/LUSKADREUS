import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Luska Dreus - Plataforma de Desenho",
  description: "Pratique desenho artístico com modos interativos e multiplayer",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider 
          attribute="class" 
          defaultTheme="light" 
          enableSystem={false}
          disableTransitionOnChange
          storageKey="luskadreus-theme"
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
