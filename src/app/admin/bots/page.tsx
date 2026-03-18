"use client";

import { useState, useEffect } from "react";
import AdminShell from "@/components/admin/AdminShell";
import GlassCard from "@/components/GlassCard";
import GlassButton from "@/components/GlassButton";
import GlassInput from "@/components/GlassInput";
import { fetchApiKeys } from "@/lib/api/destinations";
import type { ApiKey } from "@/types/destination";

function Badge({ variant, children }: { variant: "green" | "blue" | "orange" | "red"; children: React.ReactNode }) {
  const colors = {
    green: { bg: "rgba(46, 205, 193, 0.12)", border: "rgba(46, 205, 193, 0.25)", text: "var(--teal)" },
    blue: { bg: "rgba(90, 200, 250, 0.12)", border: "rgba(90, 200, 250, 0.25)", text: "var(--blue)" },
    orange: { bg: "rgba(240, 180, 41, 0.12)", border: "rgba(240, 180, 41, 0.25)", text: "var(--gold)" },
    red: { bg: "rgba(255, 99, 89, 0.12)", border: "rgba(255, 99, 89, 0.25)", text: "var(--coral)" },
  };
  const c = colors[variant];
  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-0.5 text-xs font-medium"
      style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text }}
    >
      {children}
    </span>
  );
}

function getAgentInstructions(key: string): string {
  return `# Heha.ai — Bot Content Instructions

You are connected to **Heha.ai** (https://heha.ai), a bot-managed travel
destination guide. Your role is to create and maintain comprehensive
destination master pages.

## Authentication
Include this header in every request:
\`\`\`
Authorization: Bearer ${key}
\`\`\`

## API Reference

\`GET  https://heha.ai/api/pages\` — list all pages
\`POST https://heha.ai/api/pages\` — generate \`{ slug, prompt }\`
\`GET  https://heha.ai/api/pages/:slug\` — get a page
\`PUT  https://heha.ai/api/pages/:slug\` — update \`{ content, categories? }\`
\`DELETE https://heha.ai/api/pages/:slug\` — delete a page

### Generate a new page
\`POST https://heha.ai/api/pages\`
\`\`\`json
{
  "slug": "barcelona",
  "prompt": "Create a destination travel guide for Barcelona, Spain"
}
\`\`\`

### Update a page
\`PUT https://heha.ai/api/pages/:slug\`
\`\`\`json
{
  "content": "## Overview\\n\\nUpdated content...",
  "categories": ["destination"]
}
\`\`\`

## Content Guidelines
- Write comprehensive, authoritative content (1000–3000 words per section)
- Use markdown headings (##), lists, and tables for structure
- Include specific names, prices, and addresses where possible
- Check existing content before updating to avoid regressions
- Structure with sections: Overview, When to Visit, Neighbourhoods,
  Where to Stay, Food & Drink, Activities, Getting Around, Budget, Safety
`;
}

export default function BotsPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [showWizard, setShowWizard] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [autoPublish, setAutoPublish] = useState(true);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState<"key" | "instructions" | null>(null);

  useEffect(() => {
    fetchApiKeys().then(setKeys);
  }, []);

  function handleCreateKey() {
    const fakeKey = `sk_heha_${Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join("")}`;
    setCreatedKey(fakeKey);
  }

  function copyToClipboard(text: string, type: "key" | "instructions") {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <AdminShell>
      <div className="mb-10 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-tertiary)" }}>
            Management
          </p>
          <h1 className="gradient-text-subtle mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
            Bots & API Keys
          </h1>
        </div>
        <GlassButton
          variant="teal"
          onClick={() => {
            setShowWizard(true);
            setCreatedKey(null);
            setNewKeyName("");
          }}
        >
          + Create Key
        </GlassButton>
      </div>

      {/* Key Creation Wizard */}
      {showWizard && (
        <GlassCard elevated className="mb-8">
          {!createdKey ? (
            <div>
              <h2 className="mb-5 text-xl font-semibold tracking-tight" style={{ color: "var(--foreground)" }}>
                Create a new API key
              </h2>
              <div className="mb-4 max-w-sm">
                <GlassInput
                  label="Bot name"
                  placeholder="e.g. DestinationBot"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                />
              </div>
              <div className="mb-6">
                <label className="flex cursor-pointer items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={autoPublish}
                    onChange={(e) => setAutoPublish(e.target.checked)}
                    className="accent-[var(--teal)]"
                  />
                  <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    Auto-publish content (skip review queue)
                  </span>
                </label>
              </div>
              <div className="flex gap-3">
                <GlassButton variant="teal" onClick={handleCreateKey} disabled={!newKeyName.trim()}>
                  Generate Key
                </GlassButton>
                <GlassButton onClick={() => setShowWizard(false)}>
                  Cancel
                </GlassButton>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="mb-2 text-xl font-semibold tracking-tight" style={{ color: "var(--foreground)" }}>
                Key created for {newKeyName}
              </h2>
              <p className="mb-5 text-sm" style={{ color: "var(--text-tertiary)" }}>
                Copy this key now — it won&apos;t be shown again.
              </p>

              {/* Key display */}
              <div
                className="glass-panel mb-6 flex items-center gap-3 px-4 py-3"
                style={{ borderLeft: "3px solid var(--teal)" }}
              >
                <code className="flex-1 break-all font-mono text-sm" style={{ color: "var(--teal)" }}>
                  {createdKey}
                </code>
                <GlassButton size="sm" onClick={() => copyToClipboard(createdKey, "key")}>
                  {copied === "key" ? "Copied!" : "Copy"}
                </GlassButton>
              </div>

              {/* Agent Instructions */}
              <div className="glass-panel overflow-hidden p-0" style={{ borderRadius: "var(--glass-radius-xs)" }}>
                <div className="flex items-center justify-between border-b border-white/6 px-5 py-3">
                  <span className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: "var(--purple)" }}>
                    ✦ Agent Instructions
                  </span>
                  <GlassButton
                    size="sm"
                    onClick={() =>
                      copyToClipboard(getAgentInstructions(createdKey), "instructions")
                    }
                  >
                    {copied === "instructions" ? "Copied!" : "Copy All"}
                  </GlassButton>
                </div>
                <pre className="max-h-[500px] overflow-auto whitespace-pre-wrap p-5 font-mono text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {getAgentInstructions(createdKey)}
                </pre>
              </div>

              <div className="mt-6">
                <GlassButton onClick={() => setShowWizard(false)}>
                  Done
                </GlassButton>
              </div>
            </div>
          )}
        </GlassCard>
      )}

      {/* Existing Keys Table */}
      <GlassCard flush>
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/6">
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Bot Name</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Key</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Publishing</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Last Used</th>
              <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {keys.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
                  No API keys yet. Create one to get started.
                </td>
              </tr>
            ) : (
              keys.map((k) => (
                <tr key={k.id} className="border-b border-white/4 transition-colors hover:bg-white/[0.02]">
                  <td className="px-5 py-3.5">
                    <span className="flex items-center gap-2">
                      <span className="text-base">🤖</span>
                      <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{k.name}</span>
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <code className="font-mono text-xs" style={{ color: "var(--text-tertiary)" }}>
                      {k.prefix}
                    </code>
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge variant={k.auto_publish ? "green" : "orange"}>
                      {k.auto_publish ? "Auto-publish" : "Review queue"}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5 text-xs" style={{ color: "var(--text-tertiary)" }}>
                    {k.last_used_at
                      ? new Date(k.last_used_at).toLocaleDateString("en-GB")
                      : "Never"}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <GlassButton size="sm">Revoke</GlassButton>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </GlassCard>
    </AdminShell>
  );
}
