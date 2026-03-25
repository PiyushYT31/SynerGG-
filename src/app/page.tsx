"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { players as allPlayers, teams as allTeams } from "@/lib/data";
import type { Player, Team, PlayerRole, Playstyle, Device } from "@/lib/types";
import { PlayerCard } from "@/components/player-card";
import { TeamCard } from "@/components/team-card";
import { PlayerProfile } from "@/components/player-profile";
import { TeamProfile } from "@/components/team-profile";
import { Logo } from "@/components/logo";

const playerRoles: PlayerRole[] = ['IGL', 'Entry Fragger', 'Support', 'Assaulter', 'Sniper'];
const playstyles: Playstyle[] = ['Aggressive', 'Tactical', 'Passive', 'Edge-Player', 'Drop-Clasher', 'Center-Zone'];
const devices: Device[] = ['iOS', 'Android'];

export default function SynergyConnectDashboard() {
  const [selectedPlayer, setSelectedPlayer] = React.useState<Player | null>(null);
  const [selectedTeam, setSelectedTeam] = React.useState<Team | null>(null);

  const [roleFilter, setRoleFilter] = useState<PlayerRole | "all">("all");
  const [playstyleFilter, setPlaystyleFilter] = useState<Playstyle | "all">("all");
  const [deviceFilter, setDeviceFilter] = useState<Device | "all">("all");

  const filteredPlayers = useMemo(() => {
    return allPlayers.filter((player) => {
      const roleMatch = roleFilter === "all" || player.role === roleFilter;
      const playstyleMatch = playstyleFilter === "all" || player.playstyle.includes(playstyleFilter);
      const deviceMatch = deviceFilter === "all" || player.device === deviceFilter;
      return roleMatch && playstyleMatch && deviceMatch;
    });
  }, [roleFilter, playstyleFilter, deviceFilter]);
  
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Logo />
        </div>
      </header>
      <main className="flex-1">
        <div className="container mx-auto px-4 md:px-6 py-8">
          <Tabs defaultValue="players" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
              <TabsTrigger value="players">Find Players</TabsTrigger>
              <TabsTrigger value="teams">Find Teams</TabsTrigger>
            </TabsList>
            <TabsContent value="players" className="mt-6">
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as PlayerRole | "all")}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Filter by Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {playerRoles.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                  </SelectContent>
                </Select>
                 <Select value={playstyleFilter} onValueChange={(value) => setPlaystyleFilter(value as Playstyle | "all")}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Filter by Playstyle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Playstyles</SelectItem>
                    {playstyles.map(style => <SelectItem key={style} value={style}>{style}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={deviceFilter} onValueChange={(value) => setDeviceFilter(value as Device | "all")}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Filter by Device" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Devices</SelectItem>
                     {devices.map(device => <SelectItem key={device} value={device}>{device}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredPlayers.map((player) => (
                  <PlayerCard
                    key={player.id}
                    player={player}
                    onViewProfile={() => setSelectedPlayer(player)}
                  />
                ))}
              </div>
            </TabsContent>
            <TabsContent value="teams" className="mt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {allTeams.map((team) => (
                  <TeamCard
                    key={team.id}
                    team={team}
                    onViewProfile={() => setSelectedTeam(team)}
                  />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Dialog open={!!selectedPlayer} onOpenChange={(open) => !open && setSelectedPlayer(null)}>
        <DialogContent className="max-w-4xl w-full h-[90vh] flex flex-col p-0">
          {selectedPlayer && <PlayerProfile player={selectedPlayer} />}
        </DialogContent>
      </Dialog>
      
      <Dialog open={!!selectedTeam} onOpenChange={(open) => !open && setSelectedTeam(null)}>
        <DialogContent className="max-w-4xl w-full h-[90vh] flex flex-col p-0">
          {selectedTeam && <TeamProfile team={selectedTeam} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
