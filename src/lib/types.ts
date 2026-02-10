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

export type WyrCategory = 'silly' | 'deep' | 'cursed' | 'shuffle';

export const WYR_CATEGORIES: { value: WyrCategory; label: string }[] = [
  { value: 'silly', label: '🤪 Silly' },
  { value: 'deep', label: '🧠 Deep' },
  { value: 'cursed', label: '💀 Cursed' },
  { value: 'shuffle', label: '🔀 Shuffle' },
];

export interface WouldYouRatherDilemma {
  optionA: string;
  optionB: string;
  category: 'silly' | 'deep' | 'cursed';
}

export interface PlayerNames {
  player1: string;
  player2: string;
}
