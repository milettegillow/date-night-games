"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useGame } from "@/context/GameContext";
import NameEntry from "@/components/NameEntry";
import PassPhone from "@/components/PassPhone";
import RevealResult from "@/components/RevealResult";
import ScoreTracker from "@/components/ScoreTracker";
import EndScreen from "@/components/EndScreen";
import LoadingState from "@/components/LoadingState";
import { vibrate } from "@/lib/haptics";

type Phase =
  | "names"
  | "loading"
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
  const [phase, setPhase] = useState<Phase>(playerNames ? "loading" : "names");
  const [questions, setQuestions] = useState<string[]>([]);
  const [usedQuestions, setUsedQuestions] = useState<string[]>([]);
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [p1Answer, setP1Answer] = useState<string | null>(null);
  const [p2Answer, setP2Answer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentQuestion = questions[0];

  const fetchQuestions = useCallback(
    async (exclude: string[]) => {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game: "mr-and-mrs",
          count: 10,
          exclude,
        }),
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      return data.items as string[];
    },
    []
  );

  const loadQuestions = useCallback(async () => {
    setPhase("loading");
    setError(null);
    try {
      const items = await fetchQuestions(usedQuestions);
      setQuestions(items);
      setPhase("p1-answer");
    } catch {
      setError("Shuffling the deck... try again!");
    }
  }, [fetchQuestions, usedQuestions]);

  useEffect(() => {
    if (phase === "loading" && playerNames) {
      loadQuestions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStart = () => {
    loadQuestions();
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
    setPhase("reveal");
  };

  const handleNext = () => {
    setP1Answer(null);
    setP2Answer(null);

    // Move to next question
    const remaining = questions.slice(1);
    setUsedQuestions((prev) => [...prev, currentQuestion]);
    setQuestions(remaining);

    if (round >= TOTAL_ROUNDS) {
      setPhase("end");
      return;
    }

    setRound((r) => r + 1);

    // Refetch if running low
    if (remaining.length < 3) {
      fetchQuestions([...usedQuestions, currentQuestion]).then((items) => {
        setQuestions((prev) => [...prev, ...items]);
      });
    }

    setPhase("p1-answer");
  };

  const handlePlayAgain = () => {
    setRound(1);
    setScore(0);
    setP1Answer(null);
    setP2Answer(null);
    setUsedQuestions([]);
    loadQuestions();
  };

  if (!playerNames && phase === "names") {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center px-5 py-6">
        <Link
          href="/"
          className="font-body text-cream/60 text-sm mb-6 self-start hover:text-cream transition-colors"
        >
          ← Back
        </Link>
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="font-display text-2xl font-bold text-gold mb-2"
        >
          Mr & Mrs
        </motion.h1>
        <p className="font-body text-cream/50 text-xs text-center mb-6 max-w-xs">
          How well do you know each other? Answer separately — you score a
          point when you agree!
        </p>
        <NameEntry onStart={handleStart} />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col items-center px-5 py-6 safe-top safe-bottom">
      {/* Header */}
      <div className="w-full max-w-sm mb-4">
        <Link
          href="/"
          className="font-body text-cream/60 text-sm hover:text-cream transition-colors"
        >
          ← Back
        </Link>
      </div>

      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-display text-2xl font-bold text-gold mb-4"
      >
        Mr & Mrs
      </motion.h1>

      {phase !== "end" && phase !== "loading" && (
        <ScoreTracker
          round={round}
          totalRounds={TOTAL_ROUNDS}
          score={score}
          maxScore={TOTAL_ROUNDS}
        />
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
                  <p className="font-body text-cream/60 text-sm mb-3">{error}</p>
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
                  {currentQuestion}
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
                  className="flex-1 py-4 rounded-lg bg-rose-gold/20 border border-rose-gold/30 text-rose-gold font-display text-base font-semibold min-h-[56px]"
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
                  {currentQuestion}
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
                  className="flex-1 py-4 rounded-lg bg-rose-gold/20 border border-rose-gold/30 text-rose-gold font-display text-base font-semibold min-h-[56px]"
                >
                  {playerNames.player2}
                </motion.button>
              </div>
            </motion.div>
          )}

          {phase === "reveal" && currentQuestion && playerNames && p1Answer && p2Answer && (
            <RevealResult
              key={`reveal-${round}`}
              question={currentQuestion}
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
