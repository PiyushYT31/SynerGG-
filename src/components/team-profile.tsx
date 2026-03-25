import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Team, RosterStatus } from '@/lib/types';
import { RoleIcon } from './role-icon';
import { Lock, Unlock, UserPlus, Trophy, Info } from 'lucide-react';

interface TeamProfileProps {
  team: Team;
}

const statusConfig: Record<RosterStatus, { icon: React.ElementType, color: string, text: string }> = {
    'Locked': { icon: Lock, color: 'text-muted-foreground', text: 'Filled' },
    'Vacant': { icon: UserPlus, color: 'text-primary', text: 'Vacant' },
    'Open for Replacement': { icon: Unlock, color: 'text-secondary', text: 'Tryouts Open' },
}

export function TeamProfile({ team }: TeamProfileProps) {
  return (
    <ScrollArea className="h-full">
      <div className="p-6">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex-shrink-0 flex flex-col items-center sm:items-start">
            <Avatar className="w-28 h-28 border-4 border-primary/30 shadow-lg">
              <AvatarImage src={team.logoUrl} alt={team.orgName} />
              <AvatarFallback>{team.orgName.substring(0, 2)}</AvatarFallback>
            </Avatar>
            <h2 className="font-headline text-3xl font-bold mt-3">{team.orgName}</h2>
          </div>
          <div className="flex-1 space-y-4">
             <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold text-muted-foreground flex items-center gap-2"><Info className="w-4 h-4" /> About Us</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm">{team.bio}</p>
                </CardContent>
             </Card>
             <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold text-muted-foreground flex items-center gap-2"><Trophy className="w-4 h-4" /> Achievements</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="list-disc list-inside text-sm space-y-1">
                        {team.achievements.map((ach, i) => <li key={i}>{ach}</li>)}
                    </ul>
                </CardContent>
             </Card>
          </div>
        </div>

        <div className="mt-6">
             <h3 className="text-xl font-headline font-bold mb-4">Current Roster</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {team.roster.map((slot, index) => {
                    const config = statusConfig[slot.status];
                    return (
                        <Card key={index} className="bg-card/80">
                            <CardContent className="p-4 flex items-center gap-4">
                                <Avatar className="w-12 h-12">
                                    {slot.player && <AvatarImage src={slot.player.avatarUrl} />}
                                    <AvatarFallback>
                                        <RoleIcon role={slot.role} className="w-6 h-6 text-muted-foreground" />
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <p className="font-semibold text-sm text-muted-foreground">{slot.role}</p>
                                    <p className="font-bold text-lg truncate">{slot.player?.ign ?? 'Unfilled'}</p>
                                </div>
                                <Badge variant="outline" className={`gap-1.5 ${config.color} border-current/30`}>
                                    <config.icon className="w-3 h-3" />
                                    <span className="text-xs">{config.text}</span>
                                </Badge>
                            </CardContent>
                        </Card>
                    );
                })}
             </div>
        </div>

        <div className="mt-6">
             <Card className="bg-gradient-to-br from-primary/10 via-background to-background">
                <CardHeader>
                    <CardTitle className="font-headline">Our Team Style</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground italic">"{team.teamStyle}"</p>
                </CardContent>
             </Card>
        </div>
      </div>
    </ScrollArea>
  );
}
