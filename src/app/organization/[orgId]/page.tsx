'use client';

import { useParams, useRouter } from 'next/navigation';
import { doc, collection, query, where, addDoc } from 'firebase/firestore';
import Image from 'next/image';
import Link from 'next/link';

import { useFirebase, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { type OrganizationProfile, type RosterSlot, type PlayerProfile, type TryoutRequest } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { User, Briefcase, Phone, Mail, ShieldCheck, Users, Edit, BrainCircuit, Swords, Heart, Target, Crosshair, Lock, Unlock, UserPlus, LayoutGrid, TrendingUp, LogOut } from 'lucide-react';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const roleIcons: { [key: string]: React.ReactNode } = {
    'IGL': <BrainCircuit className="h-4 w-4" />,
    'Entry Fragger': <Swords className="h-4 w-4" />,
    'Support': <Heart className="h-4 w-4" />,
    'Assaulter': <Target className="h-4 w-4" />,
    'Sniper': <Crosshair className="h-4 w-4" />,
    'Substitute': <UserPlus className="h-4 w-4" />,
};

const statusIcons: { [key: string]: React.ReactNode } = {
    'Locked': <Lock className="h-4 w-4 text-destructive" />,
    'Vacant': <Unlock className="h-4 w-4 text-green-500" />,
    'Open for Replacement': <UserPlus className="h-4 w-4 text-yellow-500" />,
};

function RosterPlayer({ playerId }: { playerId: string }) {
    const { firestore } = useFirebase();
    const playerRef = useMemoFirebase(() => (firestore ? doc(firestore, 'player_profiles', playerId) : null), [firestore, playerId]);
    const { data: player, isLoading } = useDoc<PlayerProfile>(playerRef);

    if (isLoading) return <Skeleton className="h-5 w-24" />;
    if (!player) return <span className="text-muted-foreground">Unknown Player</span>;

    return (
        <Link href={`/player/${player.id}`} className="font-semibold text-primary hover:underline">{player.ign}</Link>
    );
}

function RosterCard({ slot, org, currentPlayerProfile }: { slot: RosterSlot, org: OrganizationProfile, currentPlayerProfile: PlayerProfile | null }) {
    const { firestore } = useFirebase();
    const { toast } = useToast();

    const canApplyByRole = !!(currentPlayerProfile && currentPlayerProfile.role === slot.requiredRole);
    const canApplyByFd = !!(currentPlayerProfile && currentPlayerProfile.fdRatio >= slot.minFdRatio);
    const canApply = canApplyByRole && canApplyByFd;
    
    const isApplyButtonVisible = (slot.status === 'Vacant' || slot.status === 'Open for Replacement') && currentPlayerProfile;
    
    const handleApply = async () => {
        if (!canApply || !currentPlayerProfile || !firestore) {
            let errorDesc = 'You do not meet the requirements for this slot.';
            if (!canApplyByRole) {
                 errorDesc = `Your role (${currentPlayerProfile?.role}) does not match the required role (${slot.requiredRole}).`;
            } else if (!canApplyByFd) {
                 errorDesc = `Your F/D ratio (${currentPlayerProfile?.fdRatio}) does not meet the minimum requirement of ${slot.minFdRatio}.`;
            }
            toast({ variant: 'destructive', title: 'Cannot Apply', description: errorDesc });
            return;
        }

        try {
            const tryoutRequest: Omit<TryoutRequest, 'id'> = {
                organizationId: org.id,
                playerId: currentPlayerProfile.id,
                playerUserId: currentPlayerProfile.userId,
                organizationManagerUserId: org.userId,
                status: 'Pending',
                sentBy: 'Player',
                sentAt: new Date().toISOString(),
                isReadByOrg: false,
            };
            await addDoc(collection(firestore, 'tryout_requests'), tryoutRequest);
            toast({ title: 'Application Sent!', description: `Your application for the ${slot.slotName} position at ${org.name} has been sent.` });
        } catch (error) {
            console.error("Error sending application:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not send your application. Please try again.' });
        }
    };
    
    let tooltipMessage = '';
    if (isApplyButtonVisible && !canApply) {
        if (!canApplyByRole) {
            tooltipMessage = `Your profile role (${currentPlayerProfile?.role}) does not match the required role (${slot.requiredRole}).`;
        } else if (!canApplyByFd) {
             tooltipMessage = `Your F/D ratio (${currentPlayerProfile?.fdRatio}) does not meet the minimum of ${slot.minFdRatio}.`;
        }
    }

    return (
        <Card className="flex flex-col">
            <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between text-xl font-headline">
                    <span>{slot.slotName}</span>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span className='flex items-center gap-2'>{statusIcons[slot.status]} {slot.status}</span>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{slot.status}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </CardTitle>
                <CardDescription className="flex items-center gap-4 flex-wrap">
                    <Badge variant="outline" className="gap-2">{roleIcons[slot.requiredRole]} {slot.requiredRole}</Badge>
                    <Badge variant="outline">{slot.requiredPlaystyle}</Badge>
                    <Badge variant="outline" className="gap-2"><TrendingUp /> F/D &ge; {slot.minFdRatio}</Badge>
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
                <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    {slot.playerId ? <RosterPlayer playerId={slot.playerId} /> : <span className="text-muted-foreground">Slot is Vacant</span>}
                </div>
            </CardContent>
            {isApplyButtonVisible && (
                 <CardContent>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="w-full">
                                    <Button onClick={handleApply} disabled={!canApply} className="w-full">
                                        Apply Now
                                    </Button>
                                </div>
                            </TooltipTrigger>
                            {tooltipMessage && (
                                <TooltipContent>
                                    <p>{tooltipMessage}</p>
                                </TooltipContent>
                            )}
                        </Tooltip>
                    </TooltipProvider>
                </CardContent>
            )}
        </Card>
    );
}


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
    const { firestore, user, auth } = useFirebase();
    const params = useParams();
    const orgId = params.orgId as string;
    const router = useRouter();
    const { toast } = useToast();

    const handleLogout = async () => {
        if (!auth) return;
        try {
            await auth.signOut();
            toast({ title: "Logged Out", description: "You have been successfully logged out." });
            router.push('/');
        } catch (error) {
            console.error("Logout Error:", error);
            toast({ variant: "destructive", title: "Logout Failed", description: "Could not log you out. Please try again." });
        }
    };

    const orgRef = useMemoFirebase(
        () => (firestore && orgId ? doc(firestore, 'organization_profiles', orgId) : null),
        [firestore, orgId]
    );
    const { data: profile, isLoading } = useDoc<OrganizationProfile>(orgRef);

    const isOwner = user && profile && user.uid === profile.userId;

    const rosterSlotsQuery = useMemoFirebase(
        () => (firestore && orgId ? query(collection(firestore, 'roster_slots'), where('organizationId', '==', orgId)) : null),
        [firestore, orgId]
    );
    const { data: rosterSlots, isLoading: isLoadingRoster } = useCollection<RosterSlot>(rosterSlotsQuery);
    
    // Fetch current user's player profile
    const playerProfileQuery = useMemoFirebase(() => (
        firestore && user ? query(collection(firestore, 'player_profiles'), where('userId', '==', user.uid)) : null
    ), [firestore, user]);
    const { data: playerProfiles } = useCollection<PlayerProfile>(playerProfileQuery);
    const currentPlayerProfile = playerProfiles?.[0] ?? null;

    // Fetch current user's org profile (if they are an org manager)
    const orgProfileQuery = useMemoFirebase(() => (
        firestore && user ? query(collection(firestore, 'organization_profiles'), where('userId', '==', user.uid)) : null
    ), [firestore, user]);
    const { data: orgProfiles } = useCollection<OrganizationProfile>(orgProfileQuery);
    const currentOrgProfile = orgProfiles?.[0] ?? null;


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
                                <Link href={`/organization/${orgId}/dashboard/roster`}>
                                    <LayoutGrid className="mr-2 h-4 w-4" /> Dashboard
                                </Link>
                            </Button>
                        )}
                        <Button asChild variant="outline"><Link href="/players">Explore Players</Link></Button>
                        {user && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Avatar className="cursor-pointer h-10 w-10 border-2 border-transparent hover:border-primary">
                                        <AvatarImage src={currentOrgProfile?.logoUrl || currentPlayerProfile?.profilePictureUrl} />
                                        <AvatarFallback>{user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span>Logout</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 md:px-6 py-12">
                <Card className="overflow-hidden border-primary shadow-lg shadow-primary/10">
                    <div className="relative h-48 w-full">
                        <Image src={profile.bannerUrl || `https://picsum.photos/seed/${profile.id}/1200/400`} alt={`${profile.name} banner`} fill objectFit="cover" data-ai-hint="esports banner" />
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

                        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-8">
                                <Card>
                                    <CardHeader><CardTitle className="font-headline flex items-center gap-2"><Briefcase /> Current Roster</CardTitle></CardHeader>
                                    <CardContent>
                                        {isLoadingRoster && <Skeleton className="h-24 w-full" />}
                                        {rosterSlots && rosterSlots.length > 0 && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {rosterSlots.map(slot => (
                                                    <RosterCard key={slot.id} slot={slot} org={profile} currentPlayerProfile={currentPlayerProfile} />
                                                ))}
                                            </div>
                                        )}
                                        {!isLoadingRoster && (!rosterSlots || rosterSlots.length === 0) && (
                                            <p className="text-muted-foreground">No roster information available. The organization may be looking for a whole new team.</p>
                                        )}
                                    </CardContent>
                                </Card>

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
