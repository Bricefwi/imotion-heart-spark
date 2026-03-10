import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Layouts
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { ClientLayout } from "@/components/layouts/ClientLayout";
import { ConsultantLayout } from "@/components/layouts/ConsultantLayout";
import { AdminLayout } from "@/components/layouts/AdminLayout";

// Pages
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import NotFound from "@/pages/NotFound";

// Client pages
import ClientDashboard from "@/pages/client/Dashboard";
import ClientProjects from "@/pages/client/Projects";
import ProjectConversation from "@/pages/client/ProjectConversation";
import ClientDocuments from "@/pages/client/Documents";
import NewProject from "@/pages/client/NewProject";
import ClientProfile from "@/pages/client/Profile";

// Consultant pages
import ConsultantDashboard from "@/pages/consultant/Dashboard";
import ConsultantProjects from "@/pages/consultant/Projects";
import ConsultantProjectDetail from "@/pages/consultant/ProjectDetail";
import ConsultantAnalytics from "@/pages/consultant/Analytics";

// Admin pages
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminUsers from "@/pages/admin/Users";
import AdminSettings from "@/pages/admin/Settings";
import AdminTemplates from "@/pages/admin/Templates";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Index />} />
            </Route>

            {/* Auth (no layout) */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Client */}
            <Route element={<ProtectedRoute><ClientLayout /></ProtectedRoute>}>
              <Route path="/client/dashboard" element={<ClientDashboard />} />
              <Route path="/client/projects" element={<ClientProjects />} />
              <Route path="/client/projects/new" element={<NewProject />} />
              <Route path="/client/projects/:id/conversation" element={<ProjectConversation />} />
              <Route path="/client/documents" element={<ClientDocuments />} />
              <Route path="/client/profile" element={<ClientProfile />} />
            </Route>

            {/* Consultant */}
            <Route element={<ProtectedRoute requiredRole="consultant"><ConsultantLayout /></ProtectedRoute>}>
              <Route path="/consultant/dashboard" element={<ConsultantDashboard />} />
              <Route path="/consultant/projects" element={<ConsultantProjects />} />
              <Route path="/consultant/projects/:id" element={<ConsultantProjectDetail />} />
              <Route path="/consultant/clients" element={<ConsultantDashboard />} />
              <Route path="/consultant/analytics" element={<ConsultantAnalytics />} />
              <Route path="/consultant/templates" element={<ConsultantDashboard />} />
            </Route>

            {/* Admin */}
            <Route element={<ProtectedRoute requiredRole="admin"><AdminLayout /></ProtectedRoute>}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
              <Route path="/admin/templates" element={<AdminTemplates />} />
              <Route path="/admin/integrations" element={<AdminDashboard />} />
              <Route path="/admin/logs" element={<AdminDashboard />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
