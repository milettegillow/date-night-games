import { GameId, SpiceLevel } from "./types";

const SYSTEM_PROMPT = `You are a playful, romantic game host for a Valentine's Date Night. You create fun, engaging content for couples. Your tone is warm, flirty, and creative. Never be offensive or crude — even "spicy" content should be bold and intimate but tasteful. Always return ONLY valid JSON with no markdown fencing, no explanation, no extra text.`;

export function getSystemPrompt(): string {
  return SYSTEM_PROMPT;
}

export function buildUserPrompt(
  game: GameId,
  options: {
    category?: string;
    spiceLevel?: SpiceLevel;
    count?: number;
    exclude?: string[];
  }
): string {
  const count = options.count || 10;
  const excludeClause =
    options.exclude && options.exclude.length > 0
      ? `\n\nDo NOT repeat or closely rephrase any of these previously used items:\n${options.exclude.map((e) => `- "${e}"`).join("\n")}`
      : "";

  switch (game) {
    case "wheel":
      return `Generate ${count} unique, interesting conversation topics for the category "${options.category}". These are meant to spark deep, fun conversation between a couple on a date night.

Each topic should be a specific question or prompt — not just a broad theme. Make them thought-provoking, personal, and engaging.

Return a JSON array of ${count} strings.
Example: ["If you could relive one day from our relationship, which would it be?", "What's a dream you've never told anyone about?"]${excludeClause}`;

    case "mr-and-mrs":
      return `Generate ${count} fun "Who is more likely to..." or "Who is the biggest..." questions for a couples game. These should be playful questions where both partners independently pick which person the question applies to more.

Mix question types:
- "Who is more likely to..." (future/hypothetical)
- "Who is the biggest..." (personality traits)
- "Who would..." (hypothetical scenarios)

Keep them fun, revealing, and conversation-starting. Avoid anything mean-spirited.

Return a JSON array of ${count} strings. Each string should be just the question part (e.g., "Who is more likely to cry during a movie?").${excludeClause}`;

    case "never-have-i-ever": {
      const spiceTone = {
        mild: "Keep the statements wholesome, sweet, and getting-to-know-you. Think cute, everyday experiences and innocent adventures.",
        medium:
          "Make the statements flirty, cheeky, and slightly provocative. Think embarrassing moments, bold choices, and playful confessions.",
        spicy:
          "Make the statements intimate, bold, and daring — but still tasteful. Think secret desires, wild experiences, and boundary-pushing adventures.",
      };
      return `Generate ${count} "Never have I ever" statements for a couples date night game at the "${options.spiceLevel || "mild"}" spice level.

${spiceTone[options.spiceLevel || "mild"]}

Each statement should be something that could realistically apply to either, both, or neither partner. Make them varied and creative — avoid generic/obvious ones.

Return a JSON array of ${count} strings. Each string starts with "Never have I ever" followed by the statement.
Example: ["Never have I ever pretended to like a gift", "Never have I ever sent a text to the wrong person"]${excludeClause}`;
    }

    case "would-you-rather":
      return `Generate ${count} fun "Would you rather" dilemmas for a couples date night. Each dilemma should have two options that are both appealing (or both unappealing) to make the choice genuinely difficult.

Mix of types:
- Silly/funny dilemmas
- Romantic/relationship dilemmas
- Thought-provoking life dilemmas
- Adventurous/fantasy dilemmas

Return a JSON array of ${count} objects, each with "optionA" and "optionB" string fields.
Example: [{"optionA": "Always know what your partner is thinking", "optionB": "Always know what your partner is feeling"}]${excludeClause}`;

    default:
      return `Generate ${count} fun conversation starters for a couple on a date night. Return a JSON array of strings.${excludeClause}`;
  }
}
