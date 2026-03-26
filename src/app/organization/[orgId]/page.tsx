'use client';

import { useParams } from 'next/navigation';
import { doc } from 'firebase/firestore';
import Image from 'next/image';

import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { type OrganizationProfile } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { User, Briefcase, Phone, Mail, ShieldCheck, Users, Edit } from 'lucide-react';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function ProfileSkeleton() {
    return (
        <div className="container mx-auto px-4 md:px-6 py-12">
            <div className="flex flex-col md:flex-row items-start gap-8">
                <div className="flex-shrink-0">
                    <Skeleton className="h-40 w-40 rounded-full" />
                </div>
                <div className="flex-grow space-y-4">
                    <Skeleton className="h-10 w-3/4" />
                    <Skeleton className="h-6 w-1/2" />
                    <div className="flex flex-wrap gap-2">
                        <Skeleton className="h-8 w-24" />
                        <Skeleton className="h-8 w-24" />
                    </div>
                </div>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
                <Card>
                    <CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader>
                    <CardContent><Skeleton className="h-5 w-3/4" /></CardContent>
                </Card>
                <Card>
                    <CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader>
                    <CardContent><Skeleton className="h-5 w-3/4" /></CardContent>
                </Card>
                <Card>
                    <CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader>
                    <CardContent><Skeleton className="h-5 w-3/4" /></CardContent>
                </Card>
                <Card>
                    <CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader>
                    <CardContent><Skeleton className="h-5 w-3/4" /></CardContent>
                </Card>
            </div>
        </div>
    )
}

export default function OrganizationProfilePage() {
  const { firestore, user } = useFirebase();
  const params = useParams();
  const orgId = params.orgId as string;

  const orgRef = useMemoFirebase(
    () => (firestore && orgId ? doc(firestore, 'organization_profiles', orgId) : null),
    [firestore, orgId]
  );
  
  const { data: profile, isLoading } = useDoc<OrganizationProfile>(orgRef);
  const isOwner = user && profile && user.uid === profile.userId;

    if (isLoading) {
        return <div className="bg-background min-h-screen"><ProfileSkeleton /></div>;
    }

  if (!profile) {
    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
             <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm">
                <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
                    <Logo />
                     <Button asChild variant="outline"><Link href="/">Go Home</Link></Button>
                </div>
            </header>
            <main className="flex-1 flex items-center justify-center">
                <Card className="m-4">
                    <CardHeader>
                        <CardTitle>Profile Not Found</CardTitle>
                        <CardDescription>The organization profile you are looking for does not exist.</CardDescription>
                    </CardHeader>
                </Card>
            </main>
        </div>
    );
  }

  const team = [
      { name: profile.owner, role: 'Owner' },
      { name: profile.coOwner, role: 'Co-owner' },
      { name: profile.coach, role: 'Coach' },
      { name: profile.analyst, role: 'Analyst' },
  ].filter(member => member.name);

  return (
    <div className="bg-background text-foreground min-h-screen">
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm">
            <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
                <Logo />
                 <div className="flex items-center gap-4">
                    {isOwner && (
                        <Button asChild>
                            <Link href={`/organization/${orgId}/edit`}>
                                <Edit className="mr-2 h-4 w-4" /> Edit Profile
                            </Link>
                        </Button>
                    )}
                    <Button asChild variant="outline"><Link href="/">Explore More Profiles</Link></Button>
                </div>
            </div>
        </header>

        <main className="container mx-auto px-4 md:px-6 py-12">
            <Card className="overflow-hidden border-primary shadow-lg shadow-primary/10">
                <div className="relative h-48 w-full">
                    <Image src={`https://picsum.photos/seed/${profile.id}/1200/400`} alt={`${profile.name} banner`} fill objectFit="cover" data-ai-hint="esports banner" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                </div>
                <CardContent className="p-6 relative">
                    <div className="flex flex-col sm:flex-row sm:items-end sm:gap-6 -mt-20">
                        <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
                            <AvatarImage src={profile.logoUrl} alt={profile.name} />
                            <AvatarFallback>{profile.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="mt-4 sm:mt-0">
                            <CardTitle className="font-headline text-3xl flex items-center gap-2">
                                {profile.name}
                                {profile.isVerified && <ShieldCheck className="h-7 w-7 text-primary" />}
                            </CardTitle>
                            <CardDescription className="text-lg">{profile.email}</CardDescription>
                        </div>
                    </div>

                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-8">
                             <Card>
                                <CardHeader><CardTitle className="font-headline flex items-center gap-2"><Users /> Team Management</CardTitle></CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        {team.map(member => (
                                            <div key={member.role} className="flex flex-col items-center text-center">
                                                <Avatar>
                                                    <AvatarFallback><User /></AvatarFallback>
                                                </Avatar>
                                                <p className="font-semibold mt-2">{member.name}</p>
                                                <p className="text-sm text-muted-foreground">{member.role}</p>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                             <Card>
                                <CardHeader><CardTitle className="font-headline">About Us</CardTitle></CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">{profile.description || "No description provided."}</p>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="space-y-6">
                            <Card>
                                <CardHeader><CardTitle className="font-headline">Contact Info</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <Mail className="h-5 w-5 text-muted-foreground" />
                                        <span>{profile.email}</span>
                                    </div>
                                    {profile.phoneNumber && (
                                        <div className="flex items-center gap-3">
                                            <Phone className="h-5 w-5 text-muted-foreground" />
                                            <span>{profile.phoneNumber}</span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                            {profile.achievements && profile.achievements.length > 0 && (
                                <Card>
                                    <CardHeader><CardTitle className="font-headline">Achievements</CardTitle></CardHeader>
                                    <CardContent className="flex flex-wrap gap-2">
                                        {profile.achievements.map((ach, i) => <Badge key={i} variant="secondary">{ach}</Badge>)}
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                    </div>
                </CardContent>
            </Card>
        </main>
    </div>
  );
}
