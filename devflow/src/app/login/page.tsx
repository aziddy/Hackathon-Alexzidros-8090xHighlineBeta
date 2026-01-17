"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Github, Zap } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

      <Card className="w-full max-w-md mx-4 relative z-10 border-gray-700 bg-gray-800/50 backdrop-blur">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-600">
              <Zap className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            DevFlow
          </CardTitle>
          <CardDescription className="text-gray-400 text-lg">
            Track your development workflow with atomic precision
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center text-sm text-gray-500">
            Connect your GitHub to get started
          </div>
          <Button
            onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
            className="w-full h-12 text-lg text-white bg-gray-700 hover:bg-gray-600 border border-gray-600"
          >
            <Github className="mr-2 h-5 w-5" />
            Sign in with GitHub
          </Button>
          <div className="text-center text-xs text-gray-500">
            We&apos;ll need access to your repositories to track issues and PRs
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
