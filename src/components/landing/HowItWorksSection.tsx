import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { FolderPlus, MessageSquare, FileText, FileSignature, Code, ClipboardCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import teamImg from "@/assets/team-collaboration.jpg";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

export function HowItWorksSection() {
  const { t } = useTranslation();

  const steps = [
    { icon: FolderPlus, number: "01", title: t("howItWorks.step1Title"), description: t("howItWorks.step1Desc") },
    { icon: MessageSquare, number: "02", title: t("howItWorks.step2Title"), description: t("howItWorks.step2Desc") },
    { icon: FileText, number: "03", title: t("howItWorks.step3Title"), description: t("howItWorks.step3Desc") },
    { icon: FileSignature, number: "04", title: t("howItWorks.step4Title"), description: t("howItWorks.step4Desc") },
    { icon: Code, number: "05", title: t("howItWorks.step5Title"), description: t("howItWorks.step5Desc") },
    { icon: ClipboardCheck, number: "06", title: t("howItWorks.step6Title"), description: t("howItWorks.step6Desc") },
  ];

  return (
    <section id="how-it-works" className="py-20 md:py-28 relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <img src={teamImg} alt="" className="w-full h-full object-cover opacity-5" />
      </div>

      <div className="container">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">{t("howItWorks.badge")}</Badge>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            {t("howItWorks.title")}
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {t("howItWorks.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 max-w-6xl mx-auto">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={fadeUp} custom={i}
              className="relative text-center group"
            >
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-[2px] bg-gradient-to-r from-primary/30 to-secondary/30" />
              )}

              <div className="relative inline-flex items-center justify-center h-16 w-16 lg:h-20 lg:w-20 rounded-2xl gradient-primary mb-4 lg:mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <step.icon className="h-7 w-7 lg:h-8 lg:w-8 text-primary-foreground" />
                <span className="absolute -top-2 -right-2 h-6 w-6 lg:h-7 lg:w-7 rounded-full bg-secondary text-secondary-foreground text-[10px] lg:text-xs font-bold flex items-center justify-center shadow">
                  {step.number}
                </span>
              </div>
              <h3 className="font-display text-sm lg:text-base font-bold mb-1 lg:mb-2">{step.title}</h3>
              <p className="text-xs lg:text-sm text-muted-foreground leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
