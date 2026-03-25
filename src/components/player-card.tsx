import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RoleIcon } from '@/components/role-icon';
import { getYoutubeVideoId } from '@/lib/utils';
import type { Player } from '@/lib/types';

interface PlayerCardProps {
  player: Player;
  onViewProfile: () => void;
}

export function PlayerCard({ player, onViewProfile }: PlayerCardProps) {
  const videoId = getYoutubeVideoId(player.highlightsURL);
  const thumbnailUrl = videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : 'https://picsum.photos/seed/placeholder/480/360';
  
  return (
    <Card className="flex flex-col overflow-hidden group transition-all duration-300 hover:border-primary hover:shadow-lg hover:shadow-primary/10">
      <CardHeader className="p-4">
        <div className="relative w-full aspect-video rounded-md overflow-hidden">
          <Image
            src={thumbnailUrl}
            alt={`Gameplay highlights for ${player.ign}`}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            data-ai-hint="gameplay screenshot"
          />
           <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
           <div className="absolute bottom-2 left-2 flex items-center gap-2">
            <RoleIcon role={player.role} className="w-5 h-5 text-primary" />
            <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm text-foreground">
                {player.role}
            </Badge>
           </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-4 pt-0">
        <CardTitle className="font-headline text-lg truncate">{player.ign}</CardTitle>
        <div className="text-sm text-muted-foreground flex items-center justify-between mt-1">
            <span>{player.experience}</span>
            <span>F/D: <span className="font-semibold text-foreground">{player.fdRatio}</span></span>
        </div>
         <div className="flex flex-wrap gap-1 mt-2">
            {player.playstyle.map(style => (
                <Badge key={style} variant="outline" className="text-xs">{style}</Badge>
            ))}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button onClick={onViewProfile} className="w-full bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20">View Profile</Button>
      </CardFooter>
    </Card>
  );
}
