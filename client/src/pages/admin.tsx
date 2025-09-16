import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { Users, MapPin, Trophy, TrendingUp, Download, AlertTriangle, Gamepad2 } from 'lucide-react';

interface AdminProps {
  onNavigate: (page: string, data?: any) => void;
  onGoBack: () => void;
}

export default function AdminPage({ onNavigate, onGoBack }: AdminProps) {
  const { user } = useAuth();

  // Fetch admin stats
  const { data: challenges = [] } = useQuery({
    queryKey: ['/api/challenges', { detailed: true }],
  });

  const { data: venues = [] } = useQuery({
    queryKey: ['/api/venues'],
  });

  const { data: reports = [] } = useQuery({
    queryKey: ['/api/admin/reports'],
    enabled: user?.role === 'super_admin',
  });

  // Fetch user count from API
  const { data: users = [] } = useQuery({
    queryKey: ['/api/admin/users'],
    enabled: user?.role === 'super_admin',
  });

  // Calculate stats
  const stats = {
    totalUsers: (users as any[] || []).length,
    activeChallenges: (challenges as any[] || []).filter((c: any) => c.challenge?.status === 'open').length,
    verifiedVenues: (venues as any[] || []).filter((v: any) => v.verified).length,
    pendingReports: (reports as any[] || []).filter((r: any) => r.status === 'pending').length
  };

  if (user?.role !== 'super_admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardContent className="p-8 text-center">
            <i className="fas fa-shield-alt text-4xl text-muted-foreground mb-4"></i>
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You don't have permission to access this area.</p>
            <Button className="mt-4" onClick={onGoBack}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <section className="space-y-6 pb-20">
      {/* Header */}
      <div className="px-4 pt-4">
        <div className="flex items-center mb-4">
          <h1 className="text-xl font-display font-semibold">Admin Dashboard</h1>
          <div className="ml-auto flex items-center space-x-2">
            <Badge variant="destructive" data-testid="badge-admin-role">Admin</Badge>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="px-4">
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary" data-testid="text-stat-total-users">{stats.totalUsers}</div>
              <div className="text-sm text-muted-foreground">Total Users</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-secondary" data-testid="text-stat-active-challenges">{stats.activeChallenges}</div>
              <div className="text-sm text-muted-foreground">Active Challenges</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-accent" data-testid="text-stat-verified-venues">{stats.verifiedVenues}</div>
              <div className="text-sm text-muted-foreground">Verified Venues</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-destructive" data-testid="text-stat-pending-reports">{stats.pendingReports}</div>
              <div className="text-sm text-muted-foreground">Pending Reports</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Admin Actions */}
      <div className="px-4 space-y-4">
        
        {/* Content Moderation */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">Content Moderation</h3>
            <div className="space-y-2">
              <Button 
                variant="ghost" 
                className="w-full justify-between h-auto p-3"
                onClick={() => onNavigate('admin-reports')}
                data-testid="button-review-reports"
              >
                <div className="flex items-center space-x-3">
                  <i className="fas fa-flag text-destructive"></i>
                  <span>Review Reports</span>
                </div>
                <div className="flex items-center space-x-2">
                  {stats.pendingReports > 0 && (
                    <Badge variant="destructive" data-testid="badge-pending-reports">
                      {stats.pendingReports} pending
                    </Badge>
                  )}
                  <i className="fas fa-chevron-right text-muted-foreground"></i>
                </div>
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-between h-auto p-3"
                onClick={() => onNavigate('admin-users')}
                data-testid="button-moderate-users"
              >
                <div className="flex items-center space-x-3">
                  <i className="fas fa-users text-muted-foreground"></i>
                  <span>User Management</span>
                </div>
                <i className="fas fa-chevron-right text-muted-foreground"></i>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Venue Management */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">Venue Management</h3>
            <div className="space-y-2">
              <Button 
                variant="ghost" 
                className="w-full justify-between h-auto p-3"
                onClick={() => onNavigate('admin-venues')}
                data-testid="button-verify-venues"
              >
                <div className="flex items-center space-x-3">
                  <i className="fas fa-map-marker-alt text-primary"></i>
                  <span>Manage Venues</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="default" data-testid="badge-total-venues">{stats.verifiedVenues} verified</Badge>
                  <i className="fas fa-chevron-right text-muted-foreground"></i>
                </div>
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-between h-auto p-3"
                onClick={() => onNavigate('admin-challenges')}
                data-testid="button-manage-challenges"
              >
                <div className="flex items-center space-x-3">
                  <Gamepad2 className="w-4 h-4 text-secondary animate-slow-spin" />
                  <span>Manage Challenges</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="default" data-testid="badge-total-challenges">{stats.activeChallenges} active</Badge>
                  <i className="fas fa-chevron-right text-muted-foreground"></i>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Analytics */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">Analytics</h3>
            <div className="space-y-2">
              <Button 
                variant="ghost" 
                className="w-full justify-between h-auto p-3"
                onClick={() => onNavigate('admin-analytics')}
                data-testid="button-view-analytics"
              >
                <div className="flex items-center space-x-3">
                  <i className="fas fa-chart-line text-accent"></i>
                  <span>Platform Analytics</span>
                </div>
                <i className="fas fa-chevron-right text-muted-foreground"></i>
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-between h-auto p-3"
                onClick={() => onNavigate('admin-export')}
                data-testid="button-export-data"
              >
                <div className="flex items-center space-x-3">
                  <i className="fas fa-download text-muted-foreground"></i>
                  <span>Export Data</span>
                </div>
                <i className="fas fa-chevron-right text-muted-foreground"></i>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">Recent Activity</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center">
                  <i className="fas fa-user-plus text-accent text-xs"></i>
                </div>
                <div className="flex-1">
                  <div>5 new users registered today</div>
                  <div className="text-muted-foreground text-xs">2 hours ago</div>
                </div>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                  <i className="fas fa-map-marker-alt text-primary text-xs"></i>
                </div>
                <div className="flex-1">
                  <div>New venue verification request</div>
                  <div className="text-muted-foreground text-xs">4 hours ago</div>
                </div>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-8 h-8 bg-secondary/20 rounded-full flex items-center justify-center">
                  <i className="fas fa-gamepad text-secondary text-xs"></i>
                </div>
                <div className="flex-1">
                  <div>12 new challenges created today</div>
                  <div className="text-muted-foreground text-xs">6 hours ago</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </section>
  );
}
