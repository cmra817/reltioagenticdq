import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { WarehouseRow } from "@/components/warehouse-card";
import { ChatComposer } from "@/components/chat-composer";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <AppShell activeNav="new-chat">
      <div className="flex flex-1 flex-col items-stretch overflow-y-auto px-12 pb-8 pt-10">
        <div className="mx-auto w-full max-w-[820px]">
          <h1
            className="text-[44px] font-semibold leading-[1.12] tracking-[-0.01em]"
            style={{ color: "var(--ink-900)" }}
          >
            Hey there,{" "}
            <span style={{ color: "var(--brand-blue)" }}>Molly</span>! So glad to have you here
          </h1>

          <p className="mt-6 text-[15px] leading-[1.65]" style={{ color: "var(--ink-700)" }}>
            <span className="font-semibold" style={{ color: "var(--ink-900)" }}>
              AgentFlow Quality
            </span>{" "}
            is your AI-powered data quality companion. I'll help you profile tables, catch
            anomalies, and run DQ checks, all through conversation. Just talk to me.
          </p>

          <p className="mt-4 text-[15px] leading-[1.65]" style={{ color: "var(--ink-700)" }}>
            Let's get you set up! First things first -
          </p>

          <h2 className="mt-6 text-[18px] font-semibold" style={{ color: "var(--ink-900)" }}>
            which data warehouse do you want to connect to?
          </h2>

          <div className="mt-5">
            <WarehouseRow />
          </div>

          <p className="mt-5 text-[14px]" style={{ color: "var(--ink-700)" }}>
            <span className="font-semibold" style={{ color: "var(--ink-900)" }}>
              Not sure?
            </span>{" "}
            Tell me what data assets you're looking for and I'll let you know what data warehouse it
            belongs to.
          </p>
        </div>
      </div>

      <div className="px-12 pb-8">
        <div className="mx-auto w-full max-w-[820px]">
          <ChatComposer />
        </div>
      </div>
    </AppShell>
  );
}
