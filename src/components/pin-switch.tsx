"use client";

import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";
import { toast } from "sonner";

interface PinSwitchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PinSwitch({ open, onOpenChange }: PinSwitchProps) {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (open) {
      setPin("");
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [open]);

  const handleDigit = (digit: string, index: number) => {
    if (!/^\d$/.test(digit)) return;
    const newPin = pin.substring(0, index) + digit + pin.substring(index + 1);
    setPin(newPin);

    if (index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when 4 digits entered
    if (newPin.length === 4 && index === 3) {
      submitPin(newPin);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const newPin = pin.substring(0, index) + pin.substring(index + 1);
      setPin(newPin);
      if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const submitPin = async (pinCode: string) => {
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        pin: pinCode,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Invalid PIN. Try again.");
        setPin("");
        inputRefs.current[0]?.focus();
      } else {
        toast.success("User switched");
        onOpenChange(false);
        window.location.reload();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-center">Quick Switch</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground text-center">Enter your 4-digit PIN</p>
        <div className="flex justify-center gap-3 my-4">
          {[0, 1, 2, 3].map((i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={pin[i] || ""}
              onChange={(e) => handleDigit(e.target.value, i)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              disabled={loading}
              className="w-14 h-14 text-center text-2xl font-mono border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:outline-none"
              autoComplete="off"
            />
          ))}
        </div>
        {loading && (
          <p className="text-sm text-center text-muted-foreground">Switching...</p>
        )}
        <Button variant="ghost" onClick={() => onOpenChange(false)} className="w-full">
          Cancel
        </Button>
      </DialogContent>
    </Dialog>
  );
}
