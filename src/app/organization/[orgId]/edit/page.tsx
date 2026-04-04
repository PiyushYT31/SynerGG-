'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { doc, updateDoc } from 'firebase/firestore';
import { useEffect, useRef } from 'react';
import Image from 'next/image';

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
import { type OrganizationProfile } from '@/lib/types';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Organization name must be at least 2 characters.' }),
  logoUrl: z.string().optional(),
  bannerUrl: z.string().optional(),
  teamStyle: z.string().optional(),
  description: z.string().optional(),
  achievements: z.string().optional(),
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
      form.reset({
        name: profile.name,
        logoUrl: profile.logoUrl || '',
        bannerUrl: profile.bannerUrl || '',
        teamStyle: profile.teamStyle || '',
        description: profile.description || '',
        achievements: profile.achievements?.join('\n') || '',
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

        const updatedData = {
            name: values.name,
            logoUrl: values.logoUrl,
            bannerUrl: values.bannerUrl,
            teamStyle: values.teamStyle,
            description: values.description,
            achievements: achievementsArray,
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
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
