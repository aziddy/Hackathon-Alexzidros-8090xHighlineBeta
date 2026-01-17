"use client";

import { motion } from "framer-motion";

interface StepProgressBarProps {
  progress: number;
  showLabel?: boolean;
}

export function StepProgressBar({ progress, showLabel = true }: StepProgressBarProps) {
  const getGradient = (p: number) => {
    if (p < 30) return "from-red-500 to-orange-500";
    if (p < 70) return "from-orange-500 to-yellow-500";
    return "from-green-400 to-emerald-500";
  };

  return (
    <div className="space-y-2">
      {showLabel && (
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">Overall Progress</span>
          <span className="text-lg font-bold text-white">{progress}%</span>
        </div>
      )}
      <div className="relative h-4 w-full rounded-full bg-gray-800 overflow-hidden">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${getGradient(progress)}`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
        {progress === 100 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          />
        )}
      </div>
    </div>
  );
}
