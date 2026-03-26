'use client';

import { useParams } from 'next/navigation';
import { doc } from 'firebase/firestore';
import Image from 'next/image';
import Link from 'next/link';

import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { type PlayerProfile } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { User, Shield, Swords, Heart, Crosshair, Smartphone, Target, Scale, BrainCircuit, Youtube, Mail, Phone, Fingerprint, Gamepad2, Users, FileText } from 'lucide-react';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';

const roleIcons: { [key: string]: React.ReactNode } = {
    'IGL': <BrainCircuit className="h-4 w-4" />,
    'Entry Fragger': <Swords className="h-4 w-4" />,
    'Support': <Heart className="h-4 w-4" />,
    'Assaulter': <Target className="h-4 w-4" />,
    'Sniper': <Crosshair className="h-4 w-4" />,
};

function getYouTubeThumbnail(url: string) {
    if (!url) return null;
    const videoIdMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (videoIdMatch) return `https://i.ytimg.com/vi/${videoIdMatch[1]}/hqdefault.jpg`;
    
    // Simple check for Google Drive link
    if (url.includes('drive.google.com')) {
        // We can't generate a thumbnail, so we'll use a generic icon
        return '/gdrive.png'; // You'd need to add a generic Drive icon to your public folder
    }
    return null;
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
  const { firestore } = useFirebase();
  const params = useParams();
  const playerId = params.playerId as string;

  const playerRef = useMemoFirebase(
    () => (firestore && playerId ? doc(firestore, 'player_profiles', playerId) : null),
    [firestore, playerId]
  );
  
  const { data: profile, isLoading } = useDoc<PlayerProfile>(playerRef);

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
  
  const thumbnail = getYouTubeThumbnail(profile.highlightsUrl);

  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Logo />
           <Button asChild variant="outline"><Link href="/">Explore More Profiles</Link></Button>
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
                        <CardTitle className="font-headline text-4xl">{profile.ign}</CardTitle>
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
                        <Card>
                            <CardHeader><CardTitle className="font-headline flex items-center gap-2"><FileText /> Experience</CardTitle></CardHeader>
                            <CardContent><p className="text-muted-foreground whitespace-pre-wrap">{profile.experience}</p></CardContent>
                        </Card>
                         <Card>
                            <CardHeader><CardTitle className="font-headline flex items-center gap-2"><Users /> Ideal Teammates & Strategy</CardTitle></CardHeader>
                            <CardContent><p className="text-muted-foreground whitespace-pre-wrap">{profile.idealTeammateStrategy}</p></CardContent>
                        </Card>
                        {thumbnail && (
                            <Card>
                                <CardHeader><CardTitle className="font-headline flex items-center gap-2"><Youtube className="text-red-500" /> Gameplay Highlights</CardTitle></CardHeader>
                                <CardContent>
                                    <Link href={profile.highlightsUrl} target="_blank" rel="noopener noreferrer" className="block relative aspect-video">
                                    <Image
                                        src={thumbnail}
                                        alt="Gameplay highlights"
                                        fill
                                        objectFit="cover"
                                        className="rounded-lg border-2 border-transparent hover:border-primary transition-all cursor-pointer"
                                    />
                                    </Link>
                                </CardContent>
                            </Card>
                        )}
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
                           </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle className="font-headline">Contact</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Mail className="h-5 w-5 text-muted-foreground" />
                                    <span>{profile.email}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Phone className="h-5 w-5 text-muted-foreground" />
                                    <span>{profile.phoneNumber}</span>
                                </div>
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
