'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, addDoc } from 'firebase/firestore';
import { format, subYears } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  playerName: z.string().min(2, { message: 'Player name must be at least 2 characters.' }),
  email: z.string().email(),
  phoneNumber: z.string().min(10, { message: 'Please enter a valid phone number.' }),
  ign: z.string().min(2, { message: 'In-game name must be at least 2 characters.' }),
  bgmiUid: z.string().min(5, { message: 'Please enter a valid BGMI UID.' }),
  dateOfBirth: z.date({
    required_error: "A date of birth is required.",
  }).refine((date) => {
    return date <= subYears(new Date(), 16);
  }, {
    message: "You must be at least 16 years old to sign up.",
  }),
  role: z.enum(['IGL', 'Entry Fragger', 'Support', 'Assaulter', 'Sniper', 'Substitute']),
  playstyle: z.enum(['Aggressive', 'Tactical', 'Balanced', 'Passive']),
  fdRatio: z.coerce.number().min(0, { message: 'F/D Ratio cannot be negative.' }),
  device: z.enum(['iOS', 'Android']),
  experience: z.string().min(20, { message: 'Please provide more details about your experience (at least 20 characters).' }),
  idealTeammateStrategy: z.string().min(20, { message: 'Please describe your ideal team (at least 20 characters).' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});

export default function PlayerSignUp() {
  const { auth, firestore } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      playerName: '',
      email: '',
      phoneNumber: '',
      ign: '',
      bgmiUid: '',
      dateOfBirth: undefined,
      experience: '',
      idealTeammateStrategy: '',
      password: '',
      confirmPassword: '',
      fdRatio: 0,
      role: undefined,
      playstyle: undefined,
      device: undefined,
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

        const playerCollection = collection(firestore, 'player_profiles');
        
        const playerProfileData = {
            userId: user.uid,
            playerName: values.playerName,
            email: values.email,
            phoneNumber: values.phoneNumber,
            ign: values.ign,
            bgmiUid: values.bgmiUid,
            dateOfBirth: values.dateOfBirth.toISOString(),
            role: values.role,
            device: values.device,
            fdRatio: values.fdRatio,
            playstyle: values.playstyle,
            experience: values.experience,
            idealTeammateStrategy: values.idealTeammateStrategy,
            achievements: [],
            povLinks: [],
            socialLinks: [],
            playerStats: {
                assaulting: 50,
                igling: 50,
                support: 50,
                survival: 50,
                sniping: 50,
            },
            profilePictureUrl: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const docRef = await addDoc(playerCollection, playerProfileData);

        toast({
            title: "Profile Created!",
            description: "Your player profile has been created successfully.",
        });

        router.push(`/player/${docRef.id}`);

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
            <Card className="w-full max-w-3xl mx-4">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">Player Sign Up</CardTitle>
                    <CardDescription>
                        Create your player profile to showcase your skills and find a team.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                <FormField
                                    control={form.control}
                                    name="playerName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Player Name</FormLabel>
                                            <FormControl><Input placeholder="e.g. John Doe" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl><Input type="email" placeholder="you@example.com" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="phoneNumber"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Phone Number</FormLabel>
                                            <FormControl><Input placeholder="+91 1234567890" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
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
                                    name="bgmiUid"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>BGMI User ID (UID)</FormLabel>
                                            <FormControl><Input placeholder="5123456789" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="dateOfBirth"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col pt-2">
                                        <FormLabel>Date of Birth</FormLabel>
                                        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                                            <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full pl-3 text-left font-normal",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                                >
                                                {field.value ? (
                                                    format(field.value, "PPP")
                                                ) : (
                                                    <span>Pick a date</span>
                                                )}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={(date) => {
                                                    field.onChange(date);
                                                    setIsCalendarOpen(false);
                                                }}
                                                disabled={(date) =>
                                                date > new Date() || date < new Date("1900-01-01")
                                                }
                                                captionLayout="dropdown"
                                                fromYear={1960}
                                                toYear={new Date().getFullYear()}
                                                initialFocus
                                            />
                                            </PopoverContent>
                                        </Popover>
                                        <FormDescription>
                                            You must be at least 16 years old.
                                        </FormDescription>
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
                                    name="device"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Device</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl><SelectTrigger><SelectValue placeholder="Select your device OS" /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    <SelectItem value="iOS">iOS</SelectItem>
                                                    <SelectItem value="Android">Android</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="md:col-span-2">
                                <FormField
                                    control={form.control}
                                    name="experience"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Experience</FormLabel>
                                            <FormControl><Textarea placeholder="Describe your competitive experience, past teams, etc." {...field} /></FormControl>
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
                                            <FormControl><Textarea placeholder="What kind of players do you work best with? (e.g., 'I need a calm IGL who makes decisive calls')" {...field} /></FormControl>
                                             <FormDescription>This helps us find the best team for you.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                </div>

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
                            <Button type="submit" className="w-full">Create Player Profile</Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </main>
    </div>
  );
}
