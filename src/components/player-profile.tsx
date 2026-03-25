import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getYoutubeVideoId } from '@/lib/utils';
import type { Player } from '@/lib/types';
import { RoleIcon } from './role-icon';
import { SynergyCalculator } from './synergy-calculator';
import { FileVideo, Gamepad2, Smartphone } from 'lucide-react';

interface PlayerProfileProps {
  player: Player;
}

export function PlayerProfile({ player }: PlayerProfileProps) {
  const videoId = getYoutubeVideoId(player.highlightsURL);
  
  return (
    <ScrollArea className="h-full">
      <div className="p-6">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex-shrink-0 flex flex-col items-center sm:items-start">
            <Avatar className="w-28 h-28 border-4 border-primary/30 shadow-lg">
              <AvatarImage src={player.avatarUrl} alt={player.ign} />
              <AvatarFallback>{player.ign.substring(0, 2)}</AvatarFallback>
            </Avatar>
            <h2 className="font-headline text-3xl font-bold mt-3">{player.ign}</h2>
            <div className="flex items-center gap-2 mt-1 text-primary">
              <RoleIcon role={player.role} className="w-5 h-5" />
              <span className="font-semibold">{player.role}</span>
            </div>
          </div>
          <div className="flex-1">
             <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
              <div className="bg-card p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">F/D Ratio</p>
                <p className="text-2xl font-bold font-headline text-primary">{player.fdRatio}</p>
              </div>
              <div className="bg-card p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">Experience</p>
                <p className="text-xl font-semibold text-foreground">{player.experience}</p>
              </div>
              <div className="bg-card p-3 rounded-lg flex flex-col items-center justify-center">
                <p className="text-sm text-muted-foreground">Device</p>
                <div className="flex items-center gap-2 text-xl font-semibold text-foreground">
                    <Smartphone className="w-5 h-5" />
                    <span>{player.device}</span>
                </div>
              </div>
            </div>
            <div className="mt-4">
                <h3 className="font-semibold text-muted-foreground mb-2 flex items-center gap-2"><Gamepad2 className="w-4 h-4" />Playstyles</h3>
                <div className="flex flex-wrap gap-2">
                    {player.playstyle.map(style => (
                        <Badge key={style} variant="secondary">{style}</Badge>
                    ))}
                </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-6">
            <div className="lg:col-span-3 space-y-6">
                 {videoId && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="aspect-video w-full rounded-lg overflow-hidden">
                        <iframe
                          src={`https://www.youtube.com/embed/${videoId}`}
                          title="YouTube video player"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="w-full h-full"
                        ></iframe>
                      </div>
                      <Button asChild variant="link" className="mt-2 text-primary">
                        <a href={player.highlightsURL} target="_blank" rel="noopener noreferrer">
                          <FileVideo className="mr-2 h-4 w-4" />
                          Watch on YouTube
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                )}
            </div>
            <div className="lg:col-span-2">
                <SynergyCalculator playerNeeds={player.synergyNeeds} />
            </div>
        </div>
      </div>
    </ScrollArea>
  );
}
