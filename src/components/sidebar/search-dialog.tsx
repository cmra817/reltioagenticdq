import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { STATUS_LABEL, statusForScore, useDomainState } from "../domain-context";
import { useChatThreads, type ChatThread } from "../chat/chat-context";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const PAGES = [
  { label: "Data health", to: "/" },
  { label: "Scheduled", to: "/scheduled" },
  { label: "Rules", to: "/rules" },
  { label: "Explore", to: "/explore" },
  { label: "DQ checks", to: "/dq-checks" },
] as const;

/** Search across pages, domains, and chats. Opens with Cmd/Ctrl+K from anywhere. */
export function SearchDialog({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const { domains, selectDomain, healthFor } = useDomainState();
  const { threads } = useChatThreads();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  function close() {
    onOpenChange(false);
  }

  function openThread(t: ChatThread) {
    close();
    if (t.kind === "investigation") {
      void navigate({ to: "/investigate/consistency", search: { q: t.title, thread: t.id } });
    } else if (t.kind === "rule") {
      void navigate({ to: "/rule/$threadId", params: { threadId: t.id } });
    } else {
      void navigate({ to: "/chat/$chatId", params: { chatId: t.id }, search: {} });
    }
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search pages, domains, and chats…" />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>

        <CommandGroup heading="Pages">
          {PAGES.map((p) => (
            <CommandItem
              key={p.to}
              value={`page ${p.label}`}
              onSelect={() => {
                close();
                void navigate({ to: p.to });
              }}
            >
              {p.label}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="Domains">
          {domains.map((d) => {
            const score = healthFor(d);
            return (
              <CommandItem
                key={d}
                value={`domain ${d}`}
                onSelect={() => {
                  selectDomain(d);
                  close();
                  void navigate({ to: "/domain" });
                }}
              >
                <span>{d}</span>
                {score !== null && (
                  <span className="ml-auto text-[12px] tabular-nums text-muted-foreground">
                    {score}
                    <span className="sr-only">, {STATUS_LABEL[statusForScore(score)]}</span>
                  </span>
                )}
              </CommandItem>
            );
          })}
        </CommandGroup>

        {threads.length > 0 && (
          <CommandGroup heading="Chats">
            {threads.slice(0, 30).map((t) => (
              <CommandItem
                key={t.id}
                value={`chat ${t.title} ${t.id}`}
                onSelect={() => openThread(t)}
              >
                <span className="truncate">{t.title}</span>
                {t.domain && (
                  <span className="ml-auto shrink-0 pl-3 text-[12px] text-muted-foreground">
                    {t.domain}
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
