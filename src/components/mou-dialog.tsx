'use client';

import { useRef, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { doc, updateDoc } from 'firebase/firestore';

import { type PlayerProfile, type OrganizationProfile, type TryoutRequest } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/logo';
import { Download, Check, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';

interface MoUDialogProps {
    request: TryoutRequest;
    player: PlayerProfile;
    organization: OrganizationProfile;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentUserType: 'player' | 'org';
}

export function MoUDialog({ request, player, organization, open, onOpenChange, currentUserType }: MoUDialogProps) {
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const mouContentRef = useRef<HTMLDivElement>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleDownloadPdf = async () => {
        const element = mouContentRef.current;
        if (!element) return;

        setIsProcessing(true);
        try {
            const canvas = await html2canvas(element, { scale: 2 });
            const data = canvas.toDataURL('image/png');

            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgProperties = pdf.getImageProperties(data);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProperties.height * pdfWidth) / imgProperties.width;

            pdf.addImage(data, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`MoU-${organization.name}-${player.ign}.pdf`);
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not generate PDF.' });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleConfirm = async () => {
        if (!firestore) return;
        setIsProcessing(true);

        const requestRef = doc(firestore, 'tryout_requests', request.id);
        const updateData = currentUserType === 'player'
            ? { mouPlayerConfirmedAt: new Date().toISOString() }
            : { mouOrgConfirmedAt: new Date().toISOString() };
        
        try {
            await updateDoc(requestRef, updateData);
            toast({ title: 'Agreement Confirmed', description: 'Your confirmation has been recorded.' });
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not confirm agreement.' });
        } finally {
            setIsProcessing(false);
        }
    }

    const isPlayerConfirmed = !!request.mouPlayerConfirmedAt;
    const isOrgConfirmed = !!request.mouOrgConfirmedAt;
    const canCurrentUserConfirm = 
        (currentUserType === 'player' && !isPlayerConfirmed) ||
        (currentUserType === 'org' && !isOrgConfirmed);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle className="font-headline text-2xl">Memorandum of Understanding</DialogTitle>
                    <DialogDescription>
                        This document outlines the agreement between {organization.name} and {player.ign}.
                    </DialogDescription>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto p-2">
                    <div ref={mouContentRef} className="bg-white text-black p-8 rounded-lg">
                        <div className="flex justify-between items-center border-b pb-4 mb-4">
                            <Logo />
                            <h2 className="text-2xl font-bold text-gray-800">Memorandum of Understanding</h2>
                        </div>
                        <div className="space-y-4 text-sm">
                            {request.mouGeneratedAt && <p><strong>Date of Agreement:</strong> {format(new Date(request.mouGeneratedAt), 'MMMM dd, yyyy')}</p>}
                            <p>This Memorandum of Understanding (MoU) is entered into by and between:</p>
                            <div className="pl-4">
                                <p><strong>The Organization:</strong> {organization.name}</p>
                                <p><strong>The Player:</strong> {player.playerName} (In-Game Name: {player.ign})</p>
                            </div>
                            <h3 className="font-bold pt-4 text-lg">1. Purpose</h3>
                            <p>The purpose of this MoU is to establish a formal tryout and potential roster position for The Player with The Organization for the game Battlegrounds Mobile India (BGMI).</p>
                            <h3 className="font-bold pt-4 text-lg">2. Agreement</h3>
                            <p>Upon acceptance of the tryout request{request.respondedAt && ` on ${format(new Date(request.respondedAt), 'MMMM dd, yyyy')}`}, The Player agrees to join The Organization's official roster in the role of <strong>{player.role}</strong>.</p>
                            <p>The Player will be placed in a roster slot with "Locked" status, indicating their commitment to The Organization for the agreed-upon term (as per team policies, to be discussed separately).</p>
                            <h3 className="font-bold pt-4 text-lg">3. Confirmation</h3>
                            <p>By digitally confirming this MoU, both parties acknowledge and agree to the terms outlined herein. This confirmation signifies the start of the official relationship between The Player and The Organization.</p>
                        </div>
                        <div className="mt-8 pt-4 border-t">
                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <h4 className="font-bold">Player Confirmation</h4>
                                    {isPlayerConfirmed && request.mouPlayerConfirmedAt ? (
                                        <p className="text-green-600 flex items-center gap-2 mt-2"><ShieldCheck /> Confirmed on {format(new Date(request.mouPlayerConfirmedAt), 'PPp')}</p>
                                    ) : (
                                        <p className="text-yellow-600 mt-2">Awaiting Confirmation</p>
                                    )}
                                </div>
                                 <div>
                                    <h4 className="font-bold">Organization Confirmation</h4>
                                    {isOrgConfirmed && request.mouOrgConfirmedAt ? (
                                        <p className="text-green-600 flex items-center gap-2 mt-2"><ShieldCheck /> Confirmed on {format(new Date(request.mouOrgConfirmedAt), 'PPp')}</p>
                                    ) : (
                                        <p className="text-yellow-600 mt-2">Awaiting Confirmation</p>
                                    )}
                                </div>
                            </div>
                        </div>
                         <p className="text-xs text-gray-500 mt-8 text-center">This is a non-binding agreement intended to formalize the initial roster placement. A formal contract may be presented separately.</p>
                    </div>
                </div>
                <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={handleDownloadPdf} disabled={isProcessing}>
                        <Download className="mr-2" /> Download as PDF
                    </Button>
                    {canCurrentUserConfirm && (
                         <Button onClick={handleConfirm} disabled={isProcessing}>
                            <Check className="mr-2" /> Confirm Agreement
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
