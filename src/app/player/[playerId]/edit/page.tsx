'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { doc, updateDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { useRef, useEffect } from 'react';
import { deleteUser } from 'firebase/auth';
import { format } from 'date-fns';

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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Slider } from '@/components/ui/slider';


const formSchema = z.object({
  ign: z.string().min(2, { message: 'In-game name must be at least 2 characters.' }),
  profilePictureUrl: z.string().optional(),
  role: z.enum(['IGL', 'Entry Fragger', 'Support', 'Assaulter', 'Sniper', 'Substitute']),
  playstyle: z.enum(['Aggressive', 'Tactical', 'Balanced', 'Passive']),
  fdRatio: z.coerce.number().min(0, { message: 'F/D Ratio cannot be negative.' }),
  experience: z.string().min(20, { message: 'Please provide more details about your experience (at least 20 characters).' }),
  idealTeammateStrategy: z.string().min(20, { message: 'Please describe your ideal team (at least 20 characters).' }),
  achievements: z.string().optional(),
  povLinks: z.string().optional(),
  socialLinks: z.string().optional(),
  assaulting: z.number().min(0).max(100),
  igling: z.number().min(0).max(100),
  support: z.number().min(0).max(100),
  survival: z.number().min(0).max(100),
  sniping: z.number().min(0).max(100),
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
            achievements: '',
            povLinks: '',
            socialLinks: '',
            fdRatio: 0,
            role: undefined,
            playstyle: undefined,
            assaulting: 50,
            igling: 50,
            support: 50,
            survival: 50,
            sniping: 50,
        },
    });

    useEffect(() => {
        if (profile) {
            form.reset({
                ign: profile.ign || '',
                profilePictureUrl: profile.profilePictureUrl || '',
                experience: profile.experience || '',
                idealTeammateStrategy: profile.idealTeammateStrategy || '',
                achievements: profile.achievements?.join('\n') || '',
                povLinks: profile.povLinks?.map(l => `${l.name},${l.url}`).join('\n') || '',
                socialLinks: profile.socialLinks?.map(l => `${l.name},${l.url}`).join('\n') || '',
                fdRatio: profile.fdRatio || 0,
                role: profile.role,
                playstyle: profile.playstyle,
                assaulting: profile.playerStats?.assaulting ?? 50,
                igling: profile.playerStats?.igling ?? 50,
                support: profile.playerStats?.support ?? 50,
                survival: profile.playerStats?.survival ?? 50,
                sniping: profile.playerStats?.sniping ?? 50,
            });
        }
    }, [profile, form]);

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
                    <FormItem>
                        <FormLabel>Date of Birth</FormLabel>
                        <FormControl>
                            <Input
                            value={profile.dateOfBirth ? format(new Date(profile.dateOfBirth), "PPP") : 'Not set'}
                            disabled
                            />
                        </FormControl>
                        <FormDescription>
                            Date of birth cannot be changed.
                        </FormDescription>
                    </FormItem>
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
                            name="povLinks"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>POV Links</FormLabel>
                                    <FormControl><Textarea placeholder={"Scrims POV, https://youtube.com/...\nFinals POV, https://drive.google.com/..."} {...field} rows={5}/></FormControl>
                                    <FormDescription>Enter one link per line, with the name and URL separated by a comma.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                     <div className="md:col-span-2">
                        <FormField
                            control={form.control}
                            name="socialLinks"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Social Media Links</FormLabel>
                                    <FormControl><Textarea placeholder={"youtube,https://youtube.com/...\ninstagram,https://instagram.com/..."} {...field} rows={3}/></FormControl>
                                    <FormDescription>Enter one link per line, with the platform (youtube, instagram, twitter) and URL separated by a comma.</FormDescription>
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
                    <div className="md:col-span-2 space-y-4 rounded-lg border p-4">
                        <h3 className="text-lg font-medium">Rate Your Skills</h3>
                        <FormField
                        control={form.control}
                        name="assaulting"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Assaulting ({field.value})</FormLabel>
                                <FormControl><Slider onValueChange={(v) => field.onChange(v[0])} value={[field.value]} max={100} step={1} /></FormControl>
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="igling"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>IGLing ({field.value})</FormLabel>
                                <FormControl><Slider onValueChange={(v) => field.onChange(v[0])} value={[field.value]} max={100} step={1} /></FormControl>
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="support"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Support ({field.value})</FormLabel>
                                <FormControl><Slider onValueChange={(v) => field.onChange(v[0])} value={[field.value]} max={100} step={1} /></FormControl>
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="survival"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Survival/Positioning ({field.value})</FormLabel>
                                <FormControl><Slider onValueChange={(v) => field.onChange(v[0])} value={[field.value]} max={100} step={1} /></FormControl>
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="sniping"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Sniping ({field.value})</FormLabel>
                                <FormControl><Slider onValueChange={(v) => field.onChange(v[0])} value={[field.value]} max={100} step={1} /></FormControl>
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
        const povLinksArray = values.povLinks?.split('\n').filter(line => line.trim() !== '' && line.includes(',')).map(line => {
            const [name, ...urlParts] = line.split(',');
            const url = urlParts.join(',').trim();
            const existingLink = profile.povLinks?.find(l => l.url === url);
            return { 
                id: existingLink?.id || crypto.randomUUID(),
                name: name.trim(), 
                url: url 
            };
        }) || [];
        const socialLinksArray = values.socialLinks?.split('\n').filter(line => line.trim() !== '' && line.includes(',')).map(line => {
            const [name, ...urlParts] = line.split(',');
            const url = urlParts.join(',').trim();
            const existingLink = profile.socialLinks?.find(l => l.url === url);
            return { 
                id: existingLink?.id || crypto.randomUUID(),
                name: name.trim().toLowerCase(), 
                url: url 
            };
        }) || [];

        const updatedData: Omit<FormValues, 'povLinks' | 'achievements' | 'socialLinks'> & { achievements: string[], povLinks: any[], socialLinks: any[], playerStats: any, updatedAt: string } = {
            ...values,
            achievements: achievementsArray,
            povLinks: povLinksArray,
            socialLinks: socialLinksArray,
            playerStats: {
                assaulting: values.assaulting,
                igling: values.igling,
                support: values.support,
                survival: values.survival,
                sniping: values.sniping,
            },
            updatedAt: new Date().toISOString(),
        };

        try {
            await updateDoc(playerDocRef, updatedData as any);
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

    async function handleDeleteAccount() {
        if (!firestore || !user || !profile) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not delete account. User not found.' });
            return;
        }

        try {
            const batch = writeBatch(firestore);

            // 1. Find and delete tryout requests this player is part of.
            // A player is a participant, so they have permission to delete these.
            const tryoutRequestsQuery = query(collection(firestore, 'tryout_requests'), where('playerId', '==', profile.id));
            const tryoutRequestsSnapshot = await getDocs(tryoutRequestsQuery);
            tryoutRequestsSnapshot.forEach(docSnap => {
                batch.delete(docSnap.ref);
            });

            // 2. Delete player profile
            const playerProfileRef = doc(firestore, 'player_profiles', profile.id);
            batch.delete(playerProfileRef);

            // 3. Delete user document
            const userDocRef = doc(firestore, 'users', user.uid);
            batch.delete(userDocRef);

            // 4. Commit all Firestore changes
            await batch.commit();

            // 5. Delete the auth user
            // This should be the last step after all DB operations are successful.
            await deleteUser(user);

            toast({ title: 'Account Deleted', description: 'Your account and all associated data have been permanently deleted.' });
            router.push('/');
            router.refresh();

        } catch (error: any) {
            console.error("Error deleting account:", error);
            if (error.code === 'auth/requires-recent-login') {
                toast({
                    variant: 'destructive',
                    title: 'Authentication Error',
                    description: 'This is a sensitive operation. Please log out and log back in before deleting your account.',
                });
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Deletion Failed',
                    description: error.message || 'An unknown error occurred.',
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
                       {isOwner && profile && (
                            <div className="mt-12 pt-8 border-t border-dashed">
                                <h3 className="text-lg font-semibold text-destructive">Danger Zone</h3>
                                <Card className="mt-4 border-destructive">
                                    <CardHeader>
                                        <CardTitle>Delete Account</CardTitle>
                                        <CardDescription>
                                            Permanently delete your account and all of its associated data. This action cannot be undone.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive">Delete My Account</Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This action cannot be undone. This will permanently delete your account, your profile, and remove all your data from our servers.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        className="bg-destructive hover:bg-destructive/90"
                                                        onClick={handleDeleteAccount}
                                                    >
                                                        Yes, delete my account
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}

    
