"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getSynergyScore } from '@/app/actions';
import { Loader2, Zap } from 'lucide-react';
import type { CalculateSynergyMatchScoreOutput } from '@/ai/flows/calculate-synergy-match-score';

interface SynergyCalculatorProps {
  playerNeeds: string;
}

export function SynergyCalculator({ playerNeeds }: SynergyCalculatorProps) {
  const [orgStyle, setOrgStyle] = useState('');
  const [result, setResult] = useState<CalculateSynergyMatchScoreOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleCalculate = async () => {
    if (!orgStyle.trim()) {
      toast({
        title: 'Input Required',
        description: "Please describe your organization's team style.",
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    const response = await getSynergyScore(orgStyle, playerNeeds);

    if (response.success) {
      setResult(response.data);
    } else {
      toast({
        title: 'Error',
        description: response.error,
        variant: 'destructive',
      });
    }

    setIsLoading(false);
  };

  return (
    <Card className="bg-card/50 border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline">
          <Zap className="text-primary" />
          Synergy Match Calculator
        </CardTitle>
        <CardDescription>
          Enter your team's playstyle to calculate a synergy score with this player.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold text-sm mb-2 text-muted-foreground">Player's Ideal Teammates:</h4>
          <p className="text-sm p-3 bg-background/50 rounded-md border border-border/50">"{playerNeeds}"</p>
        </div>
        <Textarea
          placeholder="Describe your team's playstyle, e.g., 'We play an aggressive, edge-of-zone style focused on gatekeeping...'"
          value={orgStyle}
          onChange={(e) => setOrgStyle(e.target.value)}
          rows={3}
        />
        <Button onClick={handleCalculate} disabled={isLoading} className="w-full">
          {isLoading ? (
            <Loader2 className="animate-spin" />
          ) : (
            'Calculate Synergy'
          )}
        </Button>
        
        {result && (
          <div className="pt-4 transition-all animate-in fade-in-50">
            <h3 className="text-lg font-bold text-center mb-2 font-headline">Match Result</h3>
            <div className="flex flex-col items-center justify-center gap-4">
               <div className="relative h-32 w-32">
                <svg className="h-full w-full" viewBox="0 0 36 36">
                  <path
                    className="text-muted/20"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    strokeWidth="3"
                  />
                  <path
                    className="text-primary"
                    strokeDasharray={`${result.synergyScore}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    strokeLinecap="round"
                    strokeWidth="3"
                    transform="rotate(-90 18 18)"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold font-headline text-primary">{result.synergyScore}</span>
                    <span className="text-sm text-primary/80">%</span>
                </div>
              </div>
              <div className="text-center">
                <h4 className="font-semibold text-primary">Explanation</h4>
                <p className="text-sm text-muted-foreground">{result.explanation}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
