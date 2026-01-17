"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Zap,
  GitPullRequest,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Code,
  TestTube,
  Rocket,
  GitMerge,
} from "lucide-react";

const steps = [
  { icon: Code, label: "Code", color: "from-blue-500 to-cyan-500" },
  { icon: TestTube, label: "Test", color: "from-purple-500 to-pink-500" },
  { icon: GitPullRequest, label: "PR", color: "from-green-500 to-emerald-500" },
  { icon: GitMerge, label: "Merge", color: "from-orange-500 to-yellow-500" },
  { icon: Rocket, label: "Deploy", color: "from-red-500 to-rose-500" },
  { icon: CheckCircle2, label: "Done", color: "from-emerald-500 to-green-400" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950 overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-gray-950 to-purple-900/20" />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ duration: 2 }}
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-600/10 via-transparent to-transparent"
        />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            DevFlow
          </span>
        </div>
        <Link href="/login">
          <Button variant="outline" className="border-gray-700 hover:bg-gray-800">
            Sign In
          </Button>
        </Link>
      </header>

      {/* Hero */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm mb-8">
              <Sparkles className="h-4 w-4" />
              AI-Powered Developer Productivity
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight"
          >
            Track Every Step of
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Your Dev Workflow
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto"
          >
            Break down GitHub issues into atomic steps. Track your progress from code to deploy.
            Never lose track of where you are in your development cycle.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/login">
              <Button
                size="lg"
                className="text-lg px-8 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500"
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Animated Steps */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-20 flex flex-wrap justify-center gap-4"
        >
          {steps.map((step, index) => (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
              whileHover={{ scale: 1.1, y: -5 }}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-r ${step.color} bg-opacity-10 backdrop-blur border border-white/10`}
            >
              <div className={`p-3 rounded-lg bg-gradient-to-r ${step.color}`}>
                <step.icon className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm font-medium text-white">{step.label}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="mt-32 grid md:grid-cols-3 gap-8"
        >
          <div className="p-6 rounded-2xl bg-gray-800/30 border border-gray-700/50 backdrop-blur">
            <div className="p-3 rounded-lg bg-blue-500/20 w-fit mb-4">
              <Sparkles className="h-6 w-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">AI-Generated Steps</h3>
            <p className="text-gray-400">
              Cerebras AI analyzes your issues and generates tailored atomic steps automatically.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-gray-800/30 border border-gray-700/50 backdrop-blur">
            <div className="p-3 rounded-lg bg-purple-500/20 w-fit mb-4">
              <GitPullRequest className="h-6 w-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">GitHub Integration</h3>
            <p className="text-gray-400">
              Automatically verify step completion by checking PRs, merges, and pipeline status.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-gray-800/30 border border-gray-700/50 backdrop-blur">
            <div className="p-3 rounded-lg bg-green-500/20 w-fit mb-4">
              <CheckCircle2 className="h-6 w-6 text-green-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Visual Progress</h3>
            <p className="text-gray-400">
              Kanban board with progress bars shows exactly where each issue stands.
            </p>
          </div>
        </motion.div>

        {/* Tagline */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="mt-20 text-center"
        >
          <p className="text-gray-500 text-lg italic">
            &quot;The back-office secretary every developer deserves&quot;
          </p>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-gray-500 text-sm">
          Built for the Hackathon with Cerebras AI, GitHub API, and MCP
        </div>
      </footer>
    </div>
  );
}
