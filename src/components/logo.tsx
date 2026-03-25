import { Target } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Target className="h-7 w-7 text-primary" />
      <h1 className="font-headline text-xl font-bold text-foreground tracking-tighter">
        BGMI Synergy Connect
      </h1>
    </div>
  );
}
