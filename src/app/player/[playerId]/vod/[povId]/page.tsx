'use client';
import { useParams } from 'next/navigation';
import { useFirebase, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { type PlayerProfile, type OrganizationProfile, type VODReviewComment, type PovLink } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MessageSquare, Send } from 'lucide-react';
import Link from 'next/link';
import { collection, query, where, addDoc, serverTimestamp, doc } from 'firebase/firestore';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

function getYouTubeVideoId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.slice(1);
    }
    if (urlObj.hostname.includes('youtube.com')) {
      const videoId = urlObj.searchParams.get('v');
      if (videoId) {
        return videoId;
      }
    }
    return null;
  } catch (e) {
    return null;
  }
}

const commentSchema = z.object({
    timestamp: z.string().regex(/^\d{1,2}:\d{2}$/, { message: "Timestamp must be in mm:ss format."}),
    comment: z.string().min(1, { message: 'Comment cannot be empty.' }).max(500, { message: 'Comment is too long.' }),
});

type CommentFormValues = z.infer<typeof commentSchema>;

function VODReviewPage() {
  const params = useParams();
  const playerId = params.playerId as string;
  const povId = params.povId as string;
  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  const playerRef = useMemoFirebase(() => (firestore && playerId ? doc(firestore, 'player_profiles', playerId) : null), [firestore, playerId]);
  const { data: player, isLoading: isPlayerLoading } = useDoc<PlayerProfile>(playerRef);
  
  // Check if current user is an org manager
  const orgProfileQuery = useMemoFirebase(() => (user && firestore ? query(collection(firestore, 'organization_profiles'), where('userId', '==', user.uid)) : null), [firestore, user]);
  const { data: orgProfiles } = useCollection<OrganizationProfile>(orgProfileQuery);
  const currentOrgProfile = orgProfiles?.[0];

  const povLink = player?.povLinks.find(link => link.id === povId);
  const videoId = povLink ? getYouTubeVideoId(povLink.url) : null;

  const commentsQuery = useMemoFirebase(() => (firestore && povId ? query(collection(firestore, 'vod_review_comments'), where('povId', '==', povId)) : null), [firestore, povId]);
  const { data: comments, isLoading: areCommentsLoading } = useCollection<VODReviewComment>(commentsQuery);

  const form = useForm<CommentFormValues>({
    resolver: zodResolver(commentSchema),
    defaultValues: { timestamp: '', comment: '' },
  });

  const onSubmit: SubmitHandler<CommentFormValues> = async (data) => {
    if (!firestore || !user || !currentOrgProfile || !player || !povLink) {
        toast({ variant: 'destructive', title: 'Error', description: 'Cannot post comment. Missing required data.'});
        return;
    }

    try {
        await addDoc(collection(firestore, 'vod_review_comments'), {
            ...data,
            povId: povLink.id,
            playerId: player.id,
            organizationId: currentOrgProfile.id,
            organizationManagerUserId: user.uid,
            createdAt: new Date().toISOString(),
        });
        toast({ title: 'Success', description: 'Your comment has been posted.' });
        form.reset();
    } catch (error) {
        console.error("Error posting comment:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to post your comment.' });
    }
  }


  if (isPlayerLoading) {
    return <div className="flex items-center justify-center min-h-screen"><Skeleton className="h-64 w-full max-w-4xl" /></div>;
  }

  if (!player || !povLink) {
    return <div className="flex items-center justify-center min-h-screen">VOD not found.</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Logo />
          <Button variant="outline" asChild>
            <Link href={`/player/${playerId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Player Profile
            </Link>
          </Button>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 md:px-6 py-12">
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-3xl">{povLink.name}</CardTitle>
                <CardDescription>VOD Review for {player.ign}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        {videoId ? (
                             <div className="aspect-video w-full overflow-hidden rounded-lg border">
                                <iframe
                                    width="100%"
                                    height="100%"
                                    src={`https://www.youtube.com/embed/${videoId}`}
                                    title="YouTube video player"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                            </div>
                        ) : (
                            <div className="aspect-video w-full flex items-center justify-center bg-muted rounded-lg">
                                <p>Invalid or unsupported video URL.</p>
                            </div>
                        )}
                    </div>
                    <div className="lg:col-span-1 space-y-4">
                        <h3 className="font-headline text-xl flex items-center gap-2"><MessageSquare /> Review Comments</h3>
                        <div className="h-[400px] overflow-y-auto space-y-4 pr-2">
                            {areCommentsLoading && <Skeleton className="h-20 w-full" />}
                            {comments && comments.length > 0 ? comments.sort((a,b) => a.createdAt.localeCompare(b.createdAt)).map(comment => (
                                <Card key={comment.id} className="bg-accent/50">
                                    <CardHeader className="p-3">
                                        <div className="flex items-center justify-between">
                                            <p className="font-bold text-primary text-lg">{comment.timestamp}</p>
                                            <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</p>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-3 pt-0">
                                        <p className="text-sm">{comment.comment}</p>
                                    </CardContent>
                                </Card>
                            )) : !areCommentsLoading && (
                                <p className="text-muted-foreground text-sm">No comments yet.</p>
                            )}
                        </div>
                         {currentOrgProfile && (
                            <Card className="mt-4">
                                <CardHeader><CardTitle className="text-lg">Add a Comment</CardTitle></CardHeader>
                                <CardContent>
                                    <Form {...form}>
                                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                            <FormField control={form.control} name="timestamp" render={({field}) => (
                                                <FormItem>
                                                    <FormLabel>Timestamp (mm:ss)</FormLabel>
                                                    <FormControl><Input placeholder="e.g. 02:15" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="comment" render={({field}) => (
                                                <FormItem>
                                                    <FormLabel>Comment</FormLabel>
                                                    <FormControl><Textarea placeholder="e.g. Great rotation here..." {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                                                <Send className="mr-2"/> Post Comment
                                            </Button>
                                        </form>
                                    </Form>
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

export default VODReviewPage;
