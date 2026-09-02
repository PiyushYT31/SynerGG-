'use client';

import { useParams, useRouter } from 'next/navigation';
import { doc, collection, query, where, addDoc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import Link from 'next/link';

import { useFirebase, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { type PlayerProfile, type OrganizationProfile, type TryoutRequest, type SocialLink } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { User, Shield, Swords, Heart, Crosshair, Smartphone, Target, Scale, BrainCircuit, Youtube, Mail, Phone, Fingerprint, Gamepad2, Users, FileText, Edit, Trophy, ClipboardList, UserPlus, Lock, LogOut, Link2, Check, BarChart, Instagram, Twitter, Copy, ShieldCheck, AlertCircle, Upload, CheckCircle2, Loader2, XCircle, ImageIcon } from 'lucide-react';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { PlayerRadarChart } from '@/components/player-radar-chart';
import Image from 'next/image';
import { useState, useRef } from 'react';

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
  const { firestore, user, auth, firebaseApp } = useFirebase();
  const storage = firebaseApp ? getStorage(firebaseApp) : null;
  const params = useParams();
  const playerId = params.playerId as string;
  const { toast } = useToast();
  const router = useRouter();

  const [isVerifying, setIsVerifying] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'uploaded' | 'verifying' | 'verified' | 'failed'>('idle');
  const [verifyMessage, setVerifyMessage] = useState<string>('');
  const [extractedText, setExtractedText] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    // Check if a PENDING invite has already been sent from the current org to this player
    const existingRequestQuery = useMemoFirebase(() => (
      firestore && currentOrgProfile && profile
        ? query(
            collection(firestore, 'tryout_requests'),
            where('organizationId', '==', currentOrgProfile.id),
            where('playerId', '==', profile.id),
            where('sentBy', '==', 'Org'),
            where('status', '==', 'Pending')
          )
        : null
    ), [firestore, currentOrgProfile, profile]);
    const { data: existingRequests, isLoading: isLoadingExistingRequest } = useCollection<TryoutRequest>(existingRequestQuery);
    const hasPendingInvite = existingRequests && existingRequests.length > 0;

  const handleInvite = async () => {
      if (!currentOrgProfile || !profile || !firestore) {
          toast({ variant: 'destructive', title: 'Cannot Invite', description: 'You must be logged in as an organization to invite players.' });
          return;
      }

      if (isPlayerLocked) {
          toast({ variant: 'destructive', title: 'Cannot Invite', description: `${profile.ign} is already locked in ${lockedInOrg ? lockedInOrg.name : 'a team'}.` });
          return;
      }
      
      if (hasPendingInvite) {
          toast({ title: 'Already Invited', description: 'You have a pending invitation with this player.' });
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

  const isInviteButtonDisabled = isPlayerLocked || hasPendingInvite || !profile?.isVerified;

  let inviteButtonTooltip: string | null = null;
  if (!profile?.isVerified) {
    inviteButtonTooltip = `${profile?.ign || 'This player'} must verify their profile before they can receive tryout invitations.`;
  } else if (isPlayerLocked) {
    inviteButtonTooltip = `${profile?.ign || 'This player'} is currently locked in ${lockedInOrg ? lockedInOrg.name : 'another team\'s roster'}.`;
  } else if (hasPendingInvite) {
    inviteButtonTooltip = `You have a pending invitation with ${profile?.ign || 'this player'}.`;
  }

  const handleVerify = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    if (file.size > 5 * 1024 * 1024) {
        toast({ variant: 'destructive', title: 'File too large', description: 'Maximum image size is 5MB.' });
        return;
    }

    setIsVerifying(true);
    setVerifyStatus('idle');
    setVerifyMessage('');
    setExtractedText('');

    try {
        const reader = new FileReader();
        reader.onloadend = async () => {
            try {
                const base64 = reader.result as string;

                // Step 1: Show upload preview immediately
                setUploadPreview(base64);
                setVerifyStatus('uploaded');
                setVerifyMessage('Screenshot uploaded successfully!');
                toast({ title: 'Screenshot Uploaded', description: 'Your screenshot has been uploaded. Verifying...' });

                // Step 2: Start verification
                setVerifyStatus('verifying');
                setVerifyMessage('Analyzing screenshot... Please wait.');

                const res = await fetch('/api/verify-profile', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        base64Image: base64,
                        profileIgn: profile.ign,
                        profileUid: profile.bgmiUid,
                    }),
                });
                const result = await res.json();

                if (result.success) {
                    // Step 3a: OCR matched — now save to database FIRST
                    if (result.raw_text) setExtractedText(result.raw_text);

                    if (firestore) {
                        const profileRef = doc(firestore, 'player_profiles', playerId);
                        const updateData: Record<string, any> = {
                            isVerified: true,
                            verification_status: 'verified',
                            show_verified_badge: true,
                            verifiedIgn: profile.ign,
                            verifiedUid: profile.bgmiUid,
                            updatedAt: new Date().toISOString(),
                        };

                        // Try uploading screenshot to storage (best-effort)
                        if (storage) {
                            try {
                                const pureBase64 = base64.replace(/^data:image\/\w+;base64,/, '');
                                const storagePath = `verification_screenshots/${playerId}_${Date.now()}.jpg`;
                                const storageRef = ref(storage, storagePath);
                                await uploadString(storageRef, pureBase64, 'base64', { contentType: 'image/jpeg' });
                                const downloadUrl = await getDownloadURL(storageRef);
                                updateData.verificationScreenshotUrl = downloadUrl;
                            } catch (storageErr) {
                                console.warn('Screenshot upload failed, but verification is still saved:', storageErr);
                            }
                        }

                        try {
                            await updateDoc(profileRef, updateData);
                            console.log('Verification data saved to database successfully.');

                            // Only update UI AFTER database write succeeds
                            setVerifyStatus('verified');
                            setVerifyMessage('Profile verified successfully! Your verified badge is now active.');
                            toast({ title: '✅ ID Verified!', description: 'Your BGMI profile has been verified. Badge is now visible.' });
                        } catch (dbError: any) {
                            console.error('Failed to save verification to database:', dbError);
                            setVerifyStatus('failed');
                            setVerifyMessage('Verification matched but failed to save to database. Please try again.');
                            toast({ variant: 'destructive', title: '❌ Save Failed', description: 'Could not save verification status. Please try again.' });
                        }
                    } else {
                        console.error('Firestore not available — could not save verification.');
                        setVerifyStatus('failed');
                        setVerifyMessage('Database not available. Please refresh and try again.');
                        toast({ variant: 'destructive', title: '❌ Error', description: 'Database connection not available.' });
                    }
                } else {
                    // Step 3b: Failed — update Firestore with unverified state
                    if (firestore) {
                        try {
                            const profileRef = doc(firestore, 'player_profiles', playerId);
                            await updateDoc(profileRef, {
                                isVerified: false,
                                verification_status: 'unverified',
                                show_verified_badge: false,
                                updatedAt: new Date().toISOString(),
                            });
                        } catch (dbError) {
                            console.error('Failed to update unverified status:', dbError);
                        }
                    }
                    setVerifyStatus('failed');
                    setVerifyMessage(result.error || 'Verification failed. IGN or UID did not match.');
                    if (result.raw_text) setExtractedText(result.raw_text);
                    toast({ variant: 'destructive', title: '❌ Verification Failed', description: result.error });
                }
            } catch (innerErr: any) {
                console.error('Verification inner error:', innerErr);
                setVerifyStatus('failed');
                setVerifyMessage(innerErr.message || 'An error occurred during verification.');
                toast({ variant: 'destructive', title: 'Error', description: innerErr.message || 'Verification failed.' });
            } finally {
                setIsVerifying(false);
            }
        };
        reader.readAsDataURL(file);
    } catch (error: any) {
        console.error('Verification error:', error);
        setVerifyStatus('failed');
        setVerifyMessage(error.message || 'Could not process the image.');
        toast({ variant: 'destructive', title: 'Error', description: error.message || 'Could not complete verification. Please try again.' });
        setIsVerifying(false);
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
                           <Button 
                              onClick={handleInvite} 
                              disabled={isInviteButtonDisabled}
                              variant={hasPendingInvite ? 'secondary' : 'default'}
                            >
                              {hasPendingInvite ? <Check className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}
                              {hasPendingInvite ? 'Invite Sent' : 'Invite for Tryout'}
                            </Button>
                        </div>
                      </TooltipTrigger>
                      {inviteButtonTooltip && (
                        <TooltipContent>
                          <p>{inviteButtonTooltip}</p>
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
                            {(profile.isVerified || verifyStatus === 'verified') && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <ShieldCheck className="h-8 w-8 text-primary fill-primary/20" />
                                        </TooltipTrigger>
                                        <TooltipContent>Verified Player</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
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
                                   <div className="flex items-center gap-2 group cursor-pointer" 
                                        onClick={() => {
                                            navigator.clipboard.writeText(profile.bgmiUid);
                                            toast({
                                                title: "UID Copied!",
                                                description: "The BGMI UID has been copied to your clipboard.",
                                            });
                                        }}
                                   >
                                       <span className="font-mono text-lg">{profile.bgmiUid}</span>
                                       <span className="text-muted-foreground text-sm">(UID)</span>
                                       {(profile.isVerified || verifyStatus === 'verified') && (
                                           <TooltipProvider>
                                               <Tooltip>
                                                   <TooltipTrigger asChild>
                                                       <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-semibold">
                                                           <CheckCircle2 className="h-3.5 w-3.5" />
                                                           Verified
                                                       </span>
                                                   </TooltipTrigger>
                                                   <TooltipContent>UID verified via screenshot</TooltipContent>
                                               </Tooltip>
                                           </TooltipProvider>
                                       )}
                                       <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors"
                                       >
                                            <Copy className="h-4 w-4" />
                                       </Button>
                                   </div>
                               </div>
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
                                   <Phone className="h-5 w-5 text-muted-foreground" />
                                   <span>{profile.phoneNumber}</span>
                               </div>
                                {(profile.isVerified || verifyStatus === 'verified') ? (
                                    <div className="pt-4 border-t space-y-3">
                                        <div className="flex items-center gap-2 text-primary">
                                            <CheckCircle2 className="h-5 w-5" />
                                            <span className="font-semibold">Profile Verified</span>
                                        </div>
                                        {profile.verificationScreenshotUrl && (
                                            <Link href={profile.verificationScreenshotUrl} target="_blank" className="block">
                                                <div className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-primary/30 hover:border-primary transition-colors group cursor-pointer shadow-sm">
                                                    <Image
                                                        src={profile.verificationScreenshotUrl}
                                                        alt="Verification screenshot"
                                                        fill
                                                        className="object-cover transition-transform group-hover:scale-110"
                                                    />
                                                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Upload className="h-4 w-4 text-white" />
                                                    </div>
                                                    <div className="absolute -top-1 -right-1 bg-primary rounded-full p-0.5 shadow">
                                                        <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                                                    </div>
                                                </div>
                                                <span className="text-[10px] text-muted-foreground mt-1 block">Uploaded ID</span>
                                            </Link>
                                        )}
                                    </div>
                                ) : isOwner ? (
                                    <div className="pt-4 border-t space-y-4">
                                        {/* Header */}
                                        <div className="flex items-center gap-2 text-orange-500">
                                            <AlertCircle className="h-5 w-5" />
                                            <span className="font-semibold text-sm">Action Required: Verify ID</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            Upload a screenshot of your BGMI profile to unlock the verified badge.
                                        </p>

                                        {/* Upload Preview / Reference Image */}
                                        {uploadPreview ? (
                                            <div className="space-y-2">
                                                <div className="relative group">
                                                    <div className="relative aspect-video rounded-lg overflow-hidden border-2 border-primary/30 shadow-md">
                                                        <Image
                                                            src={uploadPreview}
                                                            alt="Your uploaded screenshot"
                                                            fill
                                                            className="object-cover"
                                                            unoptimized
                                                        />
                                                        <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/70 text-white text-[10px] font-medium px-2 py-1 rounded-full">
                                                            <ImageIcon className="h-3 w-3" />
                                                            Your Screenshot
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Step-by-step status indicator */}
                                                <div className="rounded-lg border p-3 space-y-2">
                                                    {verifyStatus === 'uploaded' && (
                                                        <div className="flex items-center gap-2 text-primary text-sm">
                                                            <CheckCircle2 className="h-4 w-4 shrink-0" />
                                                            <span className="font-medium">Screenshot uploaded</span>
                                                        </div>
                                                    )}
                                                    {verifyStatus === 'verifying' && (
                                                        <div className="flex items-center gap-2 text-yellow-500 text-sm">
                                                            <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                                                            <span className="font-medium">Analyzing screenshot...</span>
                                                        </div>
                                                    )}
                                                    {verifyStatus === 'failed' && (
                                                        <div className="flex items-center gap-2 text-destructive text-sm">
                                                            <XCircle className="h-4 w-4 shrink-0" />
                                                            <span className="font-medium">Verification Failed</span>
                                                        </div>
                                                    )}
                                                    {verifyMessage && (
                                                        <p className="text-xs text-muted-foreground leading-relaxed pl-6">
                                                            {verifyMessage}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Backend OCR Result */}
                                                {extractedText && (
                                                    <div className="mt-3 p-3 bg-muted/50 rounded-md border text-xs font-mono break-words text-muted-foreground shadow-inner">
                                                        <div className="font-semibold text-primary mb-1 text-[10px] uppercase tracking-wider flex items-center gap-1">
                                                            <FileText className="h-3 w-3" />
                                                            Backend OCR Result
                                                        </div>
                                                        {extractedText}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="relative group">
                                                <div className="relative aspect-video rounded-md overflow-hidden border">
                                                    <Image
                                                        src="/images/profile-reference.jpg"
                                                        alt="Verification Reference"
                                                        fill
                                                        className="object-cover transition-transform group-hover:scale-105"
                                                    />
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <span className="text-[10px] text-white font-medium bg-black/60 px-2 py-1 rounded">REFERENCE SCREENSHOT</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            ref={fileInputRef}
                                            onChange={handleVerify}
                                        />

                                        <Button
                                            variant={verifyStatus === 'failed' ? 'destructive' : 'secondary'}
                                            size="sm"
                                            className="w-full"
                                            disabled={isVerifying}
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            {isVerifying ? (
                                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...</>
                                            ) : verifyStatus === 'failed' ? (
                                                <><Upload className="mr-2 h-4 w-4" /> Try Again</>
                                            ) : uploadPreview ? (
                                                <><Upload className="mr-2 h-4 w-4" /> Re-upload Screenshot</>
                                            ) : (
                                                <><Upload className="mr-2 h-4 w-4" /> Upload Screenshot</>
                                            )}
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="pt-4 border-t flex items-center gap-2 text-muted-foreground">
                                        <Shield className="h-5 w-5" />
                                        <span className="text-sm italic">Unverified Profile</span>
                                    </div>
                                )}
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
