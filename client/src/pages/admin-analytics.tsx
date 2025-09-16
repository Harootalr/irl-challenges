import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, MapPin, Trophy, TrendingUp, Calendar, Star } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

export default function AdminAnalytics() {
  const { data: user } = useQuery({
    queryKey: ['/api/auth/me'],
  });

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['/api/admin/analytics'],
    enabled: (user as any)?.role === 'super_admin',
  });

  if ((user as any)?.role !== 'super_admin') {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Access denied. Admin privileges required.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || !analytics) {
    return (
      <div className="container mx-auto p-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Platform Analytics</h1>
          <p className="text-muted-foreground">Real-time insights and platform metrics</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-muted-foreground">Total Users</span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold" data-testid="metric-total-users">
                {(analytics as any)?.users?.total?.toLocaleString() || '0'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                +{(analytics as any)?.users?.newThisMonth || 0} new this month
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-muted-foreground">Venues</span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold" data-testid="metric-total-venues">
                {(analytics as any)?.venues?.total?.toLocaleString() || '0'}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Progress 
                  value={((analytics as any)?.venues?.verified / Math.max((analytics as any)?.venues?.total || 1, 1)) * 100} 
                  className="flex-1 h-2" 
                />
                <span className="text-xs text-muted-foreground">
                  {(analytics as any)?.venues?.verified || 0} verified
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-yellow-600" />
              <span className="text-sm font-medium text-muted-foreground">Challenges</span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold" data-testid="metric-total-challenges">
                {(analytics as any)?.challenges?.total?.toLocaleString() || '0'}
              </div>
              <div className="flex gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {(analytics as any)?.challenges?.active || 0} active
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {(analytics as any)?.challenges?.completed || 0} completed
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium text-muted-foreground">Success Rate</span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold" data-testid="metric-success-rate">
                {Math.round(((analytics as any)?.challenges?.completed || 0) / Math.max((analytics as any)?.challenges?.total || 1, 1) * 100)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Challenge completion
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Daily Activity (Last 30 Days)
            </CardTitle>
            <CardDescription>Number of challenges created each day</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={(analytics as any)?.dailyActivity || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value) => [value, 'Challenges']}
                />
                <Line 
                  type="monotone" 
                  dataKey="challenges" 
                  stroke="#0088FE" 
                  strokeWidth={2}
                  dot={{ fill: '#0088FE', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Popular Games */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Popular Games
            </CardTitle>
            <CardDescription>Most played game types</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={(analytics as any)?.popularGames || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="preset" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => [value, 'Challenges']} />
                <Bar 
                  dataKey="count" 
                  fill="#00C49F"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Challenge Status Distribution</CardTitle>
          <CardDescription>Current state of all challenges on the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Active Challenges</span>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm">{(analytics as any)?.challenges?.active || 0}</span>
                </div>
              </div>
              <Progress value={((analytics as any)?.challenges?.active || 0) / Math.max((analytics as any)?.challenges?.total || 1, 1) * 100} className="h-2" />
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Completed Challenges</span>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm">{(analytics as any)?.challenges?.completed || 0}</span>
                </div>
              </div>
              <Progress value={((analytics as any)?.challenges?.completed || 0) / Math.max((analytics as any)?.challenges?.total || 1, 1) * 100} className="h-2" />
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Other Status</span>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                  <span className="text-sm">
                    {Math.max(((analytics as any)?.challenges?.total || 0) - ((analytics as any)?.challenges?.active || 0) - ((analytics as any)?.challenges?.completed || 0), 0)}
                  </span>
                </div>
              </div>
              <Progress 
                value={((analytics.challenges.total - analytics.challenges.active - analytics.challenges.completed) / analytics.challenges.total) * 100} 
                className="h-2" 
              />
            </div>

            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Active', value: (analytics as any)?.challenges?.active || 0, color: '#00C49F' },
                    { name: 'Completed', value: (analytics as any)?.challenges?.completed || 0, color: '#0088FE' },
                    { name: 'Other', value: Math.max(((analytics as any)?.challenges?.total || 0) - ((analytics as any)?.challenges?.active || 0) - ((analytics as any)?.challenges?.completed || 0), 0), color: '#CCCCCC' }
                  ]}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {[
                    { name: 'Active', value: (analytics as any)?.challenges?.active || 0, color: '#00C49F' },
                    { name: 'Completed', value: (analytics as any)?.challenges?.completed || 0, color: '#0088FE' },
                    { name: 'Other', value: Math.max(((analytics as any)?.challenges?.total || 0) - ((analytics as any)?.challenges?.active || 0) - ((analytics as any)?.challenges?.completed || 0), 0), color: '#CCCCCC' }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, 'Challenges']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}