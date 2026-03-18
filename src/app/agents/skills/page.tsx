import PageShell from "@/components/PageShell";
import GlassCard from "@/components/GlassCard";
import MarkdownProse from "@/components/MarkdownProse";

export default function AgentSkillsPage() {
  return (
    <PageShell backHref="/">
      <GlassCard size="lg" shimmer>
        <MarkdownProse>
          <h1 className="gradient-text">Agent Skills</h1>
          <p>
            HEHA agents are equipped with a powerful set of capabilities
            designed to make travel planning seamless and intelligent.
          </p>

          <h2>Trip Planning</h2>
          <p>
            Agents can build complete itineraries from scratch, optimizing for
            preferences, budget constraints, and time zones. They understand
            seasonal patterns and can suggest the best times to visit any
            destination.
          </p>
          <ul>
            <li>Multi-city route optimization</li>
            <li>Budget-aware accommodation matching</li>
            <li>Activity scheduling with travel-time buffers</li>
            <li>Weather-aware itinerary adjustments</li>
          </ul>

          <h2>Local Discovery</h2>
          <p>
            Beyond the tourist trail — agents surface hidden gems, local
            favorites, and authentic experiences tailored to traveler
            interests.
          </p>
          <ul>
            <li>Neighborhood-level recommendations</li>
            <li>Cultural etiquette and local customs</li>
            <li>Real-time event and festival tracking</li>
          </ul>

          <h2>Communication</h2>
          <p>
            Agents handle the coordination layer — from group consensus to
            booking confirmations — so travelers can focus on the experience.
          </p>
          <pre>
            <code>{`// Example agent API call
const trip = await agent.plan({
  destination: "Tokyo",
  duration: "7 days",
  interests: ["food", "temples", "nightlife"],
  budget: { currency: "USD", max: 3000 }
});`}</code>
          </pre>

          <h3>Supported Protocols</h3>
          <ul>
            <li>
              <code>MCP</code> — Model Context Protocol for tool integration
            </li>
            <li>
              <code>A2A</code> — Agent-to-agent coordination
            </li>
            <li>
              <code>REST</code> — Standard HTTP API access
            </li>
          </ul>
        </MarkdownProse>
      </GlassCard>
    </PageShell>
  );
}
