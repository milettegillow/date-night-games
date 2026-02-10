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
  },
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
      const spiceInstructions = {
        mild: `MILD level. Completely non-sexual. Genuinely eventful, adventurous, or surprising things that a nice, stand-up person might have done. Still interesting and story-worthy, not boring.

Good examples: "stalked someone's social media back to an embarrassing depth and accidentally liked a very old photo", "locked myself out of my own house in a truly stupid way", "hitchhiked", gone skinny dipping", "crashed a wedding", "gone swimming in the sea at night", "booked a one-way flight", "snuck in somewhere I wasn't allowed to be", "gotten a tattoo on a whim", "slept in an airport overnight", "eaten something at a market in another country with absolutely no idea what it was", "entered a competition or talent show with zero relevant skill", "been on TV or in a newspaper"

Bad examples (too boring, no story): "forgotten someone's name", "cried on public transport", "waved at someone who wasn't waving at me", "pretended to understand a conversation"`,

        medium: `MEDIUM level. A bit sexual, a bit morally grey, but nothing dark. House party confession stories you'd tell close friends on a night out.

Good examples: "snooped through someone's phone", "said 'I love you' and not meant it", "been skinny dipping", "had a one-night stand", "lied about my body count", "ghosted someone", "kissed someone I'd met that same day", "sent a nude", "pretended to be single when I wasn't", "had a crush on a friend's sibling", "kissed two different people in the same night", "been escorted out of a venue by security", "faked an orgasm", "drunk-dialled an ex", "sent a nude to the wrong person"`,

        spicy: `SPICY level. Genuinely shocking. The bar is: would admitting this make the room go quiet before anyone reacts? If a statement could comfortably fit in Medium, it is NOT spicy enough.

Every batch MUST contain a roughly even mix of two flavours:
(1) SEXUALLY EXTREME: acts that go well beyond "a bit naughty"
(2) MORALLY DARK: betrayal, cruelty, deception, things most people would judge you for

Sexually extreme examples: "had a threesome", "joined the mile high club", "hooked up with someone whose name I never bothered to learn", "slept with someone to get something I wanted", "slept with a friend's ex knowing it would hurt them", "been the other woman/man", "had sex somewhere genuinely risky and almost got caught"

Morally dark examples: "cheated on a partner", "lied to the police", "deliberately made someone cry to win an argument", "kept a secret that would destroy a friendship if it came out", "sabotaged someone's opportunity because I wanted it", "stolen something worth more than £50", "been the reason a couple broke up", "taken revenge on someone in a way I've never told anyone about", "pretended to be someone's friend while actively disliking them for months", "let someone else take the blame for something I did", "read someone's diary or private messages and used what I found against them"

Bad examples (these belong in Medium, not Spicy): "had a one-night stand", "kissed a stranger", "sent a nude to the wrong person", "gone skinny dipping"`,
      };

      return `Generate ${count} "Never have I ever" statement completions at the "${options.spiceLevel || "mild"}" spice level.

${spiceInstructions[options.spiceLevel || "mild"]}

RULES (follow these strictly):
- Every statement must be a single, specific thing. NEVER combine two things with "or".
- Never use emdashes. Use parentheses if clarification is needed.
- Statements must be specific enough to trigger a story. If someone has done it, they should immediately remember when and where. Vague, mundane things that everyone has done are bad.
- No editorialising or commentary (no "...and honestly, no regrets" style additions). Just state the thing plainly.
- These are NOT about the players' relationship with each other. NEVER reference "your date", "your partner", "the person you're playing with", etc. These are about things you've done in your life.
- Use British English spelling throughout.
- Each statement must be distinct from the others in the batch.

Return a JSON array of ${count} strings. Each string is ONLY the completion after "Never have I ever" (do NOT include "Never have I ever" in the output, the app adds it).
Example: ["hitchhiked", "crashed a wedding", "gone swimming in the sea at night"]${excludeClause}`;
    }

    case "would-you-rather": {
      const wyrCategory = options.category || "shuffle";

      const wyrCategoryInstructions: Record<string, string> = {
        silly: `SILLY category. Absurd, hypothetical, funny. The options should be ridiculous enough to be funny but specific enough to be genuinely debatable. Think "pub argument that gets way too heated for what it is."

Good examples:
- "have fingers as long as your legs" / "have legs as long as your fingers"
- "always smell faintly of onions" / "always have slightly damp socks"
- "your only mode of transport is a horse" / "your only mode of transport is a canoe"
- "every time you sneeze you audibly moan" / "every time you laugh you do a full pig snort"
- "have to wear a wedding dress to every casual event" / "pyjamas to every formal event"
- "your life has a permanent backing track that everyone can hear" / "a live studio audience that reacts to everything you do"
- "be able to fly but only at walking speed" / "run at 200mph but only on all fours"
- "give up cheese forever" / "give up every hot drink forever"
- "never be able to use a door (windows, climbing, etc. only)" / "never be able to sit down"

Bad examples: cliché internet questions everyone has heard (horse-sized duck, etc.), anything referencing the players' relationship`,

        deep: `DEEP category. Genuinely thought-provoking dilemmas about life, identity, values, and mortality. These should stick with you after the game. Both options should represent a real philosophical trade-off.

Good examples:
- "know the date of your death" / "know the cause"
- "be wildly successful at a job you hate" / "mediocre at something you love"
- "everyone you meet instantly trusts you" / "everyone you meet instantly respects you"
- "be the funniest person in every room" / "the smartest"
- "lose all your money" / "lose all your photos and memories"
- "live a comfortable, unremarkable life" / "a turbulent, extraordinary one"
- "peak at 25" / "peak at 55"
- "be remembered for something you didn't do" / "forgotten for something amazing you did"
- "have a rewind button for your life (but you can only use it once)" / "a pause button you can use whenever you want"
- "live twice as long at half the intensity" / "half as long at double the intensity"`,

        cursed: `CURSED category. Both options are horrible. The reaction should be an immediate "oh NO" followed by agonised deliberation.

IMPORTANT: Cursed questions are NOT silly body-modification hypotheticals like "would you rather sweat maple syrup" or "have fingers for legs". Those are Silly. Cursed means both options make you physically cringe, squirm, or feel deeply uncomfortable. Think: gross sensory experiences with real things (licking a pub floor, sharing a toothbrush), excruciating social embarrassment (your parents seeing your search history, your nudes being leaked), or horrible real-world choices (your partner reads your group chat, everyone you've slept with is in one room). The test: if someone laughs immediately, it's Silly. If someone grimaces and says "oh god, neither", it's Cursed.

Good examples:
- "walk in on your parents" / "have your parents walk in on you"
- "lick the floor of a pub bathroom" / "drink a shot of a stranger's bathwater"
- "sit through a detailed PowerPoint of your parents' sex life" / "have them sit through one of yours"
- "every chair you sit on is slightly warm (as if someone just got up)" / "every drink you're handed has a single hair floating in it"
- "share a toothbrush with a stranger for a year" / "wear the same underwear for a month"
- "bite into every apple and find half a worm" / "feel something brush against your foot in every body of water you enter"
- "have a counter above your head showing how many people in the room have seen you naked" / "have your Spotify listening history displayed above your head at all times"
- "eat a bowl of toenail clippings" / "drink a glass of someone else's sweat"
- "your partner reads your entire group chat history" / "your boss reads your entire search history"

Bad examples (these are Silly, NOT Cursed): "sweat maple syrup", "have fingers for legs", "sneeze confetti", "your tears are hot sauce"`,

        shuffle: `SHUFFLE mode. Return a mix of questions with roughly equal distribution across three categories: silly, deep, and cursed. Tag each item with its category.

Refer to these descriptions:
- SILLY: Absurd, hypothetical, funny pub arguments
- DEEP: Thought-provoking dilemmas about life, identity, values, mortality
- CURSED: Both options are horrible, gross, or deeply uncomfortable`,
      };

      return `Generate ${count} "Would you rather" dilemmas for the "${wyrCategory}" category.

${wyrCategoryInstructions[wyrCategory]}

RULES (follow these strictly):
- Never use emdashes. Use parentheses if clarification is needed.
- Both options must be genuinely hard to choose between. If one option is obviously better, the question fails.
- Keep options concise. Each option should ideally be under 15 words.
- NEVER reference the players' relationship with each other, dating, romance, or "your partner".
- British English spelling throughout.
- The questions should trigger genuine debate and conversation.
- Each dilemma must be distinct from the others in the batch.

Return a JSON array of ${count} objects. Each object has "optionA" (string), "optionB" (string), and "category" ("silly", "deep", or "cursed").
Do NOT include the "Would you rather" prefix in the options (the app adds it).
Example: [{"optionA": "give up cheese forever", "optionB": "give up every hot drink forever", "category": "silly"}]${excludeClause}`;
    }

    default:
      return `Generate ${count} fun conversation starters for a couple on a date night. Return a JSON array of strings.${excludeClause}`;
  }
}
