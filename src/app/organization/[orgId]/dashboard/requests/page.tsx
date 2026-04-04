'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { collection, query, where, doc, updateDoc, getDoc, getDocs, writeBatch } from 'firebase/firestore';
import Link from 'next/link';

import { useFirebase, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { type TryoutRequest, type PlayerProfile, type OrganizationProfile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow, format } from 'date-fns';
import { Check, X, FileSignature, ShieldCheck } from 'lucide-react';
import { MoUDialog } from '@/components/mou-dialog';
import { Badge } from '@/components/ui/badge';

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

function RequestCard({ request, organization }: { request: TryoutRequest, organization: OrganizationProfile }) {
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);
    const [isMouOpen, setIsMouOpen] = useState(false);

    const playerRef = useMemoFirebase(() => firestore ? doc(firestore, 'player_profiles', request.playerId) : null, [firestore, request.playerId]);
    const {data: player} = useDoc<PlayerProfile>(playerRef);

    const handleResponse = async (status: 'Accepted' | 'Declined') => {
        if (!firestore) return;
        setIsProcessing(true);
        try {
            const requestRef = doc(firestore, 'tryout_requests', request.id);

            if (status === 'Accepted') {
                const playerSnap = await getDoc(playerRef!);

                if (!playerSnap.exists()) throw new Error("Player profile not found.");
                
                const player = playerSnap.data() as PlayerProfile;

                const slotsQuery = query(
                    collection(firestore, 'roster_slots'),
                    where('organizationId', '==', request.organizationId),
                    where('status', 'in', ['Vacant', 'Open for Replacement']),
                    where('requiredRole', '==', player.role)
                );
                const slotsSnap = await getDocs(slotsQuery);

                if (slotsSnap.empty) {
                    await updateDoc(requestRef, {
                        status,
                        respondedAt: new Date().toISOString(),
                        mouGeneratedAt: new Date().toISOString(),
                    });
                    toast({ 
                        title: 'Request Accepted', 
                        description: `${player.ign} has been accepted, but no vacant roster slot was found. An MoU has been generated.` 
                    });
                } else {
                    const batch = writeBatch(firestore);
                    
                    batch.update(requestRef, {
                        status,
                        respondedAt: new Date().toISOString(),
                        mouGeneratedAt: new Date().toISOString(),
                    });

                    const slotRef = slotsSnap.docs[0].ref;
                    batch.update(slotRef, {
                        playerId: playerSnap.id,
                        status: 'Locked'
                    });

                    await batch.commit();

                    toast({ 
                        title: 'Success!', 
                        description: `${player.ign} has been accepted and added to the roster. An MoU has been generated.` 
                    });
                }
            } else {
                await updateDoc(requestRef, {
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
        <>
        {player && (
            <MoUDialog 
                request={request}
                player={player}
                organization={organization}
                open={isMouOpen}
                onOpenChange={setIsMouOpen}
                currentUserType="org"
            />
        )}
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <PlayerInfo playerId={request.playerId} />
                <div className="text-right">
                    <p className="text-sm text-muted-foreground">{formatDistanceToNow(new Date(request.sentAt), { addSuffix: true })}</p>
                    <Badge variant={request.status === 'Pending' ? 'default' : request.status === 'Accepted' ? 'secondary' : 'destructive'} className="mt-1">{request.status}</Badge>
                </div>
            </CardHeader>
            <CardContent>
                {request.message && (
                    <blockquote className="mt-2 border-l-2 pl-6 italic text-muted-foreground">
                        {request.message}
                    </blockquote>
                )}
                 <div className="mt-4 flex flex-wrap gap-2">
                    {request.status === 'Pending' && (
                        <>
                            <Button onClick={() => handleResponse('Accepted')} disabled={isProcessing} size="sm">
                                <Check className="mr-2 h-4 w-4" /> Accept
                            </Button>
                            <Button onClick={() => handleResponse('Declined')} disabled={isProcessing} size="sm" variant="destructive">
                                <X className="mr-2 h-4 w-4" /> Decline
                            </Button>
                        </>
                    )}
                    {request.status === 'Accepted' && request.mouGeneratedAt && (
                         <Button onClick={() => setIsMouOpen(true)} size="sm" variant="outline">
                            <FileSignature className="mr-2" /> 
                            {request.mouOrgConfirmedAt ? 'View Confirmed MoU' : 'View & Confirm MoU'}
                        </Button>
                    )}
                </div>
                {request.mouOrgConfirmedAt && (
                    <p className="text-sm text-green-600 mt-3 flex items-center gap-2">
                        <ShieldCheck /> You confirmed this agreement on {format(new Date(request.mouOrgConfirmedAt), 'PP')}.
                    </p>
                )}
            </CardContent>
        </Card>
        </>
    )
}


export default function TryoutRequestsPage() {
  const params = useParams();
  const orgId = params.orgId as string;
  const { firestore } = useFirebase();

  const orgRef = useMemoFirebase(() => (firestore && orgId ? doc(firestore, 'organization_profiles', orgId) : null), [firestore, orgId]);
  const { data: organizationProfile, isLoading: isOrgLoading } = useDoc<OrganizationProfile>(orgRef);

  const requestsQuery = useMemoFirebase(
    () => firestore && orgId 
        ? query(
            collection(firestore, 'tryout_requests'), 
            where('organizationId', '==', orgId),
            where('sentBy', '==', 'Player')
          ) 
        : null,
    [firestore, orgId]
  );
  
  const { data: allRequests, isLoading: areRequestsLoading } = useCollection<TryoutRequest>(requestsQuery);

  const pendingRequests = allRequests?.filter(r => r.status === 'Pending') ?? [];
  const acceptedRequests = allRequests?.filter(r => r.status === 'Accepted') ?? [];
  
  useEffect(() => {
    if (!firestore || !allRequests) return;

    const unreadRequests = allRequests.filter(r => r.status === 'Pending' && r.isReadByOrg === false);

    if (unreadRequests.length > 0) {
        const batch = writeBatch(firestore);
        unreadRequests.forEach(req => {
            const requestRef = doc(firestore, 'tryout_requests', req.id);
            batch.update(requestRef, { isReadByOrg: true });
        });
        batch.commit().catch(console.error);
    }
}, [allRequests, firestore]);

  const isLoading = areRequestsLoading || isOrgLoading;

  return (
     <div className="space-y-8">
        <div>
            <h2 className="text-2xl font-bold font-headline mb-6">Incoming Applications</h2>
            {isLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                </div>
            ) : pendingRequests.length > 0 && organizationProfile ? (
                <div className="space-y-4">
                    {pendingRequests.map(req => <RequestCard key={req.id} request={req} organization={organizationProfile} />)}
                </div>
            ) : (
                <Card className="text-center py-12">
                    <CardHeader><CardTitle>No Pending Applications</CardTitle></CardHeader>
                    <CardContent><p>You currently have no new tryout applications from players.</p></CardContent>
                </Card>
            )}
        </div>
        <div>
            <h2 className="text-2xl font-bold font-headline mb-6">Accepted Players & Agreements</h2>
            {isLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-32 w-full" />
                </div>
            ) : acceptedRequests.length > 0 && organizationProfile ? (
                <div className="space-y-4">
                    {acceptedRequests.map(req => <RequestCard key={req.id} request={req} organization={organizationProfile} />)}
                </div>
            ) : (
                <Card className="text-center py-12">
                    <CardHeader><CardTitle>No Accepted Players</CardTitle></CardHeader>
                    <CardContent><p>Accepted player applications will appear here.</p></CardContent>
                </Card>
            )}
        </div>
    </div>
  );
}
