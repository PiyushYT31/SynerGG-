
"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

import placeholderImages from "@/lib/placeholder-images.json";
import { TiltCard } from "@/components/ui/tilt-card";
import { AirdropFeatures } from "@/components/airdrop-features";

// ─── Skeleton loader for a single carousel card ───────────────────────────────
function OrgLogoSkeleton() {
  return (
    <CarouselItem className="basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5">
      <div className="p-2">
        <div className="rounded-lg bg-card/30 p-4 flex flex-col items-center justify-center h-36 animate-pulse">
          <div className="w-20 h-12 rounded bg-muted/50" />
          <div className="mt-3 w-16 h-3 rounded bg-muted/40" />
        </div>
      </div>
    </CarouselItem>
  );
}

// ─── Single org logo card ─────────────────────────────────────────────────────
function OrgLogoCard({ name, logoUrl }: { name: string; logoUrl: string }) {
  return (
    <div className="rounded-lg bg-card/30 p-4 flex flex-col items-center justify-center h-36 transition-all hover:bg-accent/50 hover:scale-105 text-center">
      <div className="flex-grow flex items-center justify-center h-20">
        <Image
          src={logoUrl}
          alt={name}
          width={120}
          height={60}
          className="object-contain"
        />
      </div>
      <p className="mt-2 text-xs font-medium text-muted-foreground">{name}</p>
    </div>
  );
}

// ─── Org Logos Carousel — Uses provided local images ────────────────────────
function OrgLogosCarousel() {
  const logos = placeholderImages.org_logos.map((l) => ({ id: l.id, name: l.name, logoUrl: l.src }));

  return (
    <Carousel
      opts={{ align: "start", loop: true }}
      className="w-full max-w-6xl mx-auto"
    >
      <CarouselContent>
        {logos.map((logo) => (
          <CarouselItem
            key={logo.id}
            className="basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5"
          >
            <div className="p-2">
              <OrgLogoCard name={logo.name} logoUrl={logo.logoUrl} />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="hidden sm:flex" />
      <CarouselNext className="hidden sm:flex" />
    </Carousel>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Logo />
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/players">Players</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/organizations">Organizations</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative flex h-[80vh] min-h-[600px] w-full flex-col items-center justify-center text-center">
          <Image
            src={placeholderImages.home_hero.src}
            alt="BGMI Esports Character"
            data-ai-hint={placeholderImages.home_hero.hint}
            fill
            className="object-cover -z-10 brightness-[.4]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent -z-10" />
          <div className="container px-4 md:px-6">
            <h1
              className="text-6xl font-extrabold tracking-tighter font-headline sm:text-7xl md:text-8xl text-neutral-50"
              style={{ textShadow: "0 5px 25px hsl(var(--primary) / 0.5), 0 2px 5px hsl(var(--primary) / 0.3)" }}
            >
              Unleash Your Synergy
            </h1>
            <p
              className="mx-auto mt-6 max-w-3xl text-lg text-foreground/90 md:text-xl"
              style={{ textShadow: "0 2px 4px hsl(var(--background) / 0.6)" }}
            >
              Discover, recruit, and build your next champion roster. The ultimate scouting ground for BGMI esports talent.
            </p>
            <div className="mt-10">
              <Button size="lg" asChild>
                <Link href="#login">
                  Get Started <ArrowRight className="ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Interlude Section */}
        <section className="w-full py-12 border-b border-border/20 bg-background/40">
          <div className="container mx-auto px-4 text-center">
            <p className="text-lg md:text-xl lg:text-2xl font-bold tracking-[0.25em] text-primary/80 uppercase font-headline">
              NEW VISION. NEW JOURNEY. SAME PASSION
            </p>
          </div>
        </section>

        {/* Airdrop Features Section */}
        <AirdropFeatures />

        {/* Login/Signup Section */}
        <section id="login" className="w-full py-20 md:py-32 bg-background">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold font-headline tracking-tighter sm:text-4xl">
                Join the Arena
              </h2>
              <p className="max-w-2xl mx-auto mt-4 text-muted-foreground">
                Whether you&apos;re a player looking for your next team or an organization scouting for talent, your journey starts here.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <TiltCard>
                <div className="absolute -right-4 -top-6 text-primary/10 font-bold text-6xl pointer-events-none" style={{ transform: "translateZ(40px)" }}>
                  0/4
                </div>
                <Card className="h-full text-left bg-card/80 backdrop-blur-sm border-primary/20 hover:border-primary transition-all relative z-10 w-full" style={{ transform: "translateZ(20px)" }}>
                  <CardHeader>
                    <CardTitle className="font-headline text-2xl">For Organizations</CardTitle>
                    <CardDescription>
                      Find the perfect talent to complete your roster. Create your profile, post openings, and discover players that match your team&apos;s style.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col sm:flex-row gap-4 mt-auto">
                    <Button className="w-full" asChild>
                      <Link href="/organization/signup">
                        Sign Up <ArrowRight className="ml-2" />
                      </Link>
                    </Button>
                    <Button variant="secondary" className="w-full" asChild>
                      <Link href="/organization/login">
                        Login <LogIn className="ml-2" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </TiltCard>

              <TiltCard>
                <div className="absolute -left-4 -bottom-6 text-secondary/10 font-bold text-6xl pointer-events-none" style={{ transform: "translateZ(40px)" }}>
                  F/D: 4.5
                </div>
                <Card className="h-full text-left bg-card/80 backdrop-blur-sm border-secondary/20 hover:border-secondary transition-all relative z-10 w-full" style={{ transform: "translateZ(20px)" }}>
                  <CardHeader>
                    <CardTitle className="font-headline text-2xl">For Players</CardTitle>
                    <CardDescription>
                      Showcase your skills and find your dream team. Build your profile, highlight your achievements, and connect with top organizations.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col sm:flex-row gap-4 mt-auto">
                    <Button className="w-full" asChild>
                      <Link href="/player/signup">
                        Sign Up <ArrowRight className="ml-2" />
                      </Link>
                    </Button>
                    <Button variant="secondary" className="w-full" asChild>
                      <Link href="/player/login">
                        Login <LogIn className="ml-2" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </TiltCard>
            </div>
          </div>
        </section>

        {/* Organization Logos Section */}
        <section className="w-full py-20 md:py-32 bg-background/70">
          <div className="container mx-auto px-4 md:px-6">
            {/* Mission Statement Pre-amble */}
            <div className="text-center pb-16 mb-16 border-b border-border/20">
              <p className="text-sm md:text-base font-semibold tracking-[0.2em] text-muted-foreground uppercase mb-3">
                DIFFERENT PATHS . ONE GOAL.
              </p>
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black font-headline tracking-tighter text-foreground" style={{ textShadow: "0 0 30px hsl(var(--primary) / 0.1)" }}>
                BUILDING THE FUTURE OF ESPORTS
              </h2>
            </div>

            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold font-headline tracking-tighter sm:text-4xl">
                Trusted by Leading Organizations
              </h2>
              <p className="max-w-2xl mx-auto mt-4 text-muted-foreground">
                The best in the game use SynerGG to build their squads.
              </p>
            </div>
            <OrgLogosCarousel />
          </div>
        </section>
      </main>

      <footer className="bg-background border-t">
        <div className="container mx-auto py-6 px-4 md:px-6 text-center text-muted-foreground">
          <Logo />
          <p className="text-sm mt-2">© {new Date().getFullYear()} SynerGG. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
