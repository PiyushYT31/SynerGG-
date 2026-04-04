'use client';

import { useFirebase, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { ArrowLeft, LayoutGrid, Users, ClipboardList, ShieldCheck, Edit } from 'lucide-react';
import { type OrganizationProfile, type TryoutRequest } from '@/lib/types';
import { doc, query, where, collection } from 'firebase/firestore';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const orgId = params.orgId as string;
  const { user, isUserLoading, firestore } = useFirebase();

  const orgRef = useMemoFirebase(() => (firestore && orgId ? doc(firestore, 'organization_profiles', orgId) : null), [firestore, orgId]);
  const { data: profile } = useDoc<OrganizationProfile>(orgRef);

  // Check for new applications to show notification dot
  const newRequestsQuery = useMemoFirebase(() => (
    firestore && orgId ? query(collection(firestore, 'tryout_requests'), where('organizationId', '==', orgId), where('sentBy', '==', 'Player'), where('status', '==', 'Pending'), where('isReadByOrg', '==', false)) : null
  ), [firestore, orgId]);
  const { data: newRequests } = useCollection<TryoutRequest>(newRequestsQuery);
  const hasNewRequests = newRequests && newRequests.length > 0;

  const isOwner = user && profile && user.uid === profile.userId;

  // Determine the active tab based on the current path
  const activeTab = pathname.includes('/requests') ? 'requests' : 'roster';
  
  if (isUserLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isOwner) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <Card>
                <CardHeader>
                    <CardTitle>Access Denied</CardTitle>
                    <CardDescription>You must be the owner of this organization to view this page.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild><Link href="/organization/login">Login</Link></Button>
                </CardContent>
            </Card>
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
              Back to Profile
            </Link>
          </Button>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 md:px-6 py-12">
        <div className="space-y-4 mb-8">
            <div className="flex items-center justify-between gap-4">
                <h1 className="text-3xl font-bold font-headline tracking-tighter sm:text-4xl flex items-center gap-3">
                    <LayoutGrid />
                    {profile?.name} Dashboard
                    {profile?.isVerified && <ShieldCheck className="h-7 w-7 text-primary" />}
                </h1>
                <Button asChild>
                    <Link href={`/organization/${orgId}/edit`}>
                        <Edit className="mr-2 h-4 w-4" /> Edit Public Profile
                    </Link>
                </Button>
            </div>
            <p className="text-muted-foreground">Manage your roster, review applications, and edit your public profile information.</p>
        </div>

        <Tabs value={activeTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
                <TabsTrigger value="roster" asChild>
                    <Link href={`/organization/${orgId}/dashboard/roster`}><Users className="mr-2 h-4 w-4"/> Roster</Link>
                </TabsTrigger>
                <TabsTrigger value="requests" asChild>
                    <Link href={`/organization/${orgId}/dashboard/requests`} className="relative">
                        <ClipboardList className="mr-2 h-4 w-4"/> Tryout Requests
                        {hasNewRequests && <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-red-500 ring-1 ring-background" />}
                    </Link>
                </TabsTrigger>
            </TabsList>
            <TabsContent value={activeTab} className="mt-6">
                 {children}
            </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
