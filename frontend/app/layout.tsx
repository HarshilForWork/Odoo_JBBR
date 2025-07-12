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
