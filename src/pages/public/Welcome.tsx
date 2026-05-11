import React from "react";
import { motion } from "framer-motion";
import { Shield, BookOpen, Radar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { NBS_COMPANY_CONFIG } from "@/logic/PaymentOrchestrator";

const Welcome = () => {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 24 },
    },
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/20 via-slate-950 to-slate-950 pointer-events-none"></div>

      <motion.div
        className="max-w-4xl w-full z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="text-center mb-16 space-y-6" variants={itemVariants}>
          <h1 
            className="text-5xl md:text-7xl font-bold tracking-tight text-white drop-shadow-md"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {NBS_COMPANY_CONFIG.legalName}
          </h1>
          <p className="text-xl text-amber-200/80 font-medium italic font-serif">
            A Stonington Tradition
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <motion.div 
            variants={itemVariants}
            className="bg-slate-900/50 border border-amber-900/30 rounded-2xl p-8 backdrop-blur-sm hover:border-[#fbbf24]/50 transition-colors duration-500 group"
          >
            <Shield className="w-10 h-10 text-[#fbbf24] mb-6 group-hover:scale-110 transition-transform duration-500" />
            <h3 className="text-xl font-semibold mb-3 font-serif">Absolute Privacy</h3>
            <p className="text-slate-400 leading-relaxed">
              Your menu stays yours—your clients, your margins. Everything runs locally on your device. Zero external databases.
            </p>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            className="bg-slate-900/50 border border-amber-900/30 rounded-2xl p-8 backdrop-blur-sm hover:border-[#fbbf24]/50 transition-colors duration-500 group"
          >
            <BookOpen className="w-10 h-10 text-[#fbbf24] mb-6 group-hover:scale-110 transition-transform duration-500" />
            <h3 className="text-xl font-semibold mb-3 font-serif">Progressive Narrative</h3>
            <p className="text-slate-400 leading-relaxed">
              Turn a list of ingredients into an heirloom. Interactive dish narratives guide your execution and preserve your heritage.
            </p>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            className="bg-slate-900/50 border border-amber-900/30 rounded-2xl p-8 backdrop-blur-sm hover:border-[#fbbf24]/50 transition-colors duration-500 group"
          >
            <Radar className="w-10 h-10 text-[#fbbf24] mb-6 group-hover:scale-110 transition-transform duration-500" />
            <h3 className="text-xl font-semibold mb-3 font-serif">Market Intelligence</h3>
            <p className="text-slate-400 leading-relaxed">
              Live competitor pricing and local sourcing options injected directly into your BEOs. Know your worth.
            </p>
          </motion.div>
        </div>

        <motion.div className="flex justify-center" variants={itemVariants}>
          <Button 
            onClick={() => navigate("/dashboard")}
            className="bg-[#fbbf24] text-slate-900 hover:bg-[#fbbf24]/90 text-lg px-12 py-6 rounded-full shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:shadow-[0_0_30px_rgba(234,179,8,0.5)] transition-all font-semibold"
          >
            Enter The Vault
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Welcome;