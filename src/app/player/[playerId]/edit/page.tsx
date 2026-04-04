'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { doc, updateDoc } from 'firebase/firestore';
import { useEffect, useRef } from 'react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/logo';
import { ArrowLeft, Save } from 'lucide-react';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { type PlayerProfile } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


const formSchema = z.object({
  ign: z.string().min(2, { message: 'In-game name must be at least 2 characters.' }),
  profilePictureUrl: z.string().optional(),
  role: z.enum(['IGL', 'Entry Fragger', 'Support', 'Assaulter', 'Sniper', 'Substitute']),
  playstyle: z.enum(['Aggressive', 'Tactical', 'Balanced', 'Passive']),
  fdRatio: z.coerce.number().min(0, { message: 'F/D Ratio cannot be negative.' }),
  highlightsUrl: z.string().url({ message: 'Please enter a valid Google Drive or YouTube URL.' }),
  experience: z.string().min(20, { message: 'Please provide more details about your experience (at least 20 characters).' }),
  idealTeammateStrategy: z.string().min(20, { message: 'Please describe your ideal team (at least 20 characters).' }),
  achievements: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;


function EditPlayerForm({ profile, onSave }: { profile: PlayerProfile, onSave: (values: FormValues) => Promise<void> }) {
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            ign: '',
            profilePictureUrl: '',
            experience: '',
            idealTeammateStrategy: '',
            highlightsUrl: '',
            achievements: '',
            fdRatio: 0,
            role: 'IGL',
            playstyle: 'Balanced',
        },
    });

    const profilePicInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                form.setError('profilePictureUrl', { type: 'manual', message: 'Image size should be less than 2MB.' });
                if (e.target) e.target.value = '';
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                form.setValue('profilePictureUrl', reader.result as string, { shouldValidate: true });
            };
            reader.readAsDataURL(file);
        }
    };


    useEffect(() => {
        if (profile) {
            form.reset({
                ign: profile.ign,
                profilePictureUrl: profile.profilePictureUrl || '',
                role: profile.role,
                playstyle: profile.playstyle,
                fdRatio: profile.fdRatio,
                highlightsUrl: profile.highlightsUrl,
                experience: profile.experience,
                idealTeammateStrategy: profile.idealTeammateStrategy,
                achievements: profile.achievements?.join('\n') || '',
            });
        }
    }, [profile, form]);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSave)} className="space-y-6">
                 <FormField
                    control={form.control}
                    name="profilePictureUrl"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Profile Picture</FormLabel>
                                <FormControl>
                                <div>
                                <input
                                    type="file"
                                    accept="image/png, image/jpeg, image/gif"
                                    className="hidden"
                                    ref={profilePicInputRef}
                                    onChange={handleFileSelect}
                                />
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-24 w-24 cursor-pointer border" onClick={() => profilePicInputRef.current?.click()}>
                                    <AvatarImage src={field.value || undefined} alt="Player profile picture" />
                                    <AvatarFallback className="text-center text-xs p-2">Click to upload</AvatarFallback>
                                    </Avatar>
                                    <Button type="button" variant="outline" onClick={() => profilePicInputRef.current?.click()}>
                                        Upload Picture
                                    </Button>
                                </div>
                                </div>
                            </FormControl>
                            <FormDescription>Recommended: 400x400px, max 2MB.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                     <FormField
                        control={form.control}
                        name="ign"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>In-Game Name (IGN)</FormLabel>
                                <FormControl><Input placeholder="Your BGMI username" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="fdRatio"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>F/D Ratio</FormLabel>
                                <FormControl><Input type="number" step="0.1" placeholder="e.g. 4.5" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    
                     <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Primary Role</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select your main role" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="IGL">IGL (In-Game Leader)</SelectItem>
                                        <SelectItem value="Entry Fragger">Entry Fragger</SelectItem>
                                        <SelectItem value="Support">Support</SelectItem>
                                        <SelectItem value="Assaulter">Assaulter</SelectItem>
                                        <SelectItem value="Sniper">Sniper</SelectItem>
                                        <SelectItem value="Substitute">Substitute</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="playstyle"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Playstyle</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select your playstyle" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="Aggressive">Aggressive</SelectItem>
                                        <SelectItem value="Tactical">Tactical</SelectItem>
                                        <SelectItem value="Balanced">Balanced</SelectItem>
                                        <SelectItem value="Passive">Passive</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="md:col-span-2">
                        <FormField
                            control={form.control}
                            name="highlightsUrl"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Highlights URL</FormLabel>
                                    <FormControl><Input placeholder="https://youtube.com/..." {...field} /></FormControl>
                                    <FormDescription>Link to your YouTube or Google Drive gameplay reel.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                     <div className="md:col-span-2">
                        <FormField
                            control={form.control}
                            name="experience"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Experience</FormLabel>
                                    <FormControl><Textarea placeholder="Describe your competitive experience, past teams, etc." {...field} rows={5}/></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <div className="md:col-span-2">
                        <FormField
                            control={form.control}
                            name="idealTeammateStrategy"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Ideal Teammates & Strategy</FormLabel>
                                    <FormControl><Textarea placeholder="What kind of players do you work best with? (e.g., 'I need a calm IGL who makes decisive calls')" {...field} rows={5} /></FormControl>
                                    <FormDescription>This helps us find the best team for you.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                     <div className="md:col-span-2">
                        <FormField
                            control={form.control}
                            name="achievements"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Achievements</FormLabel>
                                    <FormControl><Textarea placeholder="List each achievement on a new line." {...field} rows={5} /></FormControl>
                                    <FormDescription>Enter one achievement per line. This will be displayed on your profile.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>
                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                     {form.formState.isSubmitting ? 'Saving...' : <><Save className="mr-2 h-4 w-4" /> Save Changes</>}
                </Button>
            </form>
        </Form>
    );
}


export default function EditPlayerProfilePage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const { firestore, user } = useFirebase();
    const playerId = params.playerId as string;

    const playerRef = useMemoFirebase(() => (firestore && playerId ? doc(firestore, 'player_profiles', playerId) : null), [firestore, playerId]);
    const { data: profile, isLoading, error } = useDoc<PlayerProfile>(playerRef);

    const isOwner = user && profile && user.uid === profile.userId;

    async function handleSave(values: FormValues) {
        if (!firestore || !profile) return;

        const playerDocRef = doc(firestore, 'player_profiles', profile.id);
        const achievementsArray = values.achievements?.split('\n').filter(line => line.trim() !== '') || [];

        const updatedData = {
            ...values,
            achievements: achievementsArray,
            updatedAt: new Date().toISOString(),
        };

        try {
            await updateDoc(playerDocRef, updatedData);
            toast({ title: 'Profile Updated', description: 'Your changes have been saved successfully.' });
            router.push(`/player/${playerId}`);
            router.refresh();
        } catch (e: any) {
             if (e.code === 'permission-denied') {
                const permissionError = new FirestorePermissionError({
                    path: playerDocRef.path,
                    operation: 'update',
                    requestResourceData: updatedData,
                });
                errorEmitter.emit('permission-error', permissionError);
                toast({
                    variant: 'destructive',
                    title: 'Permission Denied',
                    description: 'You do not have permission to edit this profile.',
                });
            } else {
                console.error("Failed to update player profile:", e);
                toast({
                    variant: 'destructive',
                    title: 'Update Failed',
                    description: e.message || 'An unknown error occurred while saving your profile.',
                });
            }
        }
    }
    
     const renderContent = () => {
        if (isLoading) {
            return (
                 <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            )
        }

        if (!profile || error) {
            return <p className="text-muted-foreground">Could not load profile data. It might not exist or you may not have access.</p>;
        }

        if (!isOwner) {
            return <p className="text-destructive">You are not authorized to edit this profile.</p>;
        }

        return <EditPlayerForm profile={profile} onSave={handleSave} />;
    }


    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm">
                <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
                    <Logo />
                    <Button asChild variant="outline" disabled={!playerId}>
                        <Link href={playerId ? `/player/${playerId}`: '/'}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Profile
                        </Link>
                    </Button>
                </div>
            </header>
            <main className="flex-1 flex items-center justify-center py-12">
                 <Card className="m-4 w-full max-w-3xl">
                    <CardHeader>
                        <CardTitle className="font-headline">Edit Player Profile</CardTitle>
                        <CardDescription>
                            Keep your profile up-to-date to attract the best teams.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                       {renderContent()}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
