import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

import authPhoto1 from "@/assets/auth-photo-1.jpg";
import authPhoto2 from "@/assets/auth-photo-2.jpg";
import authPhoto3 from "@/assets/auth-photo-3.jpg";

const slides = [
  {
    image: authPhoto1,
    title: "Pilotez vos projets avec clarté",
    subtitle: "Un consultant IA qui structure votre vision en livrables concrets.",
  },
  {
    image: authPhoto2,
    title: "Collaborez sans friction",
    subtitle: "De l'idée au cahier des charges en 45 minutes.",
  },
  {
    image: authPhoto3,
    title: "Accélérez votre croissance",
    subtitle: "Rejoignez 150+ entreprises qui nous font confiance.",
  },
];

export function AuthPhotoCarousel() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrent((c) => (c + 1) % slides.length), 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Photos with crossfade */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <img
            src={slides[current].image}
            alt=""
            className="w-full h-full object-cover"
          />
        </motion.div>
      </AnimatePresence>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
      <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-secondary/20 mix-blend-overlay" />

      {/* Floating geometric accents */}
      <motion.div
        className="absolute top-12 right-12 w-20 h-20 border-2 border-white/10 rounded-2xl"
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute bottom-32 right-20 w-12 h-12 border border-white/10 rounded-full"
        animate={{ y: [-10, 10, -10] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/3 left-8 w-16 h-16 border border-white/5 rounded-xl"
        animate={{ rotate: -360 }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h2 className="font-display text-3xl xl:text-4xl font-extrabold text-white mb-3 leading-tight">
              {slides[current].title}
            </h2>
            <p className="text-white/70 text-lg max-w-md">
              {slides[current].subtitle}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Dots */}
        <div className="flex gap-2 mt-8">
          {slides.map((_, i) => (
            <button
              key={`dot-${i}`}
              onClick={() => setCurrent(i)}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === current ? "w-8 bg-white" : "w-3 bg-white/30 hover:bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
