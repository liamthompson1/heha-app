import type { TripData } from "@/types/trip";

export interface AgentStep {
  id: string;
  agentMessage: string;
  extractField: (input: string, data: TripData) => TripData;
  isComplete: (data: TripData) => boolean;
}

const AGENT_STEPS: AgentStep[] = [
  {
    id: "greeting",
    agentMessage:
      "Hey! I'm your HEHA travel assistant. Let's plan something amazing. What kind of trip are you thinking — holiday, business, honeymoon, family, adventure?",
    extractField: (input, data) => ({
      ...data,
      reason: input.trim(),
    }),
    isComplete: (data) => data.reason.length > 0,
  },
  {
    id: "name",
    agentMessage:
      "Love it! Give your trip a name — something fun you'll remember it by.",
    extractField: (input, data) => ({
      ...data,
      name: input.trim(),
    }),
    isComplete: (data) => data.name.length > 0,
  },
  {
    id: "travel-mode",
    agentMessage:
      "Great name! How are you getting there? Flying, driving, train, cruise, or a mix?",
    extractField: (input, data) => ({
      ...data,
      how_we_are_travelling: input.trim(),
    }),
    isComplete: (data) => data.how_we_are_travelling.length > 0,
  },
  {
    id: "dates",
    agentMessage:
      "When are you heading off? Give me a start date and end date (e.g. \"July 10 to July 20\").",
    extractField: (input, data) => {
      const parts = input.split(/\s*(?:to|–|-|—|till|until)\s*/i);
      return {
        ...data,
        dates: {
          ...data.dates,
          start_date: parts[0]?.trim() || input.trim(),
          end_date: parts[1]?.trim() || "",
        },
      };
    },
    isComplete: (data) => data.dates.start_date.length > 0,
  },
  {
    id: "travelers",
    agentMessage:
      "Who's coming along? Give me a name and I'll add them. (Type \"done\" when you've added everyone.)",
    extractField: (input, data) => {
      if (input.toLowerCase().trim() === "done") return data;
      const parts = input.trim().split(/\s+/);
      return {
        ...data,
        people_travelling: [
          ...data.people_travelling,
          {
            first_name: parts[0] || input.trim(),
            last_name: parts.slice(1).join(" ") || "",
            dob: "",
            gender: "",
            email: "",
            phone: "",
          },
        ],
      };
    },
    isComplete: (data) => data.people_travelling.length > 0,
  },
  {
    id: "locations-from",
    agentMessage: "Where are you travelling from?",
    extractField: (input, data) => ({
      ...data,
      journey_locations: {
        ...data.journey_locations,
        travelling_from: input.trim(),
      },
    }),
    isComplete: (data) => data.journey_locations.travelling_from.length > 0,
  },
  {
    id: "locations-to",
    agentMessage: "And where are you headed?",
    extractField: (input, data) => ({
      ...data,
      journey_locations: {
        ...data.journey_locations,
        travelling_to: input.trim(),
      },
    }),
    isComplete: (data) => data.journey_locations.travelling_to.length > 0,
  },
  {
    id: "anything-else",
    agentMessage:
      "Almost done! Anything else we should know — special requests, dietary needs, celebrations?",
    extractField: (input, data) => ({
      ...data,
      anything_else_we_should_know: input.trim(),
    }),
    isComplete: (data) => data.anything_else_we_should_know.length > 0,
  },
  {
    id: "complete",
    agentMessage:
      "Perfect — I've got everything I need! Let me put your trip together. Hit \"Plan My Trip\" when you're ready.",
    extractField: (_input, data) => data,
    isComplete: () => true,
  },
];

export function getAgentStep(data: TripData): AgentStep {
  for (const step of AGENT_STEPS) {
    if (!step.isComplete(data)) {
      return step;
    }
  }
  return AGENT_STEPS[AGENT_STEPS.length - 1];
}

export function getAgentFollowUp(stepId: string, input: string): string {
  const lower = input.toLowerCase();
  switch (stepId) {
    case "greeting":
      if (lower.includes("holiday") || lower.includes("vacation"))
        return "A holiday — nice! Nothing beats some time away.";
      if (lower.includes("business"))
        return "Business trip, got it. Let's make it smooth.";
      if (lower.includes("honeymoon"))
        return "Congratulations! Let's make it unforgettable.";
      return "Sounds great!";
    case "name":
      return `"${input.trim()}" — love it!`;
    case "travelers":
      if (lower === "done") return "Great, everyone's on the list!";
      return `Added! Anyone else? Type "done" if that's everyone.`;
    default:
      return "Got it!";
  }
}

export function isAgentConversationComplete(data: TripData): boolean {
  return (
    data.reason.length > 0 &&
    data.name.length > 0 &&
    data.how_we_are_travelling.length > 0 &&
    data.dates.start_date.length > 0 &&
    data.journey_locations.travelling_from.length > 0 &&
    data.journey_locations.travelling_to.length > 0
  );
}
