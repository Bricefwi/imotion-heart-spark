import { DocumentsManager } from "@/components/documents/DocumentsManager";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

export default function ConsultantDocuments() {
  const { user } = useAuth();
  if (!user) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  return (
    <DocumentsManager
      scope={{ consultantId: user.id }}
      fullViewPath={(id) => `/consultant/documents/${id}/edit`}
      title="Documents de mes projets"
      subtitle="Les documents des projets dont vous êtes consultant."
    />
  );
}
