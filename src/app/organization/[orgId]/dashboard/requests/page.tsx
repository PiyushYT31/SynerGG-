'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { collection, query, where, doc, updateDoc, getDoc, getDocs, writeBatch } from 'firebase/firestore';
import Link from 'next/link';

import { useFirebase, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { type TryoutRequest, type PlayerProfile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { Check, X } from 'lucide-react';

function PlayerInfo({ playerId }: { playerId: string }) {
    const { firestore } = useFirebase();
    const playerRef = useMemoFirebase(() => doc(firestore, 'player_profiles', playerId), [firestore, playerId]);
    const { data: player, isLoading } = useDoc<PlayerProfile>(playerRef);

    if (isLoading) return <Skeleton className="h-10 w-32" />;
    if (!player) return <p>Unknown Player</p>;

    return (
        <div className="flex items-center gap-3">
            <Avatar>
                <AvatarImage src={player.profilePictureUrl} />
                <AvatarFallback>{player.ign.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <div>
                <Link href={`/player/${playerId}`} className="font-semibold hover:underline">{player.ign}</Link>
                <p className="text-sm text-muted-foreground">{player.role}</p>
            </div>
        </div>
    );
}

function RequestCard({ request }: { request: TryoutRequest }) {
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);

    const handleResponse = async (status: 'Accepted' | 'Declined') => {
        if (!firestore) return;
        setIsProcessing(true);
        try {
            if (status === 'Accepted') {
                // 1. Get player's profile to find their role
                const playerRef = doc(firestore, 'player_profiles', request.playerId);
                const playerSnap = await getDoc(playerRef);

                if (!playerSnap.exists()) {
                    throw new Error("Player profile not found.");
                }
                const player = playerSnap.data() as PlayerProfile;

                // 2. Find a vacant roster slot for that role
                const slotsQuery = query(
                    collection(firestore, 'roster_slots'),
                    where('organizationId', '==', request.organizationId),
                    where('status', 'in', ['Vacant', 'Open for Replacement']),
                    where('requiredRole', '==', player.role)
                );
                const slotsSnap = await getDocs(slotsQuery);

                if (slotsSnap.empty) {
                    // No slot available, just accept the request without assigning
                    await updateDoc(doc(firestore, 'tryout_requests', request.id), {
                        status,
                        respondedAt: new Date().toISOString(),
                    });
                    toast({ 
                        title: 'Request Accepted', 
                        description: `${player.ign} has been accepted, but no vacant roster slot was found for their role. Please create one.` 
                    });
                } else {
                    // Slot found, update both request and slot atomically
                    const batch = writeBatch(firestore);
                    
                    const requestRef = doc(firestore, 'tryout_requests', request.id);
                    batch.update(requestRef, {
                        status,
                        respondedAt: new Date().toISOString(),
                    });

                    const slotRef = slotsSnap.docs[0].ref; // Update the first available slot
                    batch.update(slotRef, {
                        playerId: player.id,
                        status: 'Locked'
                    });

                    await batch.commit();

                    toast({ 
                        title: 'Success!', 
                        description: `${player.ign} has been accepted and added to the roster.` 
                    });
                }
            } else { // status is 'Declined'
                await updateDoc(doc(firestore, 'tryout_requests', request.id), {
                    status,
                    respondedAt: new Date().toISOString(),
                });
                toast({ title: 'Success', description: `Request has been ${status.toLowerCase()}.` });
            }
        } catch (error: any) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Error', description: error.message || `Could not update request status.` });
        } finally {
            setIsProcessing(false);
        }
    };
    
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <PlayerInfo playerId={request.playerId} />
                <p className="text-sm text-muted-foreground">{formatDistanceToNow(new Date(request.sentAt), { addSuffix: true })}</p>
            </CardHeader>
            <CardContent>
                {request.message && (
                    <blockquote className="mt-2 border-l-2 pl-6 italic text-muted-foreground">
                        {request.message}
                    </blockquote>
                )}
                 <div className="mt-4 flex gap-2">
                    <Button onClick={() => handleResponse('Accepted')} disabled={isProcessing} size="sm">
                        <Check className="mr-2 h-4 w-4" /> Accept
                    </Button>
                    <Button onClick={() => handleResponse('Declined')} disabled={isProcessing} size="sm" variant="destructive">
                        <X className="mr-2 h-4 w-4" /> Decline
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}


export default function TryoutRequestsPage() {
  const params = useParams();
  const orgId = params.orgId as string;
  const { firestore } = useFirebase();

  const requestsQuery = useMemoFirebase(
    () => firestore && orgId 
        ? query(
            collection(firestore, 'tryout_requests'), 
            where('organizationId', '==', orgId),
            where('status', '==', 'Pending'),
            where('sentBy', '==', 'Player')
          ) 
        : null,
    [firestore, orgId]
  );
  
  const { data: requests, isLoading } = useCollection<TryoutRequest>(requestsQuery);

  return (
     <div>
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold font-headline">Incoming Requests</h2>
        </div>
        {isLoading ? (
            <div className="space-y-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
            </div>
        ) : requests && requests.length > 0 ? (
            <div className="space-y-4">
                {requests.map(req => <RequestCard key={req.id} request={req} />)}
            </div>
        ) : (
            <Card className="text-center py-12">
                <CardHeader><CardTitle>No Pending Requests</CardTitle></CardHeader>
                <CardContent><p>You currently have no new tryout requests from players.</p></CardContent>
            </Card>
        )}
    </div>
  );
}
