import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import SearchPage from "@/pages/SearchPage";
import DonePage from "@/pages/DonePage";
import CancelledPage from "@/pages/CancelledPage";
import HistoryPage from "@/pages/HistoryPage";
import TeamPage from "@/pages/TeamPage";
import SettingsPage from "@/pages/SettingsPage";
import DemoPage from "@/pages/DemoPage";
import WorkingPage from "@/pages/WorkingPage";
import TestingPage from "@/pages/TestingPage";
import CompletedPage from "@/pages/CompletedPage";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<AppLayout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="search" element={<SearchPage />} />
                <Route path="done" element={<DonePage />} />
                <Route path="cancelled" element={<CancelledPage />} />
                <Route path="history" element={<HistoryPage />} />
                <Route path="team" element={<TeamPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="demo" element={<DemoPage />} />
                <Route path="working" element={<WorkingPage />} />
                <Route path="testing" element={<TestingPage />} />
                <Route path="completed" element={<CompletedPage />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
