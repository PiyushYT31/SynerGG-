'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useParams } from "next/navigation";

export default function EditPlayerProfilePage() {
    const params = useParams();
    const playerId = params.playerId as string;

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm">
                <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
                    <Logo />
                    <Button asChild variant="outline">
                        <Link href={`/player/${playerId}`}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Profile
                        </Link>
                    </Button>
                </div>
            </header>
            <main className="flex-1 flex items-center justify-center">
                <Card className="m-4 max-w-lg w-full">
                    <CardHeader>
                        <CardTitle>Edit Player Profile</CardTitle>
                        <CardDescription>
                            This is where you will edit your player profile. This functionality is coming soon.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Editing functionality is under construction.</p>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
