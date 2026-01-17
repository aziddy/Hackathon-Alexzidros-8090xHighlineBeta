"use client";

import { motion } from "framer-motion";
import { Bot } from "lucide-react";

export function ChatLoading() {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
        <Bot className="h-4 w-4 text-white" />
      </div>
      <div className="flex gap-1 items-center px-4 py-3 bg-gray-800 rounded-lg border border-gray-700">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 bg-purple-400 rounded-full"
            animate={{ y: [0, -6, 0] }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.15,
            }}
          />
        ))}
      </div>
    </div>
  );
}
