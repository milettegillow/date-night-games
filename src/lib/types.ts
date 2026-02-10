export type GameId = 'wheel' | 'mr-and-mrs' | 'never-have-i-ever' | 'would-you-rather';

export type SpiceLevel = 'mild' | 'medium' | 'spicy';

export type WheelCategory =
  | 'Dreams & Future'
  | 'Funny Stories'
  | 'Deep Questions'
  | 'Travel'
  | 'Guilty Pleasures'
  | 'Hypotheticals'
  | 'Memory Lane'
  | 'Spicy 🌶️';

export const WHEEL_CATEGORIES: WheelCategory[] = [
  'Dreams & Future',
  'Funny Stories',
  'Deep Questions',
  'Travel',
  'Guilty Pleasures',
  'Hypotheticals',
  'Memory Lane',
  'Spicy 🌶️',
];

export interface GenerateRequest {
  game: GameId;
  category?: string;
  spiceLevel?: SpiceLevel;
  count?: number;
  exclude?: string[];
}

export interface WouldYouRatherDilemma {
  optionA: string;
  optionB: string;
}

export interface PlayerNames {
  player1: string;
  player2: string;
}
