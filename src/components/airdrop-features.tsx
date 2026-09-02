"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Box, ScanLine, Users, ShieldCheck } from "lucide-react";

export function AirdropFeatures() {
  const [isOpen, setIsOpen] = useState(false);

  const features = [
    {
      icon: ScanLine,
      title: "OCR Verification",
      description: "Auto-scan game stats to guarantee player authenticity.",
      color: "from-yellow-400 to-yellow-600",
      shadow: "shadow-yellow-500/50",
      tier: "Mythic",
    },
    {
      icon: Users,
      title: "Targeted Matching",
      description: "Find your ideal duo, squad, or organization seamlessly.",
      color: "from-fuchsia-500 to-purple-600",
      shadow: "shadow-fuchsia-500/50",
      tier: "Legendary",
    },
    {
      icon: ShieldCheck,
      title: "Verified Orgs",
      description: "Direct scouting access for top-tier endorsed esports teams.",
      color: "from-blue-400 to-blue-600",
      shadow: "shadow-blue-500/50",
      tier: "Epic",
    },
  ];

  return (
    <div className="relative w-full py-24 flex flex-col items-center justify-center min-h-[600px] overflow-hidden bg-background">
      <div className="text-center mb-24 z-10">
        <h2 className="text-3xl md:text-5xl font-bold tracking-tighter font-headline mb-4">
          Tactical Advantage
        </h2>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto px-4">
          Hover over the airdrop to reveal your loot—the features that set SynerGG apart from the rest.
        </p>
      </div>

      <div 
        className="relative z-10 cursor-pointer w-48 h-48"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={() => setIsOpen(!isOpen)}
      >
        {/* Flare Smoke */}
        <motion.div 
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-32 h-64 bg-red-600/30 blur-[40px] rounded-full pointer-events-none"
          animate={{
            opacity: isOpen ? 0.8 : 0.4,
            scaleY: isOpen ? 1.5 : 1,
            translateY: isOpen ? -30 : 0
          }}
          transition={{ duration: 2, repeat: Infinity, repeatType: "mirror" }}
        />

        {/* The Crate */}
        <motion.div 
          className="relative w-full h-full bg-neutral-900 border-[6px] border-red-600 shadow-[0_0_50px_rgba(220,38,38,0.5)] rounded-lg flex items-center justify-center z-20"
          animate={{
             y: isOpen ? 10 : 0,
             scale: isOpen ? 0.95 : 1,
             boxShadow: isOpen ? "0 0 80px rgba(220,38,38,0.8)" : "0 0 50px rgba(220,38,38,0.5)"
          }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          {/* Crate Straps */}
          <div className="absolute top-0 bottom-0 left-1/2 w-6 -translate-x-1/2 bg-neutral-800" />
          <div className="absolute left-0 right-0 top-1/2 h-6 -translate-y-1/2 bg-neutral-800" />
          
          <Box className="w-24 h-24 text-red-500 drop-shadow-[0_0_15px_rgba(220,38,38,0.8)] z-10" />
        </motion.div>

        {/* Floating Loot Items */}
        <AnimatePresence>
          {isOpen && features.map((feature, idx) => {
             const angle = (idx - 1) * 45; // -45, 0, 45 degrees
             const radius = 240;
             const x = Math.sin(angle * (Math.PI / 180)) * radius;
             const y = -Math.cos(angle * (Math.PI / 180)) * radius - 100;

             return (
               <motion.div
                 key={feature.title}
                 initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
                 animate={{ opacity: 1, x, y, scale: 1 }}
                 exit={{ opacity: 0, x: 0, y: 0, scale: 0 }}
                 transition={{ type: "spring", stiffness: 200, damping: 15, delay: idx * 0.1 }}
                 className={`absolute top-1/2 left-1/2 w-64 -translate-x-1/2 -translate-y-1/2 p-1 rounded-xl bg-gradient-to-br ${feature.color} shadow-2xl ${feature.shadow} z-0`}
               >
                 <div className="bg-background/95 backdrop-blur h-full w-full rounded-lg p-6 flex flex-col items-center text-center border border-white/10">
                   <feature.icon className="w-12 h-12 mb-4 text-foreground drop-shadow-md" />
                   <h3 className="font-bold text-xl font-headline mb-1">{feature.title}</h3>
                   <span className="text-[10px] font-black uppercase tracking-widest text-primary mb-3 opacity-90">{feature.tier}</span>
                   <p className="text-sm text-muted-foreground">{feature.description}</p>
                 </div>
               </motion.div>
             )
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
