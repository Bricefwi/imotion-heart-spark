import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ThemeProvider } from "next-themes";

// Layouts
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { ClientLayout } from "@/components/layouts/ClientLayout";
import { ConsultantLayout } from "@/components/layouts/ConsultantLayout";
import { AdminLayout } from "@/components/layouts/AdminLayout";

// Public pages
import Index from "@/pages/Index";
import Features from "@/pages/Features";
import Pricing from "@/pages/Pricing";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import Legal from "@/pages/Legal";
import Privacy from "@/pages/Privacy";
import CGU from "@/pages/CGU";
import CGV from "@/pages/CGV";
import CookiesPage from "@/pages/Cookies";
import FAQ from "@/pages/FAQ";
import Blog from "@/pages/Blog";
import BlogArticle from "@/pages/BlogArticle";

// Auth pages
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import NotFound from "@/pages/NotFound";
import Onboarding from "@/pages/client/Onboarding";

// Client pages
import ClientDashboard from "@/pages/client/Dashboard";
import ClientProjects from "@/pages/client/Projects";
import ProjectConversation from "@/pages/client/ProjectConversation";
import ClientDocuments from "@/pages/client/Documents";
import DocumentViewer from "@/pages/client/DocumentViewer";
import NewProject from "@/pages/client/NewProject";
import ClientProfile from "@/pages/client/Profile";

// Consultant pages
import ConsultantDashboard from "@/pages/consultant/Dashboard";
import ConsultantProjects from "@/pages/consultant/Projects";
import ConsultantProjectDetail from "@/pages/consultant/ProjectDetail";
import ConsultantAnalytics from "@/pages/consultant/Analytics";
import ConsultantDocumentEditor from "@/pages/consultant/DocumentEditor";

// Admin pages
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminUsers from "@/pages/admin/Users";
import AdminSettings from "@/pages/admin/Settings";
import AdminTemplates from "@/pages/admin/Templates";
import AdminBlog from "@/pages/admin/Blog";
import AdminCRM from "@/pages/admin/CRM";
import AdminAnalytics from "@/pages/admin/Analytics";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public pages with shared layout */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/fonctionnalites" element={<Features />} />
              <Route path="/tarifs" element={<Pricing />} />
              <Route path="/a-propos" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/mentions-legales" element={<Legal />} />
              <Route path="/confidentialite" element={<Privacy />} />
              <Route path="/cgu" element={<CGU />} />
              <Route path="/cgv" element={<CGV />} />
              <Route path="/cookies" element={<CookiesPage />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogArticle />} />
            </Route>

            {/* Auth (no layout) */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Client - Onboarding (standalone, no sidebar) */}
            <Route path="/client/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />

            {/* Client */}
            <Route element={<ProtectedRoute><ClientLayout /></ProtectedRoute>}>
              <Route path="/client/dashboard" element={<ClientDashboard />} />
              <Route path="/client/projects" element={<ClientProjects />} />
              <Route path="/client/projects/new" element={<NewProject />} />
              <Route path="/client/projects/:id/conversation" element={<ProjectConversation />} />
              <Route path="/client/documents" element={<ClientDocuments />} />
              <Route path="/client/documents/:id" element={<DocumentViewer />} />
              <Route path="/client/profile" element={<ClientProfile />} />
            </Route>

            {/* Consultant */}
            <Route element={<ProtectedRoute requiredRole="consultant"><ConsultantLayout /></ProtectedRoute>}>
              <Route path="/consultant/dashboard" element={<ConsultantDashboard />} />
              <Route path="/consultant/projects" element={<ConsultantProjects />} />
              <Route path="/consultant/projects/:id" element={<ConsultantProjectDetail />} />
              <Route path="/consultant/documents/:id/edit" element={<ConsultantDocumentEditor />} />
              <Route path="/consultant/clients" element={<ConsultantDashboard />} />
              <Route path="/consultant/analytics" element={<ConsultantAnalytics />} />
              <Route path="/consultant/templates" element={<ConsultantDashboard />} />
            </Route>

            {/* Admin */}
            <Route element={<ProtectedRoute requiredRole="admin"><AdminLayout /></ProtectedRoute>}>
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/crm" element={<AdminCRM />} />
              <Route path="/admin/analytics" element={<AdminAnalytics />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/blog" element={<AdminBlog />} />
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
  </ThemeProvider>
);

export default App;

