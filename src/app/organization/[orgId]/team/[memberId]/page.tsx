'use client';

import { useParams } from 'next/navigation';
import { doc, collection, query, where } from 'firebase/firestore';

import { useFirebase, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { type OrganizationProfile, type TeamMember } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { User, Phone, Mail, Briefcase, Search, ArrowLeft, ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function TeamMemberProfilePage() {
    const { firestore } = useFirebase();
    const params = useParams();
    const orgId = params.orgId as string;
    const memberId = params.memberId as string;

    const orgRef = useMemoFirebase(
        () => (firestore && orgId ? doc(firestore, 'organization_profiles', orgId) : null),
        [firestore, orgId]
    );
    const { data: profile, isLoading } = useDoc<OrganizationProfile>(orgRef);

    if (isLoading) {
        return (
            <div className="flex flex-col min-h-screen bg-background text-foreground">
                <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm">
                    <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
                        <Logo />
                    </div>
                </header>
                <main className="flex-1 container mx-auto px-4 md:px-6 py-12">
                    <Skeleton className="h-64 w-full max-w-2xl mx-auto" />
                </main>
            </div>
        );
    }

    let member = profile?.teamMembers?.find((m) => m.id === memberId);
    if (!member && profile) {
        if (memberId === 'owner' && profile.owner) {
            member = { id: 'owner', name: profile.owner, role: 'Owner' };
        } else if (memberId === 'manager' && profile.manager) {
            member = { id: 'manager', name: profile.manager, role: 'Manager' };
        } else if (memberId === 'co-owner' && profile.coOwner) {
            member = { id: 'co-owner', name: profile.coOwner, role: 'Co-owner' };
        } else if (memberId === 'coach' && profile.coach) {
            member = { id: 'coach', name: profile.coach, role: 'Coach' };
        } else if (memberId === 'analyst' && profile.analyst) {
            member = { id: 'analyst', name: profile.analyst, role: 'Analyst' };
        }
    }

    if (!profile || !member) {
        return (
            <div className="flex flex-col min-h-screen bg-background text-foreground">
                <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm">
                    <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
                        <Logo />
                        <Button asChild variant="outline"><Link href={`/organization/${orgId}`}>Back to Organization</Link></Button>
                    </div>
                </header>
                <main className="flex-1 flex items-center justify-center">
                    <Card className="m-4">
                        <CardHeader>
                            <CardTitle>Member Not Found</CardTitle>
                            <CardDescription>The team member profile you are looking for does not exist.</CardDescription>
                        </CardHeader>
                    </Card>
                </main>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm">
                <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
                    <Logo />
                    <Button asChild variant="outline">
                        <Link href={`/organization/${orgId}`}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to {profile.name}
                        </Link>
                    </Button>
                </div>
            </header>
            <main className="flex-1 container mx-auto px-4 md:px-6 py-12">
                <div className="max-w-2xl mx-auto">
                    <Card className="overflow-hidden border-primary/30 shadow-lg shadow-primary/5">
                        <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-transparent h-24" />
                        <CardContent className="p-6 -mt-12">
                            <div className="flex flex-col items-center text-center mb-8">
                                <Avatar className="h-24 w-24 border-4 border-background shadow-lg mb-4">
                                    <AvatarFallback className="text-2xl bg-primary/20 text-primary">
                                        {member.name.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <h1 className="text-2xl font-bold font-headline">{member.name}</h1>
                                <Badge variant="secondary" className="mt-2 text-sm">{member.role}</Badge>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {profile.name} {profile.isVerified && <ShieldCheck className="inline h-4 w-4 text-primary" />}
                                </p>
                            </div>

                            <div className="space-y-6">
                                {/* Contact Information */}
                                {member.contactNumber && (
                                    <div className="space-y-2">
                                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Contact</h3>
                                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                                            <Phone className="h-5 w-5 text-primary" />
                                            <span>{member.contactNumber}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Past Experience */}
                                {member.pastExperience && (
                                    <div className="space-y-2">
                                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Past Experience</h3>
                                        <div className="p-3 rounded-lg bg-muted/50">
                                            <div className="flex items-start gap-3">
                                                <Briefcase className="h-5 w-5 text-primary mt-0.5" />
                                                <p className="text-sm leading-relaxed">{member.pastExperience}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Seeking Player Type */}
                                {member.seekingPlayerType && (
                                    <div className="space-y-2">
                                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Seeking Players</h3>
                                        <div className="p-3 rounded-lg bg-muted/50">
                                            <div className="flex items-start gap-3">
                                                <Search className="h-5 w-5 text-primary mt-0.5" />
                                                <p className="text-sm leading-relaxed">{member.seekingPlayerType}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Bio */}
                                {member.bio && (
                                    <div className="space-y-2">
                                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Bio</h3>
                                        <div className="p-3 rounded-lg bg-muted/50">
                                            <p className="text-sm leading-relaxed">{member.bio}</p>
                                        </div>
                                    </div>
                                )}

                                {/* If no details are filled */}
                                {!member.contactNumber && !member.pastExperience && !member.seekingPlayerType && !member.bio && (
                                    <p className="text-center text-muted-foreground py-8">
                                        No additional details available for this team member.
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
