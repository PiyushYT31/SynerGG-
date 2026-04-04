'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, query, where, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { useFirebase, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { type TryoutRequest, type OrganizationProfile, type PlayerProfile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { Check, X, ArrowLeft, Mail, LogOut, ArrowRight } from 'lucide-react';
import { Logo } from '@/components/logo';
import { Badge } from '@/components/ui/badge';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

// Component to show Organization Info for a request
function OrgInfo({ orgId }: { orgId: string }) {
    const { firestore } = useFirebase();
    const orgRef = useMemoFirebase(() => doc(firestore, 'organization_profiles', orgId), [firestore, orgId]);
    const { data: org, isLoading } = useDoc<OrganizationProfile>(orgRef);

    if (isLoading) return <Skeleton className="h-10 w-32" />;
    if (!org) return <p>Unknown Organization</p>;

    return (
        <div className="flex items-center gap-3">
            <Avatar>
                <AvatarImage src={org.logoUrl} />
                <AvatarFallback>{org.name.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <div>
                <Link href={`/organization/${orgId}`} className="font-semibold hover:underline">{org.name}</Link>
                <p className="text-sm text-muted-foreground">{org.teamStyle}</p>
            </div>
        </div>
    );
}

// Card for an incoming invitation from an org
function InvitationCard({ request }: { request: TryoutRequest }) {
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);

    const handleResponse = (status: 'Accepted' | 'Declined') => {
        if (!firestore) return;
        setIsProcessing(true);
        const requestRef = doc(firestore, 'tryout_requests', request.id);
        const updatedData = {
            status,
            respondedAt: new Date().toISOString(),
        };

        updateDoc(requestRef, updatedData)
            .then(() => {
                toast({ title: 'Success', description: `Invitation has been ${status.toLowerCase()}.` });
            })
            .catch((serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: requestRef.path,
                    operation: 'update',
                    requestResourceData: updatedData,
                });
                errorEmitter.emit('permission-error', permissionError);
                toast({ variant: 'destructive', title: 'Error', description: 'Could not update invitation status.' });
            })
            .finally(() => {
                setIsProcessing(false);
            });
    };
    
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <OrgInfo orgId={request.organizationId} />
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

// Card for an outgoing application to an org
function ApplicationCard({ request }: { request: TryoutRequest }) {
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);

    const handleWithdraw = () => {
        if (!firestore || !confirm('Are you sure you want to withdraw this application?')) return;
        setIsProcessing(true);
        
        const requestRef = doc(firestore, 'tryout_requests', request.id);
        const updatedData = {
            status: 'Withdrawn',
            respondedAt: new Date().toISOString(),
        };

        updateDoc(requestRef, updatedData)
            .then(() => {
                toast({ title: 'Success', description: `Application has been withdrawn.` });
            })
            .catch((serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: requestRef.path,
                    operation: 'update',
                    requestResourceData: updatedData,
                });
                errorEmitter.emit('permission-error', permissionError);
                toast({ variant: 'destructive', title: 'Error', description: 'Could not withdraw application.' });
            })
            .finally(() => {
                setIsProcessing(false);
            });
    };
    
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <OrgInfo orgId={request.organizationId} />
                <div className="text-right">
                    <p className="text-sm text-muted-foreground">{formatDistanceToNow(new Date(request.sentAt), { addSuffix: true })}</p>
                    <Badge variant={request.status === 'Pending' ? 'default' : request.status === 'Accepted' ? 'secondary' : request.status === 'Declined' ? 'destructive' : 'outline'} className="mt-1">{request.status}</Badge>
                </div>
            </CardHeader>
            <CardContent>
                 <div className="mt-4 flex gap-2">
                    {request.status === 'Pending' && (
                        <Button onClick={handleWithdraw} disabled={isProcessing} size="sm" variant="destructive">
                            <LogOut className="mr-2 h-4 w-4" /> Withdraw
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}


export default function MyRequestsPage() {
    const { firestore, user, isUserLoading } = useFirebase();

    // Get current player profile
    const playerProfileQuery = useMemoFirebase(() => (
        firestore && user ? query(collection(firestore, 'player_profiles'), where('userId', '==', user.uid)) : null
    ), [firestore, user]);
    const { data: playerProfiles, isLoading: isPlayerLoading } = useCollection<PlayerProfile>(playerProfileQuery);
    const currentPlayerProfile = playerProfiles?.[0] ?? null;

    // Get all requests for this player
    const requestsQuery = useMemoFirebase(() => (
        firestore && currentPlayerProfile ? query(collection(firestore, 'tryout_requests'), where('playerId', '==', currentPlayerProfile.id)) : null
    ), [firestore, currentPlayerProfile]);
    const { data: allRequests, isLoading: areRequestsLoading } = useCollection<TryoutRequest>(requestsQuery);

    const isLoading = isUserLoading || isPlayerLoading || areRequestsLoading;
    
    const incomingRequests = allRequests?.filter(r => r.sentBy === 'Org' && r.status === 'Pending') ?? [];
    const outgoingRequests = allRequests?.filter(r => r.sentBy === 'Player') ?? [];

    useEffect(() => {
        if (!firestore || !allRequests) return;

        const unreadRequests = allRequests.filter(r => r.sentBy === 'Org' && r.status === 'Pending' && r.isReadByPlayer === false);
        
        if (unreadRequests.length > 0) {
            const batch = writeBatch(firestore);
            unreadRequests.forEach(req => {
                const requestRef = doc(firestore, 'tryout_requests', req.id);
                batch.update(requestRef, { isReadByPlayer: true });
            });
            batch.commit().catch(console.error); // Mark as read silently
        }
    }, [allRequests, firestore]);

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="space-y-8">
                    <div>
                        <h2 className="text-2xl font-bold font-headline mb-4">Incoming Invitations</h2>
                        <div className="space-y-4">
                            <Skeleton className="h-32 w-full" />
                            <Skeleton className="h-32 w-full" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold font-headline mb-4">My Applications</h2>
                        <div className="space-y-4">
                            <Skeleton className="h-32 w-full" />
                        </div>
                    </div>
                </div>
            );
        }

        if (!user) {
             return (
                <Card className="text-center py-12">
                    <CardHeader><CardTitle>Please Log In</CardTitle></CardHeader>
                    <CardContent>
                        <p>You need to be logged in as a player to see your requests.</p>
                        <Button asChild className="mt-4"><Link href="/player/login">Player Login <ArrowRight className="ml-2" /></Link></Button>
                    </CardContent>
                </Card>
            )
        }
        
        if (!currentPlayerProfile) {
            return (
                <Card className="text-center py-12">
                    <CardHeader><CardTitle>No Player Profile Found</CardTitle></CardHeader>
                    <CardContent>
                        <p>We couldn't find a player profile associated with your account.</p>
                        <Button asChild className="mt-4"><Link href="/player/signup">Create Player Profile <ArrowRight className="ml-2" /></Link></Button>
                    </CardContent>
                </Card>
            )
        }

        return (
            <div className="space-y-8">
                 <div>
                    <h2 className="text-2xl font-bold font-headline mb-4 flex items-center gap-2"><Mail /> Incoming Invitations</h2>
                    {incomingRequests.length > 0 ? (
                        <div className="space-y-4">
                            {incomingRequests.map(req => <InvitationCard key={req.id} request={req} />)}
                        </div>
                    ) : (
                        <Card className="text-center py-12">
                            <CardHeader><CardTitle>No Pending Invitations</CardTitle></CardHeader>
                            <CardContent><p>You currently have no new invitations from organizations.</p></CardContent>
                        </Card>
                    )}
                </div>

                <div>
                    <h2 className="text-2xl font-bold font-headline mb-4 flex items-center gap-2"><ArrowRight /> My Applications</h2>
                     {outgoingRequests.length > 0 ? (
                        <div className="space-y-4">
                            {outgoingRequests.map(req => <ApplicationCard key={req.id} request={req} />)}
                        </div>
                    ) : (
                        <Card className="text-center py-12">
                            <CardHeader><CardTitle>No Applications Sent</CardTitle></CardHeader>
                            <CardContent><p>You haven't applied to any organizations yet.</p></CardContent>
                        </Card>
                    )}
                </div>
            </div>
        )

    }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm">
            <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
                <Logo />
                <Button variant="outline" asChild>
                    <Link href={currentPlayerProfile ? `/player/${currentPlayerProfile.id}` : '/'}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Profile
                    </Link>
                </Button>
            </div>
        </header>
        <main className="flex-1 container mx-auto px-4 md:px-6 py-12">
             <div className="text-left mb-8">
                <h1 className="text-4xl font-bold font-headline tracking-tighter sm:text-5xl">My Tryout Requests</h1>
                <p className="max-w-2xl mt-2 text-muted-foreground">
                    Manage your invitations from organizations and track your applications.
                </p>
            </div>
            {renderContent()}
        </main>
    </div>
  );
}
