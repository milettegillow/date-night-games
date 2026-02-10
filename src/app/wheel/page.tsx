"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import SpinWheel from "@/components/SpinWheel";
import LoadingState from "@/components/LoadingState";
import { WheelCategory } from "@/lib/types";

export default function WheelPage() {
  const [currentCategory, setCurrentCategory] = useState<WheelCategory | null>(null);
  const [currentTopic, setCurrentTopic] = useState<string | null>(null);
  const [topicPools, setTopicPools] = useState<Record<string, string[]>>({});
  const [usedTopics, setUsedTopics] = useState<string[]>([]);
  const [topicsExplored, setTopicsExplored] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showTopic, setShowTopic] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTopics = useCallback(
    async (category: WheelCategory, exclude: string[]) => {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game: "wheel",
          category,
          count: 5,
          exclude,
        }),
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      return data.items as string[];
    },
    []
  );

  const getTopicFromPool = useCallback(
    async (category: WheelCategory) => {
      setIsLoading(true);
      setError(null);

      try {
        let pool = topicPools[category] || [];

        // Fetch if pool is empty
        if (pool.length === 0) {
          pool = await fetchTopics(category, usedTopics);
          setTopicPools((prev) => ({ ...prev, [category]: pool }));
        }

        // Pop a topic
        const topic = pool[0];
        const remaining = pool.slice(1);
        setTopicPools((prev) => ({ ...prev, [category]: remaining }));
        setUsedTopics((prev) => [...prev, topic]);
        setCurrentTopic(topic);
        setTopicsExplored((prev) => prev + 1);
        setShowTopic(true);

        // Refetch in background if pool is getting low
        if (remaining.length < 2) {
          fetchTopics(category, [...usedTopics, topic]).then((newTopics) => {
            setTopicPools((prev) => ({
              ...prev,
              [category]: [...(prev[category] || []), ...newTopics],
            }));
          });
        }
      } catch {
        setError("Shuffling the deck... try again!");
      } finally {
        setIsLoading(false);
      }
    },
    [topicPools, usedTopics, fetchTopics]
  );

  const handleCategorySelected = useCallback(
    (category: WheelCategory) => {
      setCurrentCategory(category);
      setShowTopic(false);
      getTopicFromPool(category);
    },
    [getTopicFromPool]
  );

  const handleNextTopic = () => {
    if (currentCategory) {
      setShowTopic(false);
      setTimeout(() => getTopicFromPool(currentCategory), 300);
    }
  };

  const handleSpinAgain = () => {
    setShowTopic(false);
    setCurrentTopic(null);
    setCurrentCategory(null);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center px-5 py-6 safe-top safe-bottom">
      {/* Header */}
      <div className="flex items-center justify-between w-full max-w-sm mb-4">
        <Link
          href="/"
          className="font-body text-cream/60 text-sm hover:text-cream transition-colors"
        >
          ← Back
        </Link>
        <span className="font-body text-cream/40 text-xs">
          Topics Explored: {topicsExplored}
        </span>
      </div>

      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-display text-2xl font-bold text-gold mb-6"
      >
        Conversation Wheel
      </motion.h1>

      {/* Wheel */}
      <SpinWheel
        onCategorySelected={handleCategorySelected}
        disabled={isLoading}
      />

      {/* Topic display area */}
      <div className="mt-6 w-full max-w-sm min-h-[160px] flex items-center justify-center">
        <AnimatePresence mode="wait">
          {isLoading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <LoadingState />
            </motion.div>
          )}

          {error && !isLoading && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <p className="font-body text-cream/60 text-sm mb-3">{error}</p>
              <button
                onClick={() => currentCategory && getTopicFromPool(currentCategory)}
                className="font-body text-gold text-sm underline"
              >
                Try Again
              </button>
            </motion.div>
          )}

          {showTopic && currentTopic && !isLoading && !error && (
            <motion.div
              key="topic"
              initial={{ rotateY: 90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: -90, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="w-full"
              style={{ transformStyle: "preserve-3d" }}
            >
              <div className="bg-cream/10 backdrop-blur-sm border border-gold/20 rounded-xl p-5">
                <p className="font-body text-gold/60 text-xs uppercase tracking-wider mb-2">
                  {currentCategory}
                </p>
                <p className="font-display text-cream text-lg leading-relaxed">
                  {currentTopic}
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleNextTopic}
                  className="flex-1 py-3 rounded-lg bg-gold/20 text-gold font-body text-sm font-medium hover:bg-gold/30 transition-colors"
                >
                  Next Topic
                </button>
                <button
                  onClick={handleSpinAgain}
                  className="flex-1 py-3 rounded-lg border border-gold/20 text-cream/70 font-body text-sm font-medium hover:bg-cream/5 transition-colors"
                >
                  Spin Again
                </button>
              </div>
            </motion.div>
          )}

          {!showTopic && !isLoading && !error && (
            <motion.p
              key="hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="font-body text-cream/30 text-sm text-center"
            >
              Tap SPIN to get a conversation topic
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
