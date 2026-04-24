import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate?: (name: string) => void;
};

export function CreateDomainDialog({ open, onOpenChange, onCreate }: Props) {
  const [name, setName] = useState("");
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!open) setName("");
  }, [open]);

  const canSubmit = name.trim().length > 0;

  const submit = () => {
    if (!canSubmit) return;
    onCreate?.(name.trim());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[560px] gap-0 border bg-white p-0 sm:rounded-2xl"
        style={{
          borderColor: "var(--hairline)",
          boxShadow: "0 24px 60px rgba(15,23,42,0.18)",
        }}
      >
        <div className="px-10 pt-12 pb-10">
          <DialogHeader className="space-y-3 text-center sm:text-center">
            <DialogTitle
              className="text-center text-[22px] font-semibold leading-snug"
              style={{ color: "var(--ink-900)" }}
            >
              Let's get you started with a new domain
            </DialogTitle>
            <DialogDescription
              className="mx-auto max-w-[440px] text-center text-[14px] leading-relaxed"
              style={{ color: "var(--ink-500)" }}
            >
              A domain is your team's corner of the data catalog — a curated space for the assets
              that matter to you.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-8">
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder="Name your domain"
              className="h-12 rounded-lg border bg-white px-4 text-[15px] shadow-none transition-shadow focus-visible:ring-0"
              style={{
                borderColor: focused ? "var(--brand-blue)" : "var(--hairline)",
                boxShadow: focused ? "0 0 0 3px rgba(67,134,250,0.15)" : undefined,
                color: "var(--ink-900)",
              }}
            />
          </div>

          <DialogFooter className="mt-10 sm:justify-center">
            <button
              type="button"
              onClick={submit}
              disabled={!canSubmit}
              className="h-11 rounded-lg px-8 text-[14px] font-medium text-white transition-[filter,opacity]"
              style={{
                background: "var(--brand-blue)",
                opacity: canSubmit ? 1 : 0.5,
                cursor: canSubmit ? "pointer" : "not-allowed",
              }}
              onMouseEnter={(e) => {
                if (canSubmit) e.currentTarget.style.filter = "brightness(0.95)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = "none";
              }}
            >
              Get started
            </button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
