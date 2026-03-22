import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // Verify cron secret
    const authHeader = req.headers.get("Authorization");
    const cronSecret = Deno.env.get("CRON_SECRET");
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // Also allow service role key
      const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
      if (!authHeader?.includes(supabaseAnonKey || "___")) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find projects with status "discovery_complete" and a scheduled CDC time that has passed
    const { data: projects, error } = await supabase
      .from("projects")
      .select("id, name, discovery_data, client_id")
      .eq("status", "discovery_complete");

    if (error) {
      console.error("Error fetching projects:", error);
      throw error;
    }

    const now = new Date();
    let processed = 0;
    let skipped = 0;

    for (const project of (projects || [])) {
      const discoveryData = project.discovery_data as Record<string, unknown> || {};
      const scheduledAt = discoveryData.cdc_scheduled_at as string | undefined;
      const cdcGenerated = discoveryData.cdc_generated as boolean | undefined;

      // Skip if already generated or no schedule set
      if (cdcGenerated) {
        skipped++;
        continue;
      }

      // If no scheduled time, it means "generate now" was not chosen and no delay was set
      // Only process if there IS a scheduled time and it has passed
      if (!scheduledAt) {
        skipped++;
        continue;
      }

      const scheduledDate = new Date(scheduledAt);
      if (scheduledDate > now) {
        skipped++;
        continue;
      }

      // Time to generate the CDC!
      console.log(`[CDC Cron] Generating CDC for project ${project.id} (${project.name}), scheduled at ${scheduledAt}`);

      try {
        // Call generate-document edge function
        const generateUrl = `${supabaseUrl}/functions/v1/generate-document`;
        const res = await fetch(generateUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            projectId: project.id,
            type: "cdc",
          }),
        });

        if (!res.ok) {
          const errText = await res.text();
          console.error(`[CDC Cron] Failed for project ${project.id}:`, errText);
          continue;
        }

        // Mark as generated so we don't re-process
        await supabase
          .from("projects")
          .update({
            discovery_data: {
              ...discoveryData,
              cdc_generated: true,
              cdc_generated_at: now.toISOString(),
            },
          })
          .eq("id", project.id);

        // Notify the client
        if (project.client_id) {
          await supabase.from("notifications").insert({
            user_id: project.client_id,
            type: "document_ready",
            title: "Votre Cahier des Charges est prêt ! 🎉",
            body: `Le CDC pour "${project.name}" a été généré et est disponible dans vos documents.`,
            project_id: project.id,
            link: "/client/documents",
          });
        }

        processed++;
        console.log(`[CDC Cron] Successfully generated CDC for project ${project.id}`);
      } catch (genErr) {
        console.error(`[CDC Cron] Error generating CDC for ${project.id}:`, genErr);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed,
        skipped,
        total: (projects || []).length,
        timestamp: now.toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("[CDC Cron] Fatal error:", e);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
