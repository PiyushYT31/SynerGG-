'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import Link from 'next/link';

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
import { ArrowLeft } from 'lucide-react';

const formSchema = z.object({
  organizationName: z.string().min(2, {
    message: 'Organization name must be at least 2 characters.',
  }),
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  phoneNumber: z.string().optional(),
  logo: z.string().url({ message: 'Please enter a valid logo URL.' }).optional(),
  owner: z.string().min(2, {
    message: 'Owner name must be at least 2 characters.',
  }),
  coOwner: z.string().optional(),
  coach: z.string().optional(),
  analyst: z.string().optional(),
});

export default function OrganizationSignUp() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      organizationName: '',
      email: '',
      phoneNumber: '',
      logo: '',
      owner: '',
      coOwner: '',
      coach: '',
      analyst: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    console.log(values);
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
                                                <Input placeholder="contact@example.com" {...field} />
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
                                    name="logo"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Logo URL (Optional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="https://example.com/logo.png" {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                For now, please provide a URL to your logo. We'll add file uploads soon.
                                            </FormDescription>
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
