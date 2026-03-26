'use client';

import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Logo } from '@/components/logo';
import { type OrganizationProfile } from '@/lib/types';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

function OrganizationCard({ profile }: { profile: OrganizationProfile }) {
    return (
        <Link href={`/organization/${profile.id}`}>
            <Card className="h-full transition-all hover:border-secondary hover:shadow-lg hover:-translate-y-1">
                 <CardHeader className="flex-row items-center gap-4">
                    <Avatar className="h-16 w-16 border">
                        <AvatarImage src={profile.logoUrl} alt={profile.name} />
                        <AvatarFallback>{profile.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <CardTitle className="font-headline text-2xl flex items-center gap-2">
                            {profile.name}
                            {profile.isVerified && <ShieldCheck className="h-6 w-6 text-primary" />}
                        </CardTitle>
                         <CardDescription>{profile.teamStyle}</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">{profile.description}</p>
                </CardContent>
            </Card>
        </Link>
    );
}

function OrganizationListSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i}>
                    <CardHeader className="flex-row items-start gap-4">
                        <Skeleton className="h-16 w-16 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-6 w-32" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

export default function OrganizationsPage() {
    const { firestore } = useFirebase();

    const orgsQuery = useMemoFirebase(
        () => (firestore ? collection(firestore, 'organization_profiles') : null),
        [firestore]
    );
    const { data: organizations, isLoading } = useCollection<OrganizationProfile>(orgsQuery);

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm">
                <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
                    <Logo />
                    <Button variant="outline" asChild>
                        <Link href="/">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Home
                        </Link>
                    </Button>
                </div>
            </header>
            <main className="flex-1 container mx-auto px-4 md:px-6 py-12">
                 <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold font-headline tracking-tighter sm:text-5xl">Find Organizations</h1>
                    <p className="max-w-2xl mx-auto mt-4 text-muted-foreground">
                        Discover top organizations and teams looking for talent.
                    </p>
                </div>
                {isLoading && <OrganizationListSkeleton />}
                {!isLoading && organizations && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {organizations.map(org => (
                            <OrganizationCard key={org.id} profile={org} />
                        ))}
                    </div>
                )}
                {!isLoading && (!organizations || organizations.length === 0) && (
                     <Card className="text-center py-12">
                        <CardHeader>
                            <CardTitle>No Organizations Found</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>There are no organization profiles available at the moment.</p>
                        </CardContent>
                    </Card>
                )}
            </main>
        </div>
    );
}
