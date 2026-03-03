export interface TripContent {
  generated_at: string;
  destination: string;
  things_to_do: ThingToDo[];
  local_knowledge: LocalTip[];
  food_and_drink: FoodSpot[];
  packing_tips: string[];
  best_areas: BestArea[];
}

export interface ThingToDo {
  name: string;
  description: string;
  category: string;
  estimated_cost: string;
  duration: string;
  insider_tip?: string;
}

export interface LocalTip {
  title: string;
  content: string;
  category: string;
}

export interface FoodSpot {
  name: string;
  type: string;
  description: string;
  price_range: string;
}

export interface BestArea {
  name: string;
  vibe: string;
  good_for: string;
}

export interface WeatherDay {
  date: string;
  temp_max: number;
  temp_min: number;
  weather_code: number;
  precipitation_probability: number;
  wind_speed_max: number;
}
