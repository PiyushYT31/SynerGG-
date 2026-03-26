import { Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2 group", className)}>
      <Target className="h-7 w-7 text-primary transition-transform group-hover:rotate-45" />
      <h1 className="font-headline text-xl font-bold text-foreground tracking-tighter">
        Transfer Window
      </h1>
    </Link>
  );
}
