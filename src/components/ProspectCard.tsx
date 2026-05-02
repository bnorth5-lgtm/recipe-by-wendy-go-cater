import React, { useState } from 'react';
import { TargetCaterer } from '@/logic/ProspectingEngine';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { generatePitchWithLocalAi } from '@/lib/localAi';
import { Shield, Database, DollarSign, Wand2, Loader2 } from 'lucide-react';

export function ProspectCard({ prospect }: { prospect: TargetCaterer }) {
  const [pitch, setPitch] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGeneratePitch = async () => {
    setLoading(true);
    try {
      const generated = await generatePitchWithLocalAi(prospect.name, prospect.currentTechStack);
      setPitch(generated);
    } catch (e) {
      setPitch("Error generating pitch. Check local Ollama connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-card hover:shadow-md transition-shadow h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold text-primary flex justify-between items-start">
          {prospect.name}
          <Badge variant={prospect.securityRequirementLevel > 7 ? 'destructive' : 'secondary'} className="text-[10px]">
            <Shield className="w-3 h-3 mr-1" />
            Lvl {prospect.securityRequirementLevel}
          </Badge>
        </CardTitle>
        <CardDescription className="flex flex-col gap-1 mt-1 text-xs">
          <span className="flex items-center"><Database className="w-3 h-3 mr-1.5 opacity-70" /> Stack: {prospect.currentTechStack}</span>
          <span className="flex items-center"><DollarSign className="w-3 h-3 mr-1.5 opacity-70" /> Vol: ${prospect.estimatedMonthlyVolume.toLocaleString()} /mo</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="mt-auto pt-0 flex flex-col gap-3">
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full gap-2 text-xs border-amber-500/30 hover:bg-amber-500/10 text-amber-700 dark:text-amber-400" 
          onClick={handleGeneratePitch}
          disabled={loading}
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
          {pitch ? 'Regenerate Pitch' : 'Pitch Generator'}
        </Button>
        {pitch && (
          <div className="p-3 bg-amber-500/5 rounded-md border border-amber-500/20 text-sm italic text-foreground">
            "{pitch}"
          </div>
        )}
      </CardContent>
    </Card>
  );
}