import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { SocketProvider } from "@/lib/socket-context"
import { Toaster } from "react-hot-toast"

export const metadata: Metadata = {
  title: "StackIt - Q&A Forum Platform",
  description: "A modern Q&A forum platform for developers",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <SocketProvider>
          {children}
          <Toaster position="top-right" />
        </SocketProvider>
      </body>
    </html>
  )
}
