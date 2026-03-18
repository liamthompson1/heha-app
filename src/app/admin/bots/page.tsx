"use client";

import { useState, useEffect } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { fetchApiKeys } from "@/lib/api/destinations";
import type { ApiKey } from "@/types/destination";

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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 40,
        }}
      >
        <div>
          <p className="hx-eyebrow" style={{ marginBottom: 8 }}>
            Management
          </p>
          <h1 className="hx-heading" style={{ fontSize: 48 }}>
            Bots & API Keys
          </h1>
        </div>
        <button
          className="hx-btn-primary hx-btn-green"
          onClick={() => {
            setShowWizard(true);
            setCreatedKey(null);
            setNewKeyName("");
          }}
        >
          + Create Key
        </button>
      </div>

      {/* Key Creation Wizard */}
      {showWizard && (
        <div className="hx-glass" style={{ padding: 32, marginBottom: 32 }}>
          {!createdKey ? (
            <div>
              <h2
                className="hx-text-primary"
                style={{ fontSize: 20, fontWeight: 600, marginBottom: 20, letterSpacing: "-0.02em" }}
              >
                Create a new API key
              </h2>
              <div style={{ marginBottom: 16 }}>
                <label
                  className="hx-text-tertiary"
                  style={{ display: "block", fontSize: 13, marginBottom: 8 }}
                >
                  Bot name
                </label>
                <input
                  type="text"
                  placeholder="e.g. DestinationBot"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="hx-input"
                  style={{ maxWidth: 360 }}
                />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={autoPublish}
                    onChange={(e) => setAutoPublish(e.target.checked)}
                    style={{ accentColor: "#30d158" }}
                  />
                  <span className="hx-text-secondary" style={{ fontSize: 14 }}>
                    Auto-publish content (skip review queue)
                  </span>
                </label>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <button
                  className="hx-btn-primary hx-btn-green"
                  onClick={handleCreateKey}
                  disabled={!newKeyName.trim()}
                >
                  Generate Key
                </button>
                <button
                  className="hx-btn-secondary"
                  onClick={() => setShowWizard(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h2
                className="hx-text-primary"
                style={{ fontSize: 20, fontWeight: 600, marginBottom: 8, letterSpacing: "-0.02em" }}
              >
                Key created for {newKeyName}
              </h2>
              <p className="hx-text-tertiary" style={{ fontSize: 14, marginBottom: 20 }}>
                Copy this key now — it won&apos;t be shown again.
              </p>

              {/* Key display */}
              <div
                className="hx-glass-subtle"
                style={{
                  padding: 16,
                  marginBottom: 24,
                  borderLeft: "3px solid #30d158",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <code
                  style={{
                    flex: 1,
                    fontFamily: "SF Mono, SFMono-Regular, ui-monospace, Menlo, monospace",
                    fontSize: 13,
                    color: "#30d158",
                    wordBreak: "break-all",
                  }}
                >
                  {createdKey}
                </code>
                <button
                  className="hx-btn-secondary hx-btn-sm"
                  onClick={() => copyToClipboard(createdKey, "key")}
                >
                  {copied === "key" ? "Copied!" : "Copy"}
                </button>
              </div>

              {/* Agent Instructions */}
              <div className="hx-glass" style={{ padding: 0, borderRadius: 16, overflow: "hidden" }}>
                <div
                  style={{
                    padding: "12px 20px",
                    borderBottom: "0.5px solid rgba(255,255,255,0.06)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#bf5af2",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    ✦ Agent Instructions
                  </span>
                  <button
                    className="hx-btn-secondary hx-btn-sm"
                    onClick={() =>
                      copyToClipboard(
                        getAgentInstructions(createdKey),
                        "instructions"
                      )
                    }
                  >
                    {copied === "instructions" ? "Copied!" : "Copy All"}
                  </button>
                </div>
                <pre
                  className="hx-code-block"
                  style={{
                    margin: 0,
                    borderRadius: 0,
                    border: "none",
                    maxHeight: 500,
                    overflow: "auto",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {getAgentInstructions(createdKey)}
                </pre>
              </div>

              <div style={{ marginTop: 24 }}>
                <button
                  className="hx-btn-secondary"
                  onClick={() => setShowWizard(false)}
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Existing Keys Table */}
      <div className="hx-glass hx-table-wrap" style={{ padding: 0 }}>
        <table className="hx-table">
          <thead>
            <tr>
              <th>Bot Name</th>
              <th>Key</th>
              <th>Publishing</th>
              <th>Last Used</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {keys.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="hx-text-tertiary"
                  style={{ textAlign: "center", padding: "32px 16px" }}
                >
                  No API keys yet. Create one to get started.
                </td>
              </tr>
            ) : (
              keys.map((k) => (
                <tr key={k.id}>
                  <td>
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 16 }}>🤖</span>
                      <span className="hx-text-primary" style={{ fontWeight: 500, fontSize: 13 }}>
                        {k.name}
                      </span>
                    </span>
                  </td>
                  <td>
                    <code
                      style={{
                        fontFamily: "SF Mono, SFMono-Regular, ui-monospace, Menlo, monospace",
                        fontSize: 12,
                        color: "rgba(255,255,255,0.32)",
                      }}
                    >
                      {k.prefix}
                    </code>
                  </td>
                  <td>
                    <span
                      className={`hx-badge ${k.auto_publish ? "hx-badge-green" : "hx-badge-orange"}`}
                    >
                      {k.auto_publish ? "Auto-publish" : "Review queue"}
                    </span>
                  </td>
                  <td className="hx-text-tertiary" style={{ fontSize: 12 }}>
                    {k.last_used_at
                      ? new Date(k.last_used_at).toLocaleDateString("en-GB")
                      : "Never"}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button className="hx-btn-secondary hx-btn-sm">
                      Revoke
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
