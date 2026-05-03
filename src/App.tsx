import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemeProvider } from "next-themes";
import { CookieConsent } from "@/components/CookieConsent";

// Layouts (static imports - used as wrappers)
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { ClientLayout } from "@/components/layouts/ClientLayout";
import { ConsultantLayout } from "@/components/layouts/ConsultantLayout";
import { AdminLayout } from "@/components/layouts/AdminLayout";

// Public pages (lazy)
const Index = lazy(() => import("@/pages/Index"));
const Features = lazy(() => import("@/pages/Features"));
const Pricing = lazy(() => import("@/pages/Pricing"));
const About = lazy(() => import("@/pages/About"));
const Contact = lazy(() => import("@/pages/Contact"));
const Legal = lazy(() => import("@/pages/Legal"));
const Privacy = lazy(() => import("@/pages/Privacy"));
const CGU = lazy(() => import("@/pages/CGU"));
const CGV = lazy(() => import("@/pages/CGV"));
const CookiesPage = lazy(() => import("@/pages/Cookies"));
const FAQ = lazy(() => import("@/pages/FAQ"));
const Blog = lazy(() => import("@/pages/Blog"));
const BlogArticle = lazy(() => import("@/pages/BlogArticle"));
const BrandPreview = lazy(() => import("@/pages/BrandPreview"));

// Auth pages (lazy)
const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const AuthCallback = lazy(() => import("@/pages/AuthCallback"));
const AuthHandoff = lazy(() => import("@/pages/AuthHandoff"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const Onboarding = lazy(() => import("@/pages/client/Onboarding"));
const DigitalMaturityAudit = lazy(() => import("@/pages/client/DigitalMaturityAudit"));

// Client pages (lazy)
const ClientDashboard = lazy(() => import("@/pages/client/Dashboard"));
const ClientDashboard360 = lazy(() => import("@/pages/client/Dashboard360"));
const ClientProjects = lazy(() => import("@/pages/client/Projects"));
const ProjectConversation = lazy(() => import("@/pages/client/ProjectConversation"));
const ClientDocuments = lazy(() => import("@/pages/client/Documents"));
const DocumentViewer = lazy(() => import("@/pages/client/DocumentViewer"));
const NewProject = lazy(() => import("@/pages/client/NewProject"));
const ClientProfile = lazy(() => import("@/pages/client/Profile"));
const RetrieveLovelibAudit = lazy(() => import("@/pages/client/RetrieveLovelibAudit"));
const ClaimAudit = lazy(() => import("@/pages/ClaimAudit"));
const MyAudits = lazy(() => import("@/pages/client/MyAudits"));
const AuditTransition = lazy(() => import("@/pages/client/AuditTransition"));

// Consultant pages (lazy)
const ConsultantDashboard = lazy(() => import("@/pages/consultant/Dashboard"));
const ConsultantProjects = lazy(() => import("@/pages/consultant/Projects"));
const ConsultantProjectDetail = lazy(() => import("@/pages/consultant/ProjectDetail"));
const ConsultantAnalytics = lazy(() => import("@/pages/consultant/Analytics"));
const ConsultantDocumentEditor = lazy(() => import("@/pages/consultant/DocumentEditor"));

// Admin pages (lazy)
const AdminDashboard = lazy(() => import("@/pages/admin/Dashboard"));
const AdminUsers = lazy(() => import("@/pages/admin/Users"));
const AdminSettings = lazy(() => import("@/pages/admin/Settings"));
const AdminTemplates = lazy(() => import("@/pages/admin/Templates"));
const AdminBlog = lazy(() => import("@/pages/admin/Blog"));
const AdminCRM = lazy(() => import("@/pages/admin/CRM"));
const AdminAnalytics = lazy(() => import("@/pages/admin/Analytics"));
const AdminProjectDetail = lazy(() => import("@/pages/admin/ProjectDetail"));
const AdminIntegrations = lazy(() => import("@/pages/admin/Integrations"));
const AdminSyncQueue = lazy(() => import("@/pages/admin/SyncQueue"));
const AdminScheduledActions = lazy(() => import("@/pages/admin/ScheduledActions"));
const AdminBridgeSecret = lazy(() => import("@/pages/admin/BridgeSecret"));
const AdminSsoDebug = lazy(() => import("@/pages/admin/SsoDebug"));
const AdminMarketingLeads = lazy(() => import("@/pages/admin/MarketingLeads"));

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <ErrorBoundary>
        <BrowserRouter>
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
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
              <Route path="/brand-preview" element={<BrandPreview />} />
              <Route path="/blog/:slug" element={<BlogArticle />} />
            </Route>

            {/* Auth (no layout) */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/auth/handoff" element={<AuthHandoff />} />

            {/* Public claim entry from lovelib (signed token, no auth required) */}
            <Route path="/audit/claim" element={<ClaimAudit />} />

            {/* Client - Onboarding + Audit (standalone, no sidebar) */}
            <Route path="/client/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
            <Route path="/client/projects/:id/audit" element={<ProtectedRoute><DigitalMaturityAudit /></ProtectedRoute>} />

            {/* Client */}
            <Route element={<ProtectedRoute><ClientLayout /></ProtectedRoute>}>
              <Route path="/client/dashboard" element={<ClientDashboard />} />
              <Route path="/client/360" element={<ClientDashboard360 />} />
              <Route path="/client/projects" element={<ClientProjects />} />
              <Route path="/client/projects/new" element={<NewProject />} />
              <Route path="/client/projects/:id/conversation" element={<ProjectConversation />} />
              <Route path="/client/documents" element={<ClientDocuments />} />
              <Route path="/client/documents/:id" element={<DocumentViewer />} />
              <Route path="/client/profile" element={<ClientProfile />} />
              <Route path="/client/lovelib-audit" element={<RetrieveLovelibAudit />} />
              <Route path="/client/audits" element={<MyAudits />} />
              <Route path="/client/audits/:id" element={<AuditTransition />} />
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
              <Route path="/admin/projects/:id" element={<AdminProjectDetail />} />
              <Route path="/admin/integrations" element={<AdminIntegrations />} />
              <Route path="/admin/sync-queue" element={<AdminSyncQueue />} />
              <Route path="/admin/scheduled-actions" element={<AdminScheduledActions />} />
              <Route path="/admin/bridge-secret" element={<AdminBridgeSecret />} />
              <Route path="/admin/sso-debug" element={<AdminSsoDebug />} />
              <Route path="/admin/marketing-leads" element={<AdminMarketingLeads />} />
              <Route path="/admin/logs" element={<AdminDashboard />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </BrowserRouter>
        </ErrorBoundary>
        <CookieConsent />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
  </ThemeProvider>
);

export default App;
