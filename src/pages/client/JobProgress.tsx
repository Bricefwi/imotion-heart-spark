import { useParams, Navigate } from "react-router-dom";

export default function JobProgress() {
  const { jobId } = useParams();
  // Legacy 'jobs' table removed during Paperclip cleanup.
  // Redirect to projects list; the new orchestration UI will live under /client/projects/:id
  return <Navigate to={jobId ? `/client/projects` : "/client/projects"} replace />;
}
