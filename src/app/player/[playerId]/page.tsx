'use client';

import { useParams, useRouter } from 'next/navigation';
import { doc, collection, query, where, addDoc } from 'firebase/firestore';
import Link from 'next/link';
import { format } from 'date-fns';

import { useFirebase, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { type PlayerProfile, type OrganizationProfile, type TryoutRequest, type SocialLink } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { User, Shield, Swords, Heart, Crosshair, Smartphone, Target, Scale, BrainCircuit, Youtube, Mail, Phone, Fingerprint, Gamepad2, Users, FileText, Edit, Trophy, ClipboardList, UserPlus, Lock, LogOut, Link2, Check, BarChart, Cake, Instagram, Twitter } from 'lucide-react';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { PlayerRadarChart } from '@/components/player-radar-chart';

const roleIcons: { [key: string]: React.ReactNode } = {
    'IGL': <BrainCircuit className="h-4 w-4" />,
    'Entry Fragger': <Swords className="h-4 w-4" />,
    'Support': <Heart className="h-4 w-4" />,
    'Assaulter': <Target className="h-4 w-4" />,
    'Sniper': <Crosshair className="h-4 w-4" />,
};

const socialIcons: { [key: string]: React.ReactNode } = {
    youtube: <Youtube className="h-5 w-5 text-red-500" />,
    instagram: <Instagram className="h-5 w-5 text-pink-500" />,
    twitter: <Twitter className="h-5 w-5 text-sky-500" />,
}


function ProfileSkeleton() {
    return (
      <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="flex flex-col md:flex-row items-start gap-8">
          <Skeleton className="h-40 w-40 rounded-full" />
          <div className="flex-grow space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
          <Card><CardHeader><Skeleton className="h-24 w-full" /></CardHeader></Card>
          <Card><CardHeader><Skeleton className="h-24 w-full" /></CardHeader></Card>
          <Card><CardHeader><Skeleton className="h-24 w-full" /></CardHeader></Card>
        </div>
      </div>
    );
  }

export default function PlayerProfilePage() {
  const { firestore, user, auth } = useFirebase();
  const params = useParams();
  const playerId = params.playerId as string;
  const { toast } = useToast();
  const router = useRouter();

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

  const playerRef = useMemoFirebase(
    () => (firestore && playerId ? doc(firestore, 'player_profiles', playerId) : null),
    [firestore, playerId]
  );
  
  const { data: profile, isLoading: isProfileLoading } = useDoc<PlayerProfile>(playerRef);
  const isOwner = user && profile && user.uid === profile.userId;

  // To see if current user is an org manager
  const orgProfileQuery = useMemoFirebase(() => (
      firestore && user ? query(collection(firestore, 'organization_profiles'), where('userId', '==', user.uid)) : null
  ), [firestore, user]);
  const { data: orgProfiles } = useCollection<OrganizationProfile>(orgProfileQuery);
  const currentOrgProfile = orgProfiles?.[0] ?? null;

  // Fetch current user's player profile if they are a player
  const currentPlayerProfileQuery = useMemoFirebase(() => (
      firestore && user ? query(collection(firestore, 'player_profiles'), where('userId', '==', user.uid)) : null
  ), [firestore, user]);
  const { data: currentPlayerProfiles } = useCollection<PlayerProfile>(currentPlayerProfileQuery);
  const currentPlayerProfile = currentPlayerProfiles?.[0] ?? null;


  // Check for new requests to show notification dot
  const newRequestsQuery = useMemoFirebase(() => (
    firestore && profile && isOwner ? query(collection(firestore, 'tryout_requests'), where('playerId', '==', profile.id), where('sentBy', '==', 'Org'), where('status', '==', 'Pending'), where('isReadByPlayer', '==', false)) : null
  ), [firestore, profile, isOwner]);
  const { data: newRequests } = useCollection<TryoutRequest>(newRequestsQuery);
  const hasNewRequests = newRequests && newRequests.length > 0;

  // Check if player is locked in a roster
  const lockedSlotQuery = useMemoFirebase(
    () => (firestore && profile ? query(collection(firestore, 'roster_slots'), where('playerId', '==', profile.id), where('status', '==', 'Locked')) : null),
    [firestore, profile]
  );
  const { data: lockedSlots, isLoading: isLockedSlotLoading } = useCollection(lockedSlotQuery);
  const isPlayerLocked = !!lockedSlots && lockedSlots.length > 0;

    // If player is locked, get the organization they are locked in
    const lockedInOrgId = lockedSlots?.[0]?.organizationId;
    const lockedInOrgRef = useMemoFirebase(
        () => (firestore && lockedInOrgId ? doc(firestore, 'organization_profiles', lockedInOrgId) : null),
        [firestore, lockedInOrgId]
    );
    const { data: lockedInOrg, isLoading: isOrgLoading } = useDoc<OrganizationProfile>(lockedInOrgRef);

    // Check if an invite has already been sent from the current org to this player
    const existingRequestQuery = useMemoFirebase(() => (
      firestore && currentOrgProfile && profile
        ? query(
            collection(firestore, 'tryout_requests'),
            where('organizationId', '==', currentOrgProfile.id),
            where('playerId', '==', profile.id),
            where('sentBy', '==', 'Org')
          )
        : null
    ), [firestore, currentOrgProfile, profile]);
    const { data: existingRequests, isLoading: isLoadingExistingRequest } = useCollection<TryoutRequest>(existingRequestQuery);
    const hasSentInvite = existingRequests && existingRequests.length > 0;

  const handleInvite = async () => {
      if (!currentOrgProfile || !profile || !firestore) {
          toast({ variant: 'destructive', title: 'Cannot Invite', description: 'You must be logged in as an organization to invite players.' });
          return;
      }

      if (isPlayerLocked) {
          toast({ variant: 'destructive', title: 'Cannot Invite', description: `${profile.ign} is already locked in ${lockedInOrg ? lockedInOrg.name : 'a team'}.` });
          return;
      }
      
      if (hasSentInvite) {
          toast({ title: 'Already Invited', description: 'You have already sent an invitation to this player.' });
          return;
      }

      try {
          const tryoutRequest: Omit<TryoutRequest, 'id'> = {
              organizationId: currentOrgProfile.id,
              playerId: profile.id,
              playerUserId: profile.userId,
              organizationManagerUserId: currentOrgProfile.userId,
              status: 'Pending',
              sentBy: 'Org',
              sentAt: new Date().toISOString(),
              message: `Invitation to join ${currentOrgProfile.name}`,
              isReadByPlayer: false,
          };
          await addDoc(collection(firestore, 'tryout_requests'), tryoutRequest);
          toast({ title: 'Invitation Sent!', description: `Your invitation has been sent to ${profile.ign}.` });
      } catch (error) {
          console.error("Error sending invitation:", error);
          toast({ variant: 'destructive', title: 'Error', description: 'Could not send your invitation. Please try again.' });
      }
  };


  const isLoading = isProfileLoading || isLockedSlotLoading || isOrgLoading || isLoadingExistingRequest;

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
              <CardDescription>The player profile you are looking for does not exist.</CardDescription>
            </CardHeader>
          </Card>
        </main>
      </div>
    );
  }
  
  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Logo />
            <div className="flex items-center gap-4">
                {isOwner && (
                    <>
                        <Button asChild variant="secondary" className="relative">
                            <Link href="/my-requests">
                                 <ClipboardList className="mr-2 h-4 w-4" /> My Requests
                                 {hasNewRequests && <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-background" />}
                            </Link>
                        </Button>
                        <Button asChild>
                            <Link href={`/player/${playerId}/edit`}>
                                 <Edit className="mr-2 h-4 w-4" /> Edit Profile
                            </Link>
                        </Button>
                    </>
                )}
                {currentOrgProfile && !isOwner && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="inline-block"> {/* Wrapper for disabled button */}
                                    {hasSentInvite ? (
                                        <Button disabled variant="secondary">
                                            <Check className="mr-2 h-4 w-4" /> Invite Sent!
                                        </Button>
                                    ) : (
                                        <Button onClick={handleInvite} disabled={isPlayerLocked}>
                                            <UserPlus className="mr-2 h-4 w-4" /> Invite for Tryout
                                        </Button>
                                    )}
                                </div>
                            </TooltipTrigger>
                            {isPlayerLocked && !hasSentInvite && (
                                <TooltipContent>
                                    <p>{profile.ign} is currently locked in {lockedInOrg ? lockedInOrg.name : 'another team\'s roster'}.</p>
                                </TooltipContent>
                            )}
                             {hasSentInvite && (
                                <TooltipContent>
                                    <p>You have already sent an invitation to {profile.ign}.</p>
                                </TooltipContent>
                            )}
                        </Tooltip>
                    </TooltipProvider>
                )}
                <Button asChild variant="outline"><Link href="/organizations">Explore Organizations</Link></Button>
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
        <Card className="overflow-hidden border-secondary shadow-lg shadow-secondary/10">
            <div className="p-6">
                <div className="flex flex-col sm:flex-row items-start gap-6">
                    <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
                        <AvatarImage src={profile.profilePictureUrl} alt={profile.ign} />
                        <AvatarFallback>{profile.ign.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-grow pt-2">
                        <CardTitle className="font-headline text-4xl flex items-center gap-4">
                            {profile.ign}
                            {isPlayerLocked && (
                                <Badge variant="destructive" className="gap-2 text-base py-1 px-3">
                                    <Lock className="h-4 w-4" />
                                    Locked in {lockedInOrg ? <Link href={`/organization/${lockedInOrg.id}`} className="hover:underline">{lockedInOrg.name}</Link> : 'a team'}
                                </Badge>
                            )}
                        </CardTitle>
                        <CardDescription className="text-xl text-muted-foreground">{profile.playerName}</CardDescription>
                        <div className="flex flex-wrap gap-2 mt-4 text-sm">
                           <Badge variant="default" className="gap-2 text-base py-1 px-3">
                                {roleIcons[profile.role]}
                                {profile.role}
                            </Badge>
                             <Badge variant="secondary" className="gap-2 text-base py-1 px-3">
                                <Scale className="h-4 w-4" />
                                {profile.playstyle}
                            </Badge>
                            <Badge variant="secondary" className="gap-2 text-base py-1 px-3">
                                <Smartphone className="h-4 w-4" />
                                {profile.device}
                            </Badge>
                        </div>
                    </div>
                     <div className="flex-shrink-0">
                        <Card className="bg-accent">
                            <CardContent className="p-4 text-center">
                                <p className="font-headline text-3xl">{profile.fdRatio.toFixed(1)}</p>
                                <p className="text-sm text-muted-foreground">F/D RATIO</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="mt-8 grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-6">
                         {profile.achievements && profile.achievements.length > 0 && (
                            <Card>
                                <CardHeader><CardTitle className="font-headline flex items-center gap-2"><Trophy /> Achievements</CardTitle></CardHeader>
                                <CardContent className="flex flex-wrap gap-2">
                                    {profile.achievements.map((ach, i) => <Badge key={i} variant="outline">{ach}</Badge>)}
                                </CardContent>
                            </Card>
                        )}
                         {profile.playerStats && (
                            <Card>
                                <CardHeader><CardTitle className="font-headline flex items-center gap-2"><BarChart /> Player Skills</CardTitle></CardHeader>
                                <CardContent className="h-80">
                                    <PlayerRadarChart stats={profile.playerStats} />
                                </CardContent>
                            </Card>
                        )}
                        <Card>
                            <CardHeader><CardTitle className="font-headline flex items-center gap-2"><FileText /> Experience</CardTitle></CardHeader>
                            <CardContent><p className="text-muted-foreground whitespace-pre-wrap">{profile.experience}</p></CardContent>
                        </Card>
                         <Card>
                            <CardHeader><CardTitle className="font-headline flex items-center gap-2"><Users /> Ideal Teammates & Strategy</CardTitle></CardHeader>
                            <CardContent><p className="text-muted-foreground whitespace-pre-wrap">{profile.idealTeammateStrategy}</p></CardContent>
                        </Card>
                    </div>
                    <div className="space-y-6">
                        <Card>
                           <CardHeader><CardTitle className="font-headline">Player Details</CardTitle></CardHeader>
                           <CardContent className="space-y-4">
                               <div className="flex items-center gap-3">
                                   <Gamepad2 className="h-5 w-5 text-muted-foreground" />
                                   <span>{profile.ign} (IGN)</span>
                               </div>
                                <div className="flex items-center gap-3">
                                   <Fingerprint className="h-5 w-5 text-muted-foreground" />
                                   <span>{profile.bgmiUid} (UID)</span>
                               </div>
                               {profile.dateOfBirth && (
                                <div className="flex items-center gap-3">
                                    <Cake className="h-5 w-5 text-muted-foreground" />
                                    <span>{format(new Date(profile.dateOfBirth), 'MMMM dd, yyyy')}</span>
                                </div>
                               )}
                           </CardContent>
                        </Card>
                         {profile.povLinks && profile.povLinks.length > 0 && (
                            <Card>
                                <CardHeader><CardTitle className="font-headline flex items-center gap-2"><Youtube className="text-red-500" /> POV Links</CardTitle></CardHeader>
                                <CardContent className="space-y-2">
                                    {profile.povLinks.map((link, i) => (
                                        <Button asChild variant="outline" className="w-full justify-start" key={i}>
                                            <Link href={`/player/${profile.id}/vod/${link.id}`}>
                                                <Link2 className="mr-2 h-4 w-4" />
                                                {link.name}
                                            </Link>
                                        </Button>
                                    ))}
                                </CardContent>
                            </Card>
                        )}
                        <Card>
                            <CardHeader><CardTitle className="font-headline">Contact & Socials</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Mail className="h-5 w-5 text-muted-foreground" />
                                    <span>{profile.email}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Phone className="h-5 w-5 text-muted-foreground" />
                                    <span>{profile.phoneNumber}</span>
                                </div>
                                 {profile.socialLinks && profile.socialLinks.length > 0 && (
                                    <div className="space-y-2 pt-4 border-t">
                                    {profile.socialLinks.map((link) => (
                                        <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm hover:text-primary">
                                            {socialIcons[link.name as keyof typeof socialIcons]}
                                            <span className="truncate">{link.url}</span>
                                        </a>
                                    ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </Card>
      </main>
    </div>
  );
}

    
