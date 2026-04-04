'use client';

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';

import { type PlayerStats } from '@/lib/types';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

const chartConfig = {
  score: {
    label: 'Score',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

export function PlayerRadarChart({ stats }: { stats: PlayerStats }) {
    
  const data = [
    { skill: 'Assaulting', score: stats.assaulting },
    { skill: 'IGLing', score: stats.igling },
    { skill: 'Support', score: stats.support },
    { skill: 'Survival', score: stats.survival },
    { skill: 'Sniping', score: stats.sniping },
  ];

  return (
    <ChartContainer config={chartConfig} className="mx-auto aspect-square h-full">
      <ResponsiveContainer>
        <RadarChart data={data}>
          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
          <PolarGrid />
          <PolarAngleAxis dataKey="skill" />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            dataKey="score"
            fill="var(--color-score)"
            fillOpacity={0.6}
            stroke="var(--color-score)"
          />
        </RadarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
