"use client";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Logo />
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center">
        <div className="container mx-auto px-4 md:px-6 py-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold font-headline mb-4">
            Welcome to BGMI Synergy Connect
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-12">
            The ultimate platform to connect players and organizations in the BGMI ecosystem.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="text-left hover:border-primary transition-all">
              <CardHeader>
                <CardTitle className="font-headline text-2xl">For Organizations</CardTitle>
                <CardDescription>
                  Find the perfect talent to complete your roster. Create your profile, post openings, and discover players that match your team's style.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/organization/signup" className="w-full">
                  <Button className="w-full">
                    Organization Login / Sign Up
                    <ArrowRight className="ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="text-left hover:border-primary transition-all">
              <CardHeader>
                <CardTitle className="font-headline text-2xl">For Players</CardTitle>
                <CardDescription>
                  Showcase your skills and find your dream team. Build your profile, highlight your achievements, and connect with top organizations.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/player/signup" className="w-full">
                  <Button className="w-full">
                    Player Login / Sign Up
                    <ArrowRight className="ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
