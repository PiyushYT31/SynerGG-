
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
} from "@/components/ui/carousel"
import placeholderImages from '@/lib/placeholder-images.json';


export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Logo />
          <div className="flex items-center gap-2">
             <Button variant="ghost" asChild>
                <Link href="/players">
                  Players
                </Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/organizations">
                  Organizations
                </Link>
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
              style={{ textShadow: '0 5px 25px hsl(var(--primary) / 0.5), 0 2px 5px hsl(var(--primary) / 0.3)'}}
            >
              Unleash Your Synergy
            </h1>
            <p 
              className="mx-auto mt-6 max-w-3xl text-lg text-foreground/90 md:text-xl"
              style={{ textShadow: '0 2px 4px hsl(var(--background) / 0.6)' }}
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

        {/* Login/Signup Section */}
        <section id="login" className="w-full py-20 md:py-32 bg-background">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold font-headline tracking-tighter sm:text-4xl">Join the Arena</h2>
              <p className="max-w-2xl mx-auto mt-4 text-muted-foreground">
                Whether you're a player looking for your next team or an organization scouting for talent, your journey starts here.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <Card className="text-left bg-card/80 backdrop-blur-sm border-primary/20 hover:border-primary transition-all">
                <CardHeader>
                  <CardTitle className="font-headline text-2xl">For Organizations</CardTitle>
                  <CardDescription>
                    Find the perfect talent to complete your roster. Create your profile, post openings, and discover players that match your team's style.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-4">
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

              <Card className="text-left bg-card/80 backdrop-blur-sm border-secondary/20 hover:border-secondary transition-all">
                <CardHeader>
                  <CardTitle className="font-headline text-2xl">For Players</CardTitle>
                  <CardDescription>
                    Showcase your skills and find your dream team. Build your profile, highlight your achievements, and connect with top organizations.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-4">
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
            </div>
          </div>
        </section>

        {/* Organization Logos Section */}
        <section className="w-full py-20 md:py-32 bg-background/70">
            <div className="container mx-auto px-4 md:px-6">
                 <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold font-headline tracking-tighter sm:text-4xl">Trusted by Leading Organizations</h2>
                    <p className="max-w-2xl mx-auto mt-4 text-muted-foreground">
                        The best in the game use SynerGG to build their squads.
                    </p>
                </div>
                <Carousel
                  opts={{
                    align: "start",
                    loop: true,
                  }}
                  className="w-full max-w-6xl mx-auto"
                >
                  <CarouselContent>
                    {placeholderImages.org_logos.map((logo) => (
                      <CarouselItem key={logo.id} className="basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5">
                        <div className="p-2">
                          <div className="rounded-lg bg-card/30 p-4 flex flex-col items-center justify-center h-36 transition-all hover:bg-accent/50 hover:scale-105 text-center">
                            <div className="flex-grow flex items-center justify-center h-20">
                                <Image
                                src={logo.src}
                                alt={logo.name}
                                data-ai-hint={logo.hint}
                                width={120}
                                height={60}
                                className="object-contain"
                                />
                            </div>
                            <p className="mt-2 text-xs font-medium text-muted-foreground">{logo.name}</p>
                          </div>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="hidden sm:flex" />
                  <CarouselNext className="hidden sm:flex" />
                </Carousel>
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
