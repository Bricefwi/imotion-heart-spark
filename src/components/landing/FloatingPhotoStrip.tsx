import { motion } from "framer-motion";

import authPhoto1 from "@/assets/auth-photo-1.jpg";
import authPhoto2 from "@/assets/auth-photo-2.jpg";
import authPhoto3 from "@/assets/auth-photo-3.jpg";
import teamImg from "@/assets/team-collaboration.jpg";

const photosRow1 = [authPhoto1, authPhoto2, authPhoto3, teamImg, authPhoto1, authPhoto2, authPhoto3, teamImg];
const photosRow2 = [authPhoto3, teamImg, authPhoto1, authPhoto2, authPhoto3, teamImg, authPhoto1, authPhoto2];

export function FloatingPhotoStrip() {
  return (
    <section className="py-16 md:py-24 relative overflow-hidden">
      {/* Gradient edges for fade effect */}
      <div className="absolute left-0 top-0 bottom-0 w-24 md:w-40 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-24 md:w-40 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

      {/* Row 1 — scrolls left */}
      <motion.div
        className="flex gap-5 mb-5"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      >
        {photosRow1.map((photo, i) => (
          <div
            key={`r1-${i}`}
            className="relative shrink-0 w-64 h-40 md:w-80 md:h-52 rounded-2xl overflow-hidden group"
          >
            <img
              src={photo}
              alt=""
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-secondary/10 opacity-60 group-hover:opacity-30 transition-opacity duration-500" />
            <div className="absolute inset-0 bg-background/10 backdrop-blur-[1px] group-hover:backdrop-blur-0 transition-all duration-500" />
          </div>
        ))}
      </motion.div>

      {/* Row 2 — scrolls right */}
      <motion.div
        className="flex gap-5"
        animate={{ x: ["-50%", "0%"] }}
        transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
      >
        {photosRow2.map((photo, i) => (
          <div
            key={`r2-${i}`}
            className="relative shrink-0 w-56 h-36 md:w-72 md:h-44 rounded-2xl overflow-hidden group"
          >
            <img
              src={photo}
              alt=""
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-secondary/15 to-primary/20 opacity-50 group-hover:opacity-20 transition-opacity duration-500" />
            <div className="absolute inset-0 bg-background/15 backdrop-blur-[1px] group-hover:backdrop-blur-0 transition-all duration-500" />
          </div>
        ))}
      </motion.div>
    </section>
  );
}
