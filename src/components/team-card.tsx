import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RoleIcon } from '@/components/role-icon';
import type { Team } from '@/lib/types';
import { Users } from 'lucide-react';

interface TeamCardProps {
  team: Team;
  onViewProfile: () => void;
}

export function TeamCard({ team, onViewProfile }: TeamCardProps) {
  const vacantSlots = team.roster.filter(slot => slot.status === 'Vacant' || slot.status === 'Open for Replacement');

  return (
    <Card className="flex flex-col overflow-hidden group transition-all duration-300 hover:border-primary hover:shadow-lg hover:shadow-primary/10">
      <CardHeader className="p-4 flex flex-row items-center gap-4 space-y-0">
        <Avatar className="h-16 w-16 border-2 border-primary/20">
          <AvatarImage src={team.logoUrl} alt={`${team.orgName} logo`} />
          <AvatarFallback>{team.orgName.substring(0, 2)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <CardTitle className="font-headline text-lg truncate">{team.orgName}</CardTitle>
          <p className="text-sm text-muted-foreground line-clamp-2">{team.bio}</p>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-4 pt-0">
        <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Open Slots
        </h4>
        {vacantSlots.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {vacantSlots.map((slot, index) => (
              <Badge key={index} variant="secondary" className="bg-secondary/20 text-secondary-foreground border border-secondary/20 hover:bg-secondary/30">
                <RoleIcon role={slot.role} className="w-3 h-3 mr-1.5" />
                {slot.role}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">No open positions currently.</p>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button onClick={onViewProfile} className="w-full bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20">View Organization</Button>
      </CardFooter>
    </Card>
  );
}
