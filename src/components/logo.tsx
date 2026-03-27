import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2 group", className)}>
      <Zap className="h-7 w-7 text-primary transition-transform group-hover:rotate-12" />
      <h1 className="font-headline text-xl font-bold text-foreground tracking-tighter">
        SynerGG
      </h1>
    </Link>
  );
}
