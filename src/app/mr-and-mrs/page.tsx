"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useGame } from "@/context/GameContext";
import NameEntry from "@/components/NameEntry";
import PassPhone from "@/components/PassPhone";
import RevealResult from "@/components/RevealResult";
import ScoreTracker from "@/components/ScoreTracker";
import EndScreen from "@/components/EndScreen";
import LoadingState from "@/components/LoadingState";
import { MrAndMrsQuestion } from "@/lib/types";
import { vibrate } from "@/lib/haptics";
import posthog from "posthog-js";

type Phase =
  | "names"
  | "loading"
  | "pass-to-p1"
  | "p1-answer"
  | "pass-to-p2"
  | "p2-answer"
  | "reveal"
  | "end";

const TOTAL_ROUNDS = 10;

const TIERS = [
  { minScore: 9, message: "Soulmates!", emoji: "💕" },
  { minScore: 7, message: "You know each other well!", emoji: "😍" },
  { minScore: 5, message: "Getting there!", emoji: "💛" },
  { minScore: 0, message: "Lots to discover!", emoji: "🌱" },
];

export default function MrAndMrsPage() {
  const { playerNames } = useGame();
  const [phase, setPhase] = useState<Phase>("names");
  const [spicyMode, setSpicyMode] = useState(false);
  const [questions, setQuestions] = useState<MrAndMrsQuestion[]>([]);
  const [usedQuestions, setUsedQuestions] = useState<string[]>([]);
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [p1Answer, setP1Answer] = useState<string | null>(null);
  const [p2Answer, setP2Answer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentQuestion = questions[0];

  const fetchQuestions = useCallback(
    async (exclude: string[], spicy: boolean) => {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game: "mr-and-mrs",
          spiceLevel: spicy ? "spicy" : undefined,
          count: 10,
          exclude,
        }),
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      return data.items as MrAndMrsQuestion[];
    },
    [],
  );

  const loadQuestions = useCallback(async () => {
    setPhase("loading");
    setError(null);
    try {
      const items = await fetchQuestions(usedQuestions, spicyMode);
      setQuestions(items);
      setPhase("pass-to-p1");
    } catch (err) {
      console.log('[Analytics]', 'api_error', { game: "mr-and-mrs", error: String(err) });
      posthog.capture("api_error", { game: "mr-and-mrs", error: String(err) });
      setError("Shuffling the deck... try again!");
    }
  }, [fetchQuestions, usedQuestions, spicyMode]);

  const handleStart = () => {
    console.log('[Analytics]', 'mrsmrs_game_start', { spicy: spicyMode });
    posthog.capture("mrsmrs_game_start", { spicy: spicyMode });
    loadQuestions();
  };

  const handleSpicyToggle = () => {
    vibrate(20);
    const newSpicy = !spicyMode;
    setSpicyMode(newSpicy);
    console.log("[M&M] Spicy toggled to:", newSpicy);

    // Check if we have questions matching the new mode
    const remaining = questions.slice(1);
    const matchingCount = remaining.filter((q) => q.spicy === newSpicy).length;
    console.log("[M&M] Matching questions in pool:", matchingCount);

    if (matchingCount < 3) {
      console.log("[M&M] Not enough matching questions, fetching...");
      fetchQuestions(usedQuestions, newSpicy).then((items) => {
        console.log(
          "[M&M] Fetched batch:",
          items.map((q) => ({ q: q.question.slice(0, 40), spicy: q.spicy })),
        );
        setQuestions((prev) => [...prev, ...items]);
      });
    }
  };

  const handleP1Answer = (answer: string) => {
    vibrate(30);
    setP1Answer(answer);
    setPhase("pass-to-p2");
  };

  const handleP2Answer = (answer: string) => {
    vibrate(30);
    setP2Answer(answer);
    const matched = answer === p1Answer;
    if (matched) setScore((s) => s + 1);
    console.log('[Analytics]', 'mrsmrs_round_complete', { round, totalRounds: TOTAL_ROUNDS, matched, spicy: currentQuestion?.spicy ?? spicyMode });
    posthog.capture("mrsmrs_round_complete", { round, totalRounds: TOTAL_ROUNDS, matched, spicy: currentQuestion?.spicy ?? spicyMode });
    setPhase("reveal");
  };

  const handleNext = () => {
    setP1Answer(null);
    setP2Answer(null);

    // Move to next question
    let remaining = questions.slice(1);
    setUsedQuestions((prev) => [...prev, currentQuestion.question]);

    // Filter to only show questions matching current mode
    remaining = remaining.filter((q) => q.spicy === spicyMode);

    if (round >= TOTAL_ROUNDS) {
      console.log('[Analytics]', 'mrsmrs_game_complete', { score, spicy: spicyMode });
      posthog.capture("mrsmrs_game_complete", { score, spicy: spicyMode });
      setQuestions(remaining);
      setPhase("end");
      return;
    }

    setRound((r) => r + 1);

    const newUsed = [...usedQuestions, currentQuestion.question];

    // If no items left, fetch immediately
    if (remaining.length === 0) {
      setQuestions([]);
      setPhase("loading");
      setError(null);
      fetchQuestions(newUsed, spicyMode)
        .then((items) => {
          setQuestions(items);
          setPhase("pass-to-p1");
        })
        .catch((err) => {
          console.log('[Analytics]', 'api_error', { game: "mr-and-mrs", error: String(err) });
          posthog.capture("api_error", { game: "mr-and-mrs", error: String(err) });
          setError("Shuffling the deck... try again!");
        });
      return;
    }

    setQuestions(remaining);

    // Refetch if running low
    if (remaining.length < 3) {
      fetchQuestions(newUsed, spicyMode).then((items) => {
        setQuestions((prev) => [...prev, ...items]);
      });
    }

    setPhase("pass-to-p1");
  };

  const handlePlayAgain = () => {
    setRound(1);
    setScore(0);
    setP1Answer(null);
    setP2Answer(null);
    setUsedQuestions([]);
    loadQuestions();
  };

  if (phase === "names") {
    return (
      <div
        className="min-h-[100dvh] flex flex-col items-center px-5 pb-6 safe-bottom"
        style={{ paddingTop: 'max(2.5rem, env(safe-area-inset-top, 0px))' }}
      >
        <div className="w-full max-w-sm mb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cream/10 border border-gold/20 font-body text-cream/70 text-sm hover:bg-cream/15 hover:text-cream transition-colors"
          >
            ← Back
          </Link>
        </div>

        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="font-display font-bold text-gold leading-tight mb-4"
          style={{ fontSize: 'clamp(2.25rem, 11vw, 3rem)' }}
        >
          Mr & Mrs
        </motion.h1>

        <div className="flex-1 flex flex-col items-center justify-start w-full max-w-sm">
          <p className="font-body text-cream/50 text-xs text-center mb-6 max-w-xs">
            How well do you know each other? Answer separately (you score a
            point when you agree!)
          </p>

          {/* Spicy toggle on intro screen */}
          <div className="w-full mb-6">
            <button
              onClick={() => {
                vibrate(20);
                setSpicyMode((s) => !s);
              }}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-cream/5 border border-gold/15 transition-colors"
            >
              <span className="font-body text-cream/70 text-sm">
                {spicyMode ? "🌶️ Spicy" : "😇 Keep it clean"}
              </span>
              <div
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  spicyMode ? "bg-casino-red/60" : "bg-cream/20"
                }`}
              >
                <motion.div
                  layout
                  className="absolute top-0.5 w-5 h-5 rounded-full bg-cream shadow-sm"
                  animate={{ left: spicyMode ? 22 : 2 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </div>
            </button>
          </div>

          <NameEntry onStart={handleStart} />
        </div>
      </div>
    );
  }

  const showInGameToggle =
    phase === "loading" ||
    phase === "pass-to-p1" ||
    phase === "p1-answer" ||
    phase === "pass-to-p2" ||
    phase === "p2-answer" ||
    phase === "reveal";

  return (
    <div
      className="min-h-[100dvh] flex flex-col items-center px-5 pb-6 safe-bottom"
      style={{ paddingTop: "max(2.5rem, env(safe-area-inset-top, 0px))" }}
    >
      {/* Header */}
      <div className="w-full max-w-sm mb-4 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cream/10 border border-gold/20 font-body text-cream/70 text-sm hover:bg-cream/15 hover:text-cream transition-colors"
        >
          ← Back
        </Link>

        {/* In-game spicy toggle */}
        {showInGameToggle && (
          <button
            onClick={handleSpicyToggle}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-body transition-colors ${
              spicyMode
                ? "bg-casino-red/20 border border-casino-red/30 text-casino-red"
                : "bg-cream/10 border border-gold/15 text-cream/40"
            }`}
          >
            {spicyMode ? "🌶️" : "😇"}
            <div
              className={`w-7 h-4 rounded-full transition-colors relative ${
                spicyMode ? "bg-casino-red/40" : "bg-cream/15"
              }`}
            >
              <motion.div
                layout
                className="absolute top-0.5 w-3 h-3 rounded-full bg-cream shadow-sm"
                animate={{ left: spicyMode ? 14 : 2 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </div>
          </button>
        )}
      </div>

      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-display font-bold text-gold leading-tight mb-4"
        style={{ fontSize: 'clamp(2.25rem, 11vw, 3rem)' }}
      >
        Mr & Mrs
      </motion.h1>

      {phase !== "end" && phase !== "loading" && (
        <>
          <ScoreTracker
            round={round}
            totalRounds={TOTAL_ROUNDS}
            score={score}
            maxScore={TOTAL_ROUNDS}
          />
          {/* Debug: current spicy mode + question spicy flag */}
          <p className="font-body text-cream/30 text-[10px] mt-1">
            Mode: {spicyMode ? "spicy" : "clean"}
            {currentQuestion &&
              ` | Question: ${currentQuestion.spicy ? "spicy" : "clean"}`}
          </p>
        </>
      )}

      <div className="flex-1 flex items-center justify-center w-full mt-4">
        <AnimatePresence mode="wait">
          {phase === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {error ? (
                <div className="text-center">
                  <p className="font-body text-cream/60 text-sm mb-3">
                    {error}
                  </p>
                  <button
                    onClick={loadQuestions}
                    className="font-body text-gold text-sm underline"
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                <LoadingState />
              )}
            </motion.div>
          )}

          {phase === "pass-to-p1" && playerNames && (
            <PassPhone
              key="pass-p1"
              playerName={playerNames.player1}
              onReady={() => setPhase("p1-answer")}
            />
          )}

          {phase === "p1-answer" && currentQuestion && playerNames && (
            <motion.div
              key={`p1-${round}`}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="w-full max-w-sm"
            >
              <div className="bg-cream/10 backdrop-blur-sm border border-gold/20 rounded-xl p-5 mb-4">
                <p className="font-body text-cream/50 text-xs mb-3">
                  {playerNames.player1}, answer honestly:
                </p>
                <p className="font-display text-cream text-lg leading-relaxed">
                  {currentQuestion.question}
                </p>
              </div>

              <div className="flex gap-3">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleP1Answer(playerNames.player1)}
                  className="flex-1 py-4 rounded-lg bg-gold/20 border border-gold/30 text-gold font-display text-base font-semibold min-h-[56px]"
                >
                  {playerNames.player1}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleP1Answer(playerNames.player2)}
                  className="flex-1 py-4 rounded-lg bg-silver/20 border border-silver/30 text-silver font-display text-base font-semibold min-h-[56px]"
                >
                  {playerNames.player2}
                </motion.button>
              </div>
            </motion.div>
          )}

          {phase === "pass-to-p2" && playerNames && (
            <PassPhone
              key="pass"
              playerName={playerNames.player2}
              onReady={() => setPhase("p2-answer")}
            />
          )}

          {phase === "p2-answer" && currentQuestion && playerNames && (
            <motion.div
              key={`p2-${round}`}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="w-full max-w-sm"
            >
              <div className="bg-cream/10 backdrop-blur-sm border border-gold/20 rounded-xl p-5 mb-4">
                <p className="font-body text-cream/50 text-xs mb-3">
                  {playerNames.player2}, your turn:
                </p>
                <p className="font-display text-cream text-lg leading-relaxed">
                  {currentQuestion.question}
                </p>
              </div>

              <div className="flex gap-3">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleP2Answer(playerNames.player1)}
                  className="flex-1 py-4 rounded-lg bg-gold/20 border border-gold/30 text-gold font-display text-base font-semibold min-h-[56px]"
                >
                  {playerNames.player1}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleP2Answer(playerNames.player2)}
                  className="flex-1 py-4 rounded-lg bg-silver/20 border border-silver/30 text-silver font-display text-base font-semibold min-h-[56px]"
                >
                  {playerNames.player2}
                </motion.button>
              </div>
            </motion.div>
          )}

          {phase === "reveal" &&
            currentQuestion &&
            playerNames &&
            p1Answer &&
            p2Answer && (
              <RevealResult
                key={`reveal-${round}`}
                question={currentQuestion.question}
                player1Name={playerNames.player1}
                player2Name={playerNames.player2}
                player1Answer={p1Answer}
                player2Answer={p2Answer}
                matched={p1Answer === p2Answer}
                onNext={handleNext}
              />
            )}

          {phase === "end" && (
            <EndScreen
              key="end"
              score={score}
              maxScore={TOTAL_ROUNDS}
              tiers={TIERS}
              onPlayAgain={handlePlayAgain}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
