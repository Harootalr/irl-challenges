import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { ThemeProvider } from "@/components/theme-provider";
import { Gamepad2 } from "lucide-react";

import { AppHeader } from "@/components/layout/app-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { FloatingActionButton } from "@/components/layout/floating-action-button";

import AuthPage from "@/pages/auth";
import HomePage from "@/pages/home";
import ChallengesPage from "@/pages/challenges";
import VenuesPage from "@/pages/venues";
import ChallengeDetailPage from "@/pages/challenge-detail";
import VenueDetailPage from "@/pages/venue-detail";
import CreateChallengePage from "@/pages/create-challenge";
import CheckInPage from "@/pages/check-in";
import ResultsPage from "@/pages/results";
import ProfilePage from "@/pages/profile";
import EditProfilePage from "@/pages/edit-profile";
import ChangePasswordPage from "@/pages/change-password";
import NotificationSettingsPage from "@/pages/notification-settings";
import PrivacySettingsPage from "@/pages/privacy-settings";
import AccountManagementPage from "@/pages/account-management";
import AdminPage from "@/pages/admin";
import AdminVenuesPage from "@/pages/admin-venues";
import AdminUsersPage from "@/pages/admin-users";
import AdminChallengesPage from "@/pages/admin-challenges";
import AdminAnalyticsPage from "@/pages/admin-analytics";
import AdminExportPage from "@/pages/admin-export";
import AdminReportsPage from "@/pages/admin-reports";
import NotFound from "@/pages/not-found";

interface AppState {
  currentPage: string;
  pageData?: any;
  pageHistory: Array<{ page: string; data?: any }>;
}

function AppRouter() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const [appState, setAppState] = useState<AppState>({
    currentPage: 'home',
    pageData: null,
    pageHistory: [{ page: 'home' }]
  });

  const navigateTo = (page: string, data?: any) => {
    setAppState(prev => ({
      currentPage: page,
      pageData: data,
      pageHistory: [...prev.pageHistory, { page, data }]
    }));
  };

  const navigateBack = () => {
    setAppState(prev => {
      if (prev.pageHistory.length <= 1) {
        return { ...prev, currentPage: 'home', pageData: null };
      }
      const newHistory = [...prev.pageHistory];
      newHistory.pop(); // Remove current page
      const previousPage = newHistory[newHistory.length - 1];
      return {
        currentPage: previousPage.page,
        pageData: previousPage.data,
        pageHistory: newHistory
      };
    });
  };

  const handleTabChange = (tab: string) => {
    setAppState({
      currentPage: tab,
      pageData: null,
      pageHistory: [{ page: tab }]
    });
  };

  const handleCreateChallenge = () => {
    navigateTo('create-challenge');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center mx-auto mb-4">
            <Gamepad2 className="w-8 h-8 text-white animate-slow-spin" />
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  const renderPage = () => {
    const { currentPage, pageData } = appState;

    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={navigateTo} activeTab="home" />;
      case 'challenges':
        return <ChallengesPage onNavigate={navigateTo} />;
      case 'venues':
        return <VenuesPage onNavigate={navigateTo} />;
      case 'profile':
        return <ProfilePage onNavigate={navigateTo} onGoBack={navigateBack} />;
      case 'edit-profile':
        return <EditProfilePage onNavigate={navigateTo} onGoBack={navigateBack} />;
      case 'change-password':
        return <ChangePasswordPage onNavigate={navigateTo} onGoBack={navigateBack} />;
      case 'notification-settings':
        return <NotificationSettingsPage onNavigate={navigateTo} onGoBack={navigateBack} />;
      case 'privacy-settings':
        return <PrivacySettingsPage onNavigate={navigateTo} onGoBack={navigateBack} />;
      case 'account-management':
        return <AccountManagementPage onNavigate={navigateTo} onGoBack={navigateBack} />;
      case 'challenge-detail':
        return <ChallengeDetailPage challengeData={pageData} onNavigate={navigateTo} onGoBack={navigateBack} />;
      case 'venue-detail':
        return <VenueDetailPage venueData={pageData} onNavigate={navigateTo} onGoBack={navigateBack} />;
      case 'create-challenge':
        return <CreateChallengePage onNavigate={navigateTo} onGoBack={navigateBack} />;
      case 'check-in':
        return <CheckInPage challengeData={pageData} onNavigate={navigateTo} onGoBack={navigateBack} />;
      case 'results':
        return <ResultsPage challengeData={pageData} onNavigate={navigateTo} onGoBack={navigateBack} />;
      case 'admin':
        return user?.role === 'super_admin' ? 
          <AdminPage onNavigate={navigateTo} onGoBack={navigateBack} /> : 
          <NotFound />;
      case 'admin-venues':
        return user?.role === 'super_admin' ? 
          <AdminVenuesPage onNavigate={navigateTo} onGoBack={navigateBack} /> : 
          <NotFound />;
      case 'admin-users':
        return user?.role === 'super_admin' ? 
          <AdminUsersPage onNavigate={navigateTo} onGoBack={navigateBack} /> : 
          <NotFound />;
      case 'admin-challenges':
        return user?.role === 'super_admin' ? 
          <AdminChallengesPage onNavigate={navigateTo} onGoBack={navigateBack} /> : 
          <NotFound />;
      case 'admin-reports':
        return user?.role === 'super_admin' ? <AdminReportsPage /> : <NotFound />;
      case 'admin-analytics':
        return user?.role === 'super_admin' ? <AdminAnalyticsPage /> : <NotFound />;
      case 'admin-export':
        return user?.role === 'super_admin' ? <AdminExportPage /> : <NotFound />;
      default:
        return <NotFound />;
    }
  };

  const showFloatingButton = !['create-challenge', 'check-in', 'results', 'admin', 'admin-venues', 'admin-users', 'admin-challenges', 'admin-reports', 'admin-analytics', 'admin-export', 'edit-profile', 'change-password', 'notification-settings', 'privacy-settings', 'account-management'].includes(appState.currentPage);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="app-container">
        <AppHeader onNavigate={navigateTo} />
        <main className="pb-20 pt-16">
          {renderPage()}
        </main>
        {showFloatingButton && <FloatingActionButton onClick={handleCreateChallenge} />}
        <BottomNav activeTab={appState.currentPage} onTabChange={handleTabChange} />
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <AppRouter />
            <Toaster />
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
