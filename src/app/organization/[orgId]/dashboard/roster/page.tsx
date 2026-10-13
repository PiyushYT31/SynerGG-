'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { collection, query, where, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';

import { useFirebase, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { type RosterSlot, type PlayerProfile, type OrganizationProfile, ROLE_TO_SLOT_NAME } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Edit, Trash2, User } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const ROLES = ['IGL', 'Entry Fragger', 'Support', 'Assaulter', 'Sniper', 'Substitute'];
const PLAYSTYLES = ['Aggressive', 'Tactical', 'Balanced', 'Passive'];
const STATUSES = ['Locked', 'Vacant', 'Open for Replacement'];

const rosterSlotSchema = z.object({
  requiredRole: z.enum(['IGL', 'Entry Fragger', 'Support', 'Assaulter', 'Sniper', 'Substitute']),
  requiredPlaystyle: z.enum(['Aggressive', 'Tactical', 'Balanced', 'Passive']),
  minFdRatio: z.coerce.number().min(0, 'Minimum F/D Ratio cannot be negative.'),
  status: z.enum(['Locked', 'Vacant', 'Open for Replacement']),
  playerId: z.string().optional(),
});
type RosterSlotFormValues = z.infer<typeof rosterSlotSchema>;

function RosterSlotForm({
  onSubmit,
  defaultValues,
  isSubmitting,
}: {
  onSubmit: SubmitHandler<RosterSlotFormValues>;
  defaultValues?: Partial<RosterSlotFormValues>;
  isSubmitting: boolean;
}) {
  const form = useForm<RosterSlotFormValues>({
    resolver: zodResolver(rosterSlotSchema),
    defaultValues: {
      requiredPlaystyle: 'Balanced',
      status: 'Vacant',
      minFdRatio: 0,
      playerId: '',
      ...defaultValues,
    },
  });

  const selectedRole = form.watch('requiredRole');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="requiredRole" render={({ field }) => (
            <FormItem><FormLabel>Required Role</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger></FormControl><SelectContent>{ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="requiredPlaystyle" render={({ field }) => (
            <FormItem><FormLabel>Required Playstyle</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a playstyle" /></SelectTrigger></FormControl><SelectContent>{PLAYSTYLES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
          )} />
        </div>
        {selectedRole && (
          <div className="rounded-md border border-primary/30 bg-primary/5 px-4 py-3">
            <p className="text-sm text-muted-foreground">Slot Name: <span className="font-semibold text-foreground">{ROLE_TO_SLOT_NAME[selectedRole] || selectedRole}</span></p>
          </div>
        )}
        <FormField
          control={form.control}
          name="minFdRatio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Minimum F/D Ratio</FormLabel>
              <FormControl><Input type="number" step="0.1" placeholder="e.g. 3.0" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField control={form.control} name="status" render={({ field }) => (
            <FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl><SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
        )} />
        <FormField
          control={form.control}
          name="playerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Player ID (Optional)</FormLabel>
              <FormControl><Input placeholder="Enter Player Profile ID" {...field} value={field.value ?? ''} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Slot'}</Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

function SlotCard({ slot }: { slot: RosterSlot }) {
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const playerRef = useMemoFirebase(() => (firestore && slot.playerId ? doc(firestore, 'player_profiles', slot.playerId) : null), [firestore, slot.playerId]);
    const { data: player, isLoading: isPlayerLoading } = useDoc<PlayerProfile>(playerRef);

    const handleUpdate: SubmitHandler<RosterSlotFormValues> = (data) => {
        if (!firestore) return;
        setIsSubmitting(true);
        const slotDocRef = doc(firestore, 'roster_slots', slot.id);
        // Auto-assign slot name from role
        const slotName = ROLE_TO_SLOT_NAME[data.requiredRole] || data.requiredRole;
        const updatedData = {
            ...data,
            slotName,
            playerId: data.playerId || null, // Ensure it's null if empty
            updatedAt: new Date().toISOString()
        };

        updateDoc(slotDocRef, updatedData)
            .then(() => {
                toast({ title: 'Success', description: 'Roster slot updated.' });
                setIsDialogOpen(false);
            })
            .catch((serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: slotDocRef.path,
                    operation: 'update',
                    requestResourceData: updatedData,
                });
                errorEmitter.emit('permission-error', permissionError);
                toast({
                    variant: 'destructive',
                    title: 'Update Failed',
                    description: 'Could not update roster slot. You may not have permission.',
                });
            })
            .finally(() => {
                setIsSubmitting(false);
            });
    };

    const handleDelete = async () => {
        if (!firestore) return;

        setIsSubmitting(true);
        const slotDocRef = doc(firestore, 'roster_slots', slot.id);

        try {
            await deleteDoc(slotDocRef);
            toast({ title: 'Success', description: 'Roster slot has been permanently deleted.' });
        } catch (serverError) {
             console.error("Deletion failed:", serverError);
             const permissionError = new FirestorePermissionError({
                path: slotDocRef.path,
                operation: 'delete',
            });
            errorEmitter.emit('permission-error', permissionError);
            toast({
                variant: 'destructive',
                title: 'Deletion Failed',
                description: 'Could not delete roster slot. You may not have permission.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle>{slot.slotName}</CardTitle>
                <CardDescription>{slot.requiredRole} - {slot.requiredPlaystyle || 'No playstyle set'}</CardDescription>
            </div>
             <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader><DialogTitle>Edit Roster Slot</DialogTitle></DialogHeader>
                    <RosterSlotForm onSubmit={handleUpdate} defaultValues={slot} isSubmitting={isSubmitting} />
                </DialogContent>
            </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p><span className="font-semibold">Status:</span> {slot.status}</p>
        <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="font-semibold">Player:</span>
            {isPlayerLoading ? <Skeleton className="h-4 w-24" /> : player ? <span>{player.ign}</span> : <span className="text-muted-foreground">N/A</span>}
        </div>
         <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={isSubmitting}><Trash2 className="mr-2 h-4 w-4"/> Delete Slot</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete the &apos;{slot.slotName}&apos; slot. This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        className="bg-destructive hover:bg-destructive/90"
                        onClick={handleDelete}
                    >
                        Yes, delete slot
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

export default function RosterManagementPage() {
  const params = useParams();
  const orgId = params.orgId as string;
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const orgRef = useMemoFirebase(() => (firestore && orgId ? doc(firestore, 'organization_profiles', orgId) : null), [firestore, orgId]);
  const { data: orgProfile, isLoading: isOrgLoading } = useDoc<OrganizationProfile>(orgRef);

  const rosterQuery = useMemoFirebase(() => (firestore && orgId ? query(collection(firestore, 'roster_slots'), where('organizationId', '==', orgId)) : null), [firestore, orgId]);
  const { data: rosterSlots, isLoading: isRosterLoading } = useCollection<RosterSlot>(rosterQuery);

  const handleCreate: SubmitHandler<RosterSlotFormValues> = (data) => {
    if (!firestore || !user || !orgProfile) return;
    setIsSubmitting(true);
    
    // Auto-assign slot name from the role
    const slotName = ROLE_TO_SLOT_NAME[data.requiredRole] || data.requiredRole;
    
    const slotsCollectionRef = collection(firestore, 'roster_slots');
    const newSlotData = {
      ...data,
      slotName,
      organizationId: orgId,
      organizationManagerUserId: user.uid,
      playerId: data.playerId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addDoc(slotsCollectionRef, newSlotData)
      .then(() => {
        toast({ title: 'Success', description: 'New roster slot created.' });
        setIsDialogOpen(false);
      })
      .catch((serverError) => {
        const permissionError = new FirestorePermissionError({
            path: slotsCollectionRef.path,
            operation: 'create',
            requestResourceData: newSlotData,
        });
        errorEmitter.emit('permission-error', permissionError);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not create roster slot.' });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const handleGenerateDefaultSlots = async () => {
    if (!firestore || !user || !orgProfile) return;
    setIsSubmitting(true);
    const slotsCollection = collection(firestore, 'roster_slots');
    const defaultSlots = [
      { role: 'IGL', slotName: 'IGL' },
      { role: 'Assaulter', slotName: 'Assaulter' },
      { role: 'Entry Fragger', slotName: 'Entry Fragger' },
      { role: 'Support', slotName: 'Support' },
      { role: 'Substitute', slotName: 'Substitute' },
    ];
    try {
      await Promise.all(defaultSlots.map(slot => 
        addDoc(slotsCollection, {
          organizationId: orgId,
          organizationManagerUserId: user.uid,
          slotName: slot.slotName,
          status: 'Vacant',
          requiredRole: slot.role,
          requiredPlaystyle: 'Balanced',
          minFdRatio: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      ));
      toast({ title: 'Success', description: '5 default vacant roster slots created (IGL, Assaulter, Entry Fragger, Support, Substitute).' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Could not create default slots.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = isOrgLoading || isRosterLoading;

  return (
    <div>
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold font-headline">Manage Roster</h2>
            <div className="flex gap-2">
                {(!rosterSlots || rosterSlots.length === 0) && (
                    <Button variant="outline" onClick={handleGenerateDefaultSlots} disabled={isSubmitting}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Create Default Slots
                    </Button>
                )}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button><PlusCircle className="mr-2 h-4 w-4" /> Add Roster Slot</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Create New Roster Slot</DialogTitle></DialogHeader>
                        <RosterSlotForm onSubmit={handleCreate} isSubmitting={isSubmitting} />
                    </DialogContent>
                </Dialog>
            </div>
        </div>
        {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
            </div>
        ) : rosterSlots && rosterSlots.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rosterSlots.map(slot => <SlotCard key={slot.id} slot={slot} />)}
            </div>
        ) : (
            <Card className="text-center py-12">
                <CardHeader><CardTitle>No Roster Slots</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-muted-foreground">You don&apos;t have any roster slots yet. You can create the standard 5 slots automatically or add custom slots manually.</p>
                    <Button onClick={handleGenerateDefaultSlots} disabled={isSubmitting}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Create Default Slots (IGL, Assaulter, Entry Fragger, Support, Substitute)
                    </Button>
                </CardContent>
            </Card>
        )}
    </div>
  );
}
