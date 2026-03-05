export interface FlightCardData {
  airline: string;
  flight_number: string;
  from: string;
  from_city: string;
  to: string;
  to_city: string;
  departure_date: string;
  departure_time: string;
  arrival_date: string;
  arrival_time: string;
  duration: string;
  flight_reference: string;
  direction: "outbound" | "return";
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  image?: {
    base64: string;
    mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
  };
  _preview?: string;
  flightCards?: FlightCardData[];
}

export interface SavedMemory {
  id: string;
  category: string;
  content: string;
  person_name: string | null;
}

export interface AgentChatRequest {
  messages: ChatMessage[];
  tripData: import("./trip").TripData;
  sessionId: string;
  userId: string | null;
}

export interface AgentChatResponse {
  message: string;
  updatedTripData: import("./trip").TripData;
  memories: SavedMemory[];
  formComplete: boolean;
  flightCards?: FlightCardData[];
}
