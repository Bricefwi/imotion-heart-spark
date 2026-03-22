import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, Send, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";

interface ReviewFormProps {
  onSuccess?: () => void;
}

export function ReviewSubmitForm({ onSuccess }: ReviewFormProps) {
  const { user, profile } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!user || rating === 0 || reviewText.trim().length < 10) {
      toast.error("Veuillez donner une note et écrire au moins 10 caractères.");
      return;
    }

    setLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from("client_reviews").insert({
        user_id: user.id,
        reviewer_name: profile?.full_name || "Anonyme",
        reviewer_role: profile?.company_role || null,
        reviewer_company: profile?.company_name || null,
        rating,
        review_text: reviewText.trim(),
        status: "pending",
      });

      if (error) throw error;

      setSubmitted(true);
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
      toast.success("Merci ! Votre avis sera publié après validation.");
      onSuccess?.();
    } catch (err) {
      console.error("Review submit error:", err);
      toast.error("Erreur lors de l'envoi de l'avis.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardContent className="p-6 text-center">
          <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-3" />
          <h3 className="font-semibold text-lg mb-1">Merci pour votre avis !</h3>
          <p className="text-sm text-muted-foreground">Il sera visible sur le site après validation par notre équipe.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/40">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Star className="h-4 w-4 text-secondary" />
          Donner votre avis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Star rating */}
        <div>
          <Label className="text-sm">Votre note</Label>
          <div className="flex gap-1 mt-1.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-0.5 transition-transform hover:scale-110"
              >
                <Star
                  className={`h-7 w-7 transition-colors ${
                    star <= (hoverRating || rating)
                      ? "fill-secondary text-secondary"
                      : "text-muted-foreground/30"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Review text */}
        <div>
          <Label htmlFor="review-text">Votre commentaire</Label>
          <Textarea
            id="review-text"
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Partagez votre expérience avec IMOTION Creator Studio..."
            className="mt-1.5 min-h-[100px]"
            maxLength={1000}
          />
          <p className="text-xs text-muted-foreground mt-1">{reviewText.length}/1000 caractères</p>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={loading || rating === 0 || reviewText.trim().length < 10}
          className="w-full gradient-primary border-0"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          Envoyer mon avis
        </Button>
      </CardContent>
    </Card>
  );
}
