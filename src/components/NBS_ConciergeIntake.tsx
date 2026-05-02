import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { CheckCircle, Shield } from "lucide-react";
import { encryptData } from "@/lib/cloudVault";
import { CompanyConfig } from "@/logic/PaymentOrchestrator";

export function NBS_ConciergeIntake() {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState<CompanyConfig>({
    legalName: "",
    mailingAddress: "",
    customizableFooter: "",
  });

  const handleNext = () => setStep((s) => s + 1);
  const handlePrev = () => setStep((s) => s - 1);

  const handleFinalize = async () => {
    // Adhere to Victus-Bound Encryption
    const encryptedData = await encryptData(JSON.stringify(config, null, 2));

    // Local Only: Export encrypted configuration without external pings
    const blob = new Blob([encryptedData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "NBS_CompanyConfig_Encrypted.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setStep(4);
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          NBS Concierge Intake
        </CardTitle>
        <CardDescription>
          Secure local-first configuration wizard.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Legal Name</Label>
              <Input
                value={config.legalName}
                onChange={(e) => setConfig({ ...config, legalName: e.target.value })}
                placeholder="e.g., Catering By Wendy"
              />
            </div>
            <div className="flex justify-end pt-4">
              <Button onClick={handleNext} disabled={!config.legalName}>Next</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Mailing Address</Label>
              <Input
                value={config.mailingAddress}
                onChange={(e) => setConfig({ ...config, mailingAddress: e.target.value })}
                placeholder="e.g., PO Box 123, North Conway, NH"
              />
            </div>
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={handlePrev}>Back</Button>
              <Button onClick={handleNext} disabled={!config.mailingAddress}>Next</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Customizable Footer</Label>
              <Input
                value={config.customizableFooter}
                onChange={(e) => setConfig({ ...config, customizableFooter: e.target.value })}
                placeholder="e.g., Professional Catering Services"
              />
            </div>
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={handlePrev}>Back</Button>
              <Button onClick={handleFinalize} disabled={!config.customizableFooter}>
                Encrypt & Save
              </Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="text-center space-y-4 py-6">
            <div className="flex justify-center">
              <CheckCircle className="w-12 h-12 text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold">Configuration Secured</h3>
            <p className="text-sm text-muted-foreground">
              Your config has been encrypted using the Victus-Bound protocol and saved locally.
            </p>
            <Button variant="outline" onClick={() => setStep(1)} className="mt-4">
              Restart Intake
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}