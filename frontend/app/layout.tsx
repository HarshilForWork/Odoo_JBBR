"use client";

import type React from "react";
import { Toaster } from "react-hot-toast";
import { SocketProvider } from "@/lib/socket-context";
import { motion, AnimatePresence } from "framer-motion";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>StackIt - Community Q&A Forum</title>
        <meta
          name="description"
          content="StackIt - A community-driven question and answer forum where users can ask questions, share knowledge, and help each other."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <SocketProvider>
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
          <Toaster position="top-right" />
        </SocketProvider>
      </body>
    </html>
  );
}
