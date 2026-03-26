'use client';

import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Logo } from '@/components/logo';
import { type PlayerProfile } from '@/lib/types';
import { ArrowLeft, BrainCircuit, Swords, Heart, Target, Crosshair, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

const roleIcons: { [key: string]: React.ReactNode } = {
    'IGL': <BrainCircuit className="h-4 w-4" />,
    'Entry Fragger': <Swords className="h-4 w-4" />,
    'Support': <Heart className="h-4 w-4" />,
    'Assaulter': <Target className="h-4 w-4" />,
    'Sniper': <Crosshair className="h-4 w-4" />,
};

function PlayerCard({ profile }: { profile: PlayerProfile }) {
    return (
        <Link href={`/player/${profile.id}`}>
            <Card className="h-full transition-all hover:border-primary hover:shadow-lg hover:-translate-y-1">
                <CardHeader className="flex-row items-start gap-4">
                    <Avatar className="h-16 w-16 border">
                        <AvatarImage src={profile.profilePictureUrl} alt={profile.ign} />
                        <AvatarFallback>{profile.ign.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <CardTitle className="font-headline text-2xl">{profile.ign}</CardTitle>
                        <p className="text-muted-foreground">{profile.playerName}</p>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                        <Badge variant="default" className="gap-2 text-base">
                            {roleIcons[profile.role] || <User />}
                            {profile.role}
                        </Badge>
                        <div className="text-right">
                            <p className="font-bold text-lg">{profile.fdRatio.toFixed(1)}</p>
                            <p className="text-xs text-muted-foreground">F/D RATIO</p>
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{profile.experience}</p>
                </CardContent>
            </Card>
        </Link>
    );
}

function PlayerListSkeleton() {
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

export default function PlayersPage() {
    const { firestore } = useFirebase();

    const playersQuery = useMemoFirebase(
        () => (firestore ? collection(firestore, 'player_profiles') : null),
        [firestore]
    );
    const { data: players, isLoading } = useCollection<PlayerProfile>(playersQuery);

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
                    <h1 className="text-4xl font-bold font-headline tracking-tighter sm:text-5xl">Scout for Players</h1>
                    <p className="max-w-2xl mx-auto mt-4 text-muted-foreground">
                        Browse through the list of talented players looking for a team.
                    </p>
                </div>
                {isLoading && <PlayerListSkeleton />}
                {!isLoading && players && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {players.map(player => (
                            <PlayerCard key={player.id} profile={player} />
                        ))}
                    </div>
                )}
                 {!isLoading && (!players || players.length === 0) && (
                    <Card className="text-center py-12">
                        <CardHeader>
                            <CardTitle>No Players Found</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>There are no player profiles available at the moment.</p>
                        </CardContent>
                    </Card>
                 )}
            </main>
        </div>
    );
}
