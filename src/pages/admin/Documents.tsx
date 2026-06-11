import { DocumentsManager } from "@/components/documents/DocumentsManager";

export default function AdminDocuments() {
  return (
    <DocumentsManager
      scope="all"
      fullViewPath={(id) => `/client/documents/${id}`}
      title="Documents — Vue globale"
      subtitle="Tous les documents de tous les clients et projets. Identifiez en un coup d'œil ce qui manque."
    />
  );
}
