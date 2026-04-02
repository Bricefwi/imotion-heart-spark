import { useState } from "react";
import { SEOHead, breadcrumbSchema } from "@/components/SEOHead";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Send, CheckCircle2, Clock, MessageSquare } from "lucide-react";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Le nom doit contenir au moins 2 caractères").max(100),
  email: z.string().trim().email("Adresse email invalide").max(255),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  company: z.string().trim().max(100).optional().or(z.literal("")),
  subject: z.string().min(1, "Veuillez sélectionner un sujet"),
  message: z.string().trim().min(10, "Le message doit contenir au moins 10 caractères").max(2000),
});

type ContactForm = z.infer<typeof contactSchema>;

const subjects = [
  { value: "decouverte", label: "Découvrir nos services" },
  { value: "projet", label: "Discuter d'un projet" },
  { value: "tarifs", label: "Demande de devis" },
  { value: "partenariat", label: "Partenariat" },
  { value: "support", label: "Support technique" },
  { value: "autre", label: "Autre" },
];

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", phone: "", company: "", subject: "", message: "" },
  });

  const onSubmit = async (data: ContactForm) => {
    setLoading(true);
    try {
      const { error } = await supabase.from("contact_messages").insert({
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        company: data.company || null,
        subject: data.subject,
        message: data.message,
      });
      if (error) throw error;
      setSubmitted(true);
      toast.success("Message envoyé avec succès !");
    } catch {
      toast.error("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overflow-hidden">
      <SEOHead
        title="Contact — Parlons de votre projet digital"
        description="Contactez IMOTION Creator Studio pour discuter de votre projet digital. Réponse sous 24h. Devis gratuit et sans engagement."
        canonical="/contact"
        jsonLd={breadcrumbSchema([
          { name: "Accueil", url: "/" },
          { name: "Contact", url: "/contact" },
        ])}
      />
      {/* Hero */}
      <section className="py-16 md:py-24 relative">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 right-1/4 w-72 h-72 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute bottom-10 left-1/4 w-64 h-64 rounded-full bg-secondary/5 blur-3xl" />
        </div>
        <div className="container text-center">
          <Badge variant="outline" className="mb-4">Contact</Badge>
          <h1 className="font-display text-3xl md:text-5xl font-bold mb-4">
            Parlons de votre <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">projet</span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-lg">
            Une question, un projet ou une demande de devis ? Notre équipe vous répond sous 24h.
          </p>
        </div>
      </section>

      <section className="pb-20 md:pb-28">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Info cards */}
            <div className="space-y-4 lg:order-2">
              {[
                { icon: Mail, title: "Email", desc: "contact@imotion-conseils.fr", href: "mailto:contact@imotion-conseils.fr" },
                { icon: Phone, title: "Téléphone", desc: "+33 9 72 14 59 08", href: "tel:+33972145908" },
                { icon: MapPin, title: "Adresse", desc: "95 avenue du Président Wilson, 93100 Montreuil", href: "https://maps.google.com/?q=95+avenue+du+Pr%C3%A9sident+Wilson+93100+Montreuil" },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                >
                  <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-5 flex items-start gap-4">
                      <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shrink-0">
                        <item.icon className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <div>
                        <h3 className="font-display font-semibold text-sm">{item.title}</h3>
                        {item.href ? (
                          <a href={item.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                            {item.desc}
                          </a>
                        ) : (
                          <p className="text-sm text-muted-foreground">{item.desc}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}

              {/* Response time */}
              <Card className="border-0 shadow-sm bg-muted/30">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Clock className="h-4 w-4 text-primary" />
                    Temps de réponse
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Questions générales</span>
                      <span className="font-medium text-foreground">24h</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Demandes de devis</span>
                      <span className="font-medium text-foreground">48h</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Support technique</span>
                      <span className="font-medium text-foreground">12h</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Form */}
            <div className="lg:col-span-2 lg:order-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6 md:p-8">
                    {submitted ? (
                      <div className="text-center py-12 space-y-4">
                        <div className="h-16 w-16 rounded-full gradient-primary flex items-center justify-center mx-auto">
                          <CheckCircle2 className="h-8 w-8 text-primary-foreground" />
                        </div>
                        <h3 className="font-display text-xl font-bold">Message envoyé !</h3>
                        <p className="text-muted-foreground max-w-sm mx-auto">
                          Merci pour votre message. Notre équipe vous répondra dans les plus brefs délais.
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => { setSubmitted(false); form.reset(); }}
                          className="mt-4"
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Envoyer un autre message
                        </Button>
                      </div>
                    ) : (
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Nom complet *</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Votre nom" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="email"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Email *</FormLabel>
                                  <FormControl>
                                    <Input type="email" placeholder="votre@email.com" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="phone"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Téléphone</FormLabel>
                                  <FormControl>
                                    <Input placeholder="06 00 00 00 00" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="company"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Entreprise</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Mon entreprise" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name="subject"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Sujet *</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Sélectionnez un sujet" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {subjects.map((s) => (
                                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="message"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Message *</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Décrivez votre projet ou votre question..."
                                    rows={5}
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <Button
                            type="submit"
                            disabled={loading}
                            className="w-full gradient-primary border-0 shadow-lg hover:shadow-xl transition-shadow"
                          >
                            {loading ? "Envoi en cours…" : (
                              <>
                                <Send className="h-4 w-4 mr-2" />
                                Envoyer le message
                              </>
                            )}
                          </Button>

                          <p className="text-xs text-muted-foreground text-center">
                            En soumettant ce formulaire, vous acceptez notre{" "}
                            <a href="/confidentialite" className="underline hover:text-primary">politique de confidentialité</a>.
                          </p>
                        </form>
                      </Form>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
