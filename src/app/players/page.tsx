'use client';

import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, CollectionReference, DocumentData } from 'firebase/firestore';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Logo } from '@/components/logo';
import { type PlayerProfile } from '@/lib/types';
import { ArrowLeft, BrainCircuit, Swords, Heart, Target, Crosshair, User, UserPlus, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const roleIcons: { [key: string]: React.ReactNode } = {
    'IGL': <BrainCircuit className="h-4 w-4" />,
    'Entry Fragger': <Swords className="h-4 w-4" />,
    'Support': <Heart className="h-4 w-4" />,
    'Assaulter': <Target className="h-4 w-4" />,
    'Sniper': <Crosshair className="h-4 w-4" />,
    'Substitute': <UserPlus className="h-4 w-4" />,
};

const ROLES = ['IGL', 'Entry Fragger', 'Support', 'Assaulter', 'Sniper', 'Substitute'];
const PLAYSTYLES = ['Aggressive', 'Tactical', 'Balanced', 'Passive'];
const DEVICES = ['iOS', 'Android'];

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
    const [filters, setFilters] = useState<{ role: string; playstyle: string; device: string }>({
        role: '',
        playstyle: '',
        device: '',
    });

    const handleFilterChange = (filterName: keyof typeof filters, value: string) => {
        // "all" is a special value from SelectItem to clear the filter.
        setFilters(prev => ({ ...prev, [filterName]: value === 'all' ? '' : value }));
    };

    const clearFilters = () => {
        setFilters({ role: '', playstyle: '', device: '' });
    };

    const isAnyFilterActive = Object.values(filters).some(val => val !== '');

    const playersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        
        let q: CollectionReference | Query = collection(firestore, 'player_profiles');
        
        if (filters.role) {
            q = query(q, where('role', '==', filters.role));
        }
        if (filters.playstyle) {
            q = query(q, where('playstyle', '==', filters.playstyle));
        }
        if (filters.device) {
            q = query(q, where('device', '==', filters.device));
        }
        
        return q as Query<DocumentData>;
    }, [firestore, filters]);

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
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold font-headline tracking-tighter sm:text-5xl">Scout for Players</h1>
                    <p className="max-w-2xl mx-auto mt-4 text-muted-foreground">
                        Browse through the list of talented players looking for a team.
                    </p>
                </div>

                <Card className="mb-8 p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                        <div className="flex items-center gap-2 font-headline">
                            <Filter className="h-5 w-5"/>
                            <h3 className="text-lg font-semibold">Filters</h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-grow w-full sm:w-auto">
                            <div>
                                <Label htmlFor="role-filter" className="sr-only">Role</Label>
                                <Select value={filters.role} onValueChange={(value) => handleFilterChange('role', value)}>
                                    <SelectTrigger id="role-filter"><SelectValue placeholder="Filter by Role" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Roles</SelectItem>
                                        {ROLES.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                             <div>
                                <Label htmlFor="playstyle-filter" className="sr-only">Playstyle</Label>
                                <Select value={filters.playstyle} onValueChange={(value) => handleFilterChange('playstyle', value)}>
                                    <SelectTrigger id="playstyle-filter"><SelectValue placeholder="Filter by Playstyle" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Playstyles</SelectItem>
                                        {PLAYSTYLES.map(style => <SelectItem key={style} value={style}>{style}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="device-filter" className="sr-only">Device</Label>
                                <Select value={filters.device} onValueChange={(value) => handleFilterChange('device', value)}>
                                    <SelectTrigger id="device-filter"><SelectValue placeholder="Filter by Device" /></SelectTrigger>
                                    <SelectContent>
                                         <SelectItem value="all">All Devices</SelectItem>
                                        {DEVICES.map(device => <SelectItem key={device} value={device}>{device}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        {isAnyFilterActive && (
                            <Button variant="ghost" onClick={clearFilters} className="text-muted-foreground">
                                <X className="mr-2 h-4 w-4" />
                                Clear
                            </Button>
                        )}
                    </div>
                </Card>

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
                            <p>No players match the current filters. Try clearing them.</p>
                        </CardContent>
                    </Card>
                 )}
            </main>
        </div>
    );
}
