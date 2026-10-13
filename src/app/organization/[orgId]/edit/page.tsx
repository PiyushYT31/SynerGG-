'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { doc, updateDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { deleteUser } from 'firebase/auth';

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
import { ArrowLeft, Save, Users } from 'lucide-react';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { type OrganizationProfile } from '@/lib/types';
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

const formSchema = z.object({
  name: z.string().min(2, { message: 'Organization name must be at least 2 characters.' }),
  logoUrl: z.string().optional(),
  bannerUrl: z.string().optional(),
  teamStyle: z.string().optional(),
  description: z.string().optional(),
  achievements: z.string().optional(),
  socialLinks: z.string().optional(),
  // Owner details
  owner: z.string().optional(),
  ownerContact: z.string().optional(),
  ownerExperience: z.string().optional(),
  ownerSeekingType: z.string().optional(),
  // Manager details
  manager: z.string().optional(),
  managerContact: z.string().optional(),
  managerExperience: z.string().optional(),
  managerSeekingType: z.string().optional(),
  // Co-Owner details
  coOwner: z.string().optional(),
  coOwnerContact: z.string().optional(),
  coOwnerExperience: z.string().optional(),
  coOwnerSeekingType: z.string().optional(),
  // Coach details
  coach: z.string().optional(),
  coachContact: z.string().optional(),
  coachExperience: z.string().optional(),
  coachSeekingType: z.string().optional(),
  // Analyst
  analyst: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

function EditOrganizationForm({ orgId, profile, onSave }: { orgId: string; profile: OrganizationProfile, onSave: (values: FormValues) => Promise<void> }) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      logoUrl: '',
      bannerUrl: '',
      teamStyle: '',
      description: '',
      achievements: '',
      socialLinks: '',
      owner: '',
      ownerContact: '',
      ownerExperience: '',
      ownerSeekingType: '',
      manager: '',
      managerContact: '',
      managerExperience: '',
      managerSeekingType: '',
      coOwner: '',
      coOwnerContact: '',
      coOwnerExperience: '',
      coOwnerSeekingType: '',
      coach: '',
      coachContact: '',
      coachExperience: '',
      coachSeekingType: '',
      analyst: '',
    },
  });

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, field: 'logoUrl' | 'bannerUrl') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        form.setError(field, { type: 'manual', message: 'Image size should be less than 2MB.' });
        if (e.target) e.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        form.setValue(field, reader.result as string, { shouldValidate: true });
      };
      reader.readAsDataURL(file);
    }
  };


  useEffect(() => {
    if (profile) {
      const ownerMember = profile.teamMembers?.find(m => m.role === 'Owner');
      const managerMember = profile.teamMembers?.find(m => m.role === 'Manager');
      const coOwnerMember = profile.teamMembers?.find(m => m.role === 'Co-owner');
      const coachMember = profile.teamMembers?.find(m => m.role === 'Coach');
      const analystMember = profile.teamMembers?.find(m => m.role === 'Analyst');

      form.reset({
        name: profile.name,
        logoUrl: profile.logoUrl || '',
        bannerUrl: profile.bannerUrl || '',
        teamStyle: profile.teamStyle || '',
        description: profile.description || '',
        achievements: profile.achievements?.join('\n') || '',
        socialLinks: profile.socialLinks?.map(l => `${l.name},${l.url}`).join('\n') || '',
        owner: ownerMember?.name || profile.owner || '',
        ownerContact: ownerMember?.contactNumber || '',
        ownerExperience: ownerMember?.pastExperience || '',
        ownerSeekingType: ownerMember?.seekingPlayerType || '',
        manager: managerMember?.name || profile.manager || '',
        managerContact: managerMember?.contactNumber || '',
        managerExperience: managerMember?.pastExperience || '',
        managerSeekingType: managerMember?.seekingPlayerType || '',
        coOwner: coOwnerMember?.name || profile.coOwner || '',
        coOwnerContact: coOwnerMember?.contactNumber || '',
        coOwnerExperience: coOwnerMember?.pastExperience || '',
        coOwnerSeekingType: coOwnerMember?.seekingPlayerType || '',
        coach: coachMember?.name || profile.coach || '',
        coachContact: coachMember?.contactNumber || '',
        coachExperience: coachMember?.pastExperience || '',
        coachSeekingType: coachMember?.seekingPlayerType || '',
        analyst: analystMember?.name || profile.analyst || '',
      });
    }
  }, [profile, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSave)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Organization Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Team Soul" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="logoUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Logo</FormLabel>
              <FormControl>
                <div>
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/gif"
                    className="hidden"
                    ref={logoInputRef}
                    onChange={(e) => handleFileSelect(e, 'logoUrl')}
                  />
                  <div className="flex items-center gap-4">
                    <Avatar className="h-24 w-24 cursor-pointer border" onClick={() => logoInputRef.current?.click()}>
                      <AvatarImage src={field.value || undefined} alt="Organization Logo" />
                      <AvatarFallback className="text-center text-xs p-2">Click to upload</AvatarFallback>
                    </Avatar>
                     <Button type="button" variant="outline" onClick={() => logoInputRef.current?.click()}>
                      Upload Logo
                    </Button>
                  </div>
                </div>
              </FormControl>
              <FormDescription>Recommended: 400x400px, max 2MB.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="bannerUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Banner Image</FormLabel>
              <FormControl>
                <div>
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/gif"
                    className="hidden"
                    ref={bannerInputRef}
                    onChange={(e) => handleFileSelect(e, 'bannerUrl')}
                  />
                  <div 
                    className="relative aspect-[3/1] w-full rounded-lg border-2 border-dashed border-muted flex items-center justify-center cursor-pointer bg-card hover:border-primary overflow-hidden"
                    onClick={() => bannerInputRef.current?.click()}
                  >
                    {field.value ? (
                      <Image src={field.value} alt="Banner Preview" fill className="object-cover" />
                    ) : (
                      <div className="text-center text-muted-foreground p-4">
                        <p>Click to upload banner</p>
                        <p className="text-xs">Recommended: 1200x400px</p>
                      </div>
                    )}
                  </div>
                </div>
              </FormControl>
              <FormDescription>Max file size: 2MB.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="teamStyle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Team Playstyle</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Edge-Player, Aggressive" {...field} />
              </FormControl>
               <FormDescription>Describe your team's general strategy.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>About Your Organization</FormLabel>
              <FormControl>
                <Textarea placeholder="Tell everyone what your organization is about." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="achievements"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Achievements</FormLabel>
              <FormControl>
                <Textarea placeholder="List each achievement on a new line." {...field} rows={5} />
              </FormControl>
              <FormDescription>Enter one achievement per line. This will be displayed as badges on your profile.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="socialLinks"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Social Media Links</FormLabel>
              <FormControl>
                <Textarea placeholder={"youtube,https://youtube.com/...\ninstagram,https://instagram.com/..."} {...field} value={field.value || ''} rows={4} />
              </FormControl>
              <FormDescription>Enter one link per line, with the platform (youtube, instagram, twitter) and URL separated by a comma.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Team Management */}
        <div className="border-t pt-8 space-y-6">
          <div>
            <h3 className="text-xl font-bold font-headline flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" /> Team Management
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Provide contact number, past experience, and what type of players you are seeking. Each member gets a public sub-profile page that players can view.
            </p>
          </div>

          {/* Owner */}
          <div className="p-4 rounded-lg border bg-muted/20 space-y-4">
            <h4 className="font-semibold text-primary">Owner</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="owner" render={({ field }) => (
                <FormItem><FormLabel>Owner Name</FormLabel><FormControl><Input placeholder="Owner name" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="ownerContact" render={({ field }) => (
                <FormItem><FormLabel>Contact Number</FormLabel><FormControl><Input placeholder="+91 9876543210" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="ownerExperience" render={({ field }) => (
                <FormItem className="md:col-span-2"><FormLabel>Past Experience</FormLabel><FormControl><Textarea placeholder="Owner past esports experience..." {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="ownerSeekingType" render={({ field }) => (
                <FormItem className="md:col-span-2"><FormLabel>What type of players are you seeking?</FormLabel><FormControl><Textarea placeholder="Seeking player criteria..." {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
          </div>

          {/* Manager */}
          <div className="p-4 rounded-lg border bg-muted/20 space-y-4">
            <h4 className="font-semibold text-primary">Manager</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="manager" render={({ field }) => (
                <FormItem><FormLabel>Manager Name</FormLabel><FormControl><Input placeholder="Manager name" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="managerContact" render={({ field }) => (
                <FormItem><FormLabel>Contact Number</FormLabel><FormControl><Input placeholder="+91 9876543210" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="managerExperience" render={({ field }) => (
                <FormItem className="md:col-span-2"><FormLabel>Past Experience</FormLabel><FormControl><Textarea placeholder="Manager past esports experience..." {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="managerSeekingType" render={({ field }) => (
                <FormItem className="md:col-span-2"><FormLabel>What type of players are you seeking?</FormLabel><FormControl><Textarea placeholder="Seeking player criteria..." {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
          </div>

          {/* Co-Owner */}
          <div className="p-4 rounded-lg border bg-muted/20 space-y-4">
            <h4 className="font-semibold text-primary">Co-Owner</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="coOwner" render={({ field }) => (
                <FormItem><FormLabel>Co-Owner Name</FormLabel><FormControl><Input placeholder="Co-Owner name" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="coOwnerContact" render={({ field }) => (
                <FormItem><FormLabel>Contact Number</FormLabel><FormControl><Input placeholder="+91 9876543210" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="coOwnerExperience" render={({ field }) => (
                <FormItem className="md:col-span-2"><FormLabel>Past Experience</FormLabel><FormControl><Textarea placeholder="Co-Owner past esports experience..." {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="coOwnerSeekingType" render={({ field }) => (
                <FormItem className="md:col-span-2"><FormLabel>What type of players are you seeking?</FormLabel><FormControl><Textarea placeholder="Seeking player criteria..." {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
          </div>

          {/* Coach */}
          <div className="p-4 rounded-lg border bg-muted/20 space-y-4">
            <h4 className="font-semibold text-primary">Coach</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="coach" render={({ field }) => (
                <FormItem><FormLabel>Coach Name</FormLabel><FormControl><Input placeholder="Coach name" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="coachContact" render={({ field }) => (
                <FormItem><FormLabel>Contact Number</FormLabel><FormControl><Input placeholder="+91 9876543210" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="coachExperience" render={({ field }) => (
                <FormItem className="md:col-span-2"><FormLabel>Past Experience</FormLabel><FormControl><Textarea placeholder="Coach past esports experience..." {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="coachSeekingType" render={({ field }) => (
                <FormItem className="md:col-span-2"><FormLabel>What type of players are you seeking?</FormLabel><FormControl><Textarea placeholder="Seeking player criteria..." {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
          </div>

          {/* Analyst */}
          <div className="p-4 rounded-lg border bg-muted/20 space-y-4">
            <h4 className="font-semibold text-primary">Analyst</h4>
            <FormField control={form.control} name="analyst" render={({ field }) => (
              <FormItem><FormLabel>Analyst Name</FormLabel><FormControl><Input placeholder="Analyst name" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving...' : <><Save className="mr-2 h-4 w-4" /> Save Changes</>}
        </Button>
      </form>
    </Form>
  );
}


export default function EditOrganizationProfilePage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const { firestore, user } = useFirebase();
    const orgId = params.orgId as string;

    const orgRef = useMemoFirebase(() => (firestore && orgId ? doc(firestore, 'organization_profiles', orgId) : null), [firestore, orgId]);
    const { data: profile, isLoading, error } = useDoc<OrganizationProfile>(orgRef);

    const isOwner = user && profile && user.uid === profile.userId;

    async function handleSave(values: FormValues) {
        if (!firestore || !profile) return;

        const orgDocRef = doc(firestore, 'organization_profiles', profile.id);
        const achievementsArray = values.achievements?.split('\n').filter(line => line.trim() !== '') || [];
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

        const teamMembers: any[] = [];
        if (values.owner) {
            teamMembers.push({
                id: profile.teamMembers?.find(m => m.role === 'Owner')?.id || 'owner-' + Date.now(),
                name: values.owner,
                role: 'Owner',
                contactNumber: values.ownerContact || '',
                pastExperience: values.ownerExperience || '',
                seekingPlayerType: values.ownerSeekingType || '',
            });
        }
        if (values.manager) {
            teamMembers.push({
                id: profile.teamMembers?.find(m => m.role === 'Manager')?.id || 'manager-' + Date.now(),
                name: values.manager,
                role: 'Manager',
                contactNumber: values.managerContact || '',
                pastExperience: values.managerExperience || '',
                seekingPlayerType: values.managerSeekingType || '',
            });
        }
        if (values.coOwner) {
            teamMembers.push({
                id: profile.teamMembers?.find(m => m.role === 'Co-owner')?.id || 'coowner-' + Date.now(),
                name: values.coOwner,
                role: 'Co-owner',
                contactNumber: values.coOwnerContact || '',
                pastExperience: values.coOwnerExperience || '',
                seekingPlayerType: values.coOwnerSeekingType || '',
            });
        }
        if (values.coach) {
            teamMembers.push({
                id: profile.teamMembers?.find(m => m.role === 'Coach')?.id || 'coach-' + Date.now(),
                name: values.coach,
                role: 'Coach',
                contactNumber: values.coachContact || '',
                pastExperience: values.coachExperience || '',
                seekingPlayerType: values.coachSeekingType || '',
            });
        }
        if (values.analyst) {
            teamMembers.push({
                id: profile.teamMembers?.find(m => m.role === 'Analyst')?.id || 'analyst-' + Date.now(),
                name: values.analyst,
                role: 'Analyst',
                contactNumber: '',
                pastExperience: '',
                seekingPlayerType: '',
            });
        }

        const updatedData = {
            name: values.name,
            logoUrl: values.logoUrl,
            bannerUrl: values.bannerUrl,
            teamStyle: values.teamStyle,
            description: values.description,
            achievements: achievementsArray,
            socialLinks: socialLinksArray,
            owner: values.owner || profile.owner || '',
            manager: values.manager || '',
            coOwner: values.coOwner || '',
            coach: values.coach || '',
            analyst: values.analyst || '',
            teamMembers: teamMembers,
            updatedAt: new Date().toISOString(),
        };

        try {
            await updateDoc(orgDocRef, updatedData);
            toast({ title: 'Profile Updated', description: 'Your changes have been saved successfully.' });
            router.push(`/organization/${orgId}`);
            router.refresh();
        } catch (e: any) {
            if (e.code === 'permission-denied') {
                const permissionError = new FirestorePermissionError({
                    path: orgDocRef.path,
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
                console.error("Failed to update organization profile:", e);
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
            toast({ variant: 'destructive', title: 'Error', description: 'Could not delete account. Organization not found.' });
            return;
        }

        try {
            const batch = writeBatch(firestore);
            const orgId = profile.id;

            // 1. Find and delete roster slots
            const rosterSlotsQuery = query(collection(firestore, 'roster_slots'), where('organizationId', '==', orgId));
            const rosterSlotsSnapshot = await getDocs(rosterSlotsQuery);
            rosterSlotsSnapshot.forEach(docSnap => {
                batch.delete(docSnap.ref);
            });

            // 2. Find and delete tryout requests
            const tryoutRequestsQuery = query(collection(firestore, 'tryout_requests'), where('organizationId', '==', orgId));
            const tryoutRequestsSnapshot = await getDocs(tryoutRequestsQuery);
            tryoutRequestsSnapshot.forEach(docSnap => {
                batch.delete(docSnap.ref);
            });

            // 3. Delete organization profile
            const orgProfileRef = doc(firestore, 'organization_profiles', orgId);
            batch.delete(orgProfileRef);

            // 4. Delete user document
            const userDocRef = doc(firestore, 'users', user.uid);
            batch.delete(userDocRef);

            // 5. Commit all Firestore changes
            await batch.commit();

            // 6. Delete the auth user
            await deleteUser(user);

            toast({ title: 'Account Deleted', description: 'Your organization account and all associated data have been permanently deleted.' });
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
                    <Skeleton className="h-10 w-1/2" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
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

        return <EditOrganizationForm orgId={orgId} profile={profile} onSave={handleSave} />;
    }

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm">
                <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
                    <Logo />
                    <Button asChild variant="outline" disabled={!orgId}>
                        <Link href={orgId ? `/organization/${orgId}` : '/'}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Profile
                        </Link>
                    </Button>
                </div>
            </header>
            <main className="flex-1 flex items-center justify-center py-12">
                <Card className="m-4 w-full max-w-2xl">
                    <CardHeader>
                        <CardTitle className="font-headline">Edit Organization Profile</CardTitle>
                        <CardDescription>
                            Update your organization's public information.
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
                                                        This action cannot be undone. This will permanently delete your organization's account and profile, including all roster slots and tryout requests.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        className="bg-destructive hover:bg-destructive/90"
                                                        onClick={handleDeleteAccount}
                                                    >
                                                        Yes, delete this account
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
