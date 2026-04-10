'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, addDoc } from 'firebase/firestore';

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
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  organizationName: z.string().min(2, {
    message: 'Organization name must be at least 2 characters.',
  }),
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  confirmPassword: z.string(),
  phoneNumber: z.string().optional(),
  owner: z.string().min(2, {
    message: 'Owner name must be at least 2 characters.',
  }),
  coOwner: z.string().optional(),
  coach: z.string().optional(),
  analyst: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});


export default function OrganizationSignUp() {
  const { auth, firestore } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      organizationName: '',
      email: '',
      password: '',
      confirmPassword: '',
      phoneNumber: '',
      owner: '',
      coOwner: '',
      coach: '',
      analyst: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!auth || !firestore) {
        toast({
            variant: 'destructive',
            title: 'Firebase not initialized',
            description: 'Please try again later.',
        });
        return;
    }
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
        const user = userCredential.user;

        const orgCollection = collection(firestore, 'organization_profiles');
        
        const orgProfileData = {
            userId: user.uid,
            name: values.organizationName,
            email: values.email,
            phoneNumber: values.phoneNumber || '',
            logoUrl: '',
            owner: values.owner,
            coOwner: values.coOwner || '',
            coach: values.coach || '',
            analyst: values.analyst || '',
            isVerified: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const docRef = await addDoc(orgCollection, orgProfileData);

        toast({
            title: "Profile Created!",
            description: "Your organization profile has been created successfully.",
        });

        router.push(`/organization/${docRef.id}`);

    } catch (error: any) {
        console.error('Error signing up:', error);
        toast({
            variant: 'destructive',
            title: 'Uh oh! Something went wrong.',
            description: error.message || 'There was a problem with your request.',
        });
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm">
            <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
                <Logo />
                <Button variant="outline" asChild>
                    <Link href="/">
                        <ArrowLeft className="mr-2" />
                        Back to Home
                    </Link>
                </Button>
            </div>
        </header>
        <main className="flex-1 flex items-center justify-center py-12">
            <Card className="w-full max-w-2xl mx-4">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">Organization / Team Sign Up</CardTitle>
                    <CardDescription>
                        Create your organization or team profile to start connecting with players.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="organizationName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Organization/Team Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Team Soul" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Contact Email</FormLabel>
                                            <FormControl>
                                                <Input type="email" placeholder="contact@example.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="phoneNumber"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Phone Number (Optional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="+91 1234567890" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="owner"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Owner</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. John Doe" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="coOwner"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Co-owner (Optional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Jane Smith" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="coach"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Coach (Optional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Mike Ross" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="analyst"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Analyst (Optional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Rachel Zane" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Password</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input type={showPassword ? "text" : "password"} placeholder="••••••••" {...field} />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="absolute top-0 right-0 h-full w-10 text-muted-foreground"
                                                        onClick={() => setShowPassword(prev => !prev)}
                                                    >
                                                        {showPassword ? <EyeOff /> : <Eye />}
                                                        <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                                                    </Button>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="confirmPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Confirm Password</FormLabel>
                                            <FormControl>
                                                 <div className="relative">
                                                    <Input type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" {...field} />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="absolute top-0 right-0 h-full w-10 text-muted-foreground"
                                                        onClick={() => setShowConfirmPassword(prev => !prev)}
                                                    >
                                                        {showConfirmPassword ? <EyeOff /> : <Eye />}
                                                        <span className="sr-only">{showConfirmPassword ? "Hide password" : "Show password"}</span>
                                                    </Button>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <Button type="submit" className="w-full">Create Profile</Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </main>
    </div>
  );
}
