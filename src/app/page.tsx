"use client";

import GameCard from "@/components/GameCard";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-5 py-8 safe-top safe-bottom table-pattern">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-8"
      >
        <h1 className="font-display text-4xl font-bold gold-shimmer mb-2">
          Date Night Games
        </h1>
        <p className="font-body text-cream/60 text-sm">
          Conversation run dry? Shuffle the deck.
        </p>
      </motion.div>

      {/* Game Cards Grid */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
        <GameCard
          title="Conversation Wheel"
          subtitle="Spin for a topic to talk about"
          suit="clubs"
          href="/wheel"
          delay={0.1}
        />

        <GameCard
          title="Never Have I Ever"
          subtitle="How adventurous are you?"
          suit="diamonds"
          href="/never-have-i-ever"
          delay={0.3}
        />
        <GameCard
          title="Mr & Mrs"
          subtitle="How well do you know each other?"
          suit="hearts"
          href="/mr-and-mrs"
          delay={0.2}
        />
        <GameCard
          title="Would You Rather"
          subtitle="Do you think alike?"
          suit="spades"
          href="/would-you-rather"
          delay={0.4}
        />
      </div>

      {/* Decorative footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="mt-8"
      >
        <div className="h-px w-48 bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
      </motion.div>
    </div>
  );
}
