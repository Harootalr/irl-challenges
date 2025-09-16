import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

interface AdminUsersProps {
  onNavigate: (page: string, data?: any) => void;
  onGoBack: () => void;
}

export default function AdminUsersPage({ onNavigate, onGoBack }: AdminUsersProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);
  const [filterRole, setFilterRole] = useState("all");
  
  const [editData, setEditData] = useState({
    role: "",
    isVerified: false
  });

  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all users
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['/api/admin/users'],
    enabled: user?.role === 'super_admin',
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest('PATCH', `/api/admin/users/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "User updated successfully!",
        description: "The user information has been updated.",
      });
      setIsEditDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setEditData({
      role: user.role || "user",
      isVerified: user.isVerified || false
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    updateUserMutation.mutate({ id: selectedUser.id, data: editData });
  };

  const handleQuickRoleChange = (userId: string, newRole: string) => {
    updateUserMutation.mutate({ id: userId, data: { role: newRole } });
  };

  const handleQuickVerification = (userId: string, isVerified: boolean) => {
    updateUserMutation.mutate({ id: userId, data: { isVerified: !isVerified } });
  };

  // Memoized user filtering for better performance with large user lists
  const filteredUsers = useMemo(() => {
    const lowerSearchTerm = debouncedSearchTerm.toLowerCase();
    return (users as any[]).filter((user: any) => {
      const matchesSearch = user.name?.toLowerCase().includes(lowerSearchTerm) ||
                           user.email?.toLowerCase().includes(lowerSearchTerm);
      const matchesFilter = filterRole === "all" || user.role === filterRole;
      return matchesSearch && matchesFilter;
    });
  }, [users, debouncedSearchTerm, filterRole]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_admin': return 'destructive';
      case 'venue_admin': return 'default';
      default: return 'secondary';
    }
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
          <Button variant="ghost" size="sm" className="mr-3" onClick={onGoBack} data-testid="button-go-back">
            <i className="fas fa-arrow-left"></i>
          </Button>
          <h1 className="text-xl font-display font-semibold">User Management</h1>
          <div className="ml-auto flex items-center space-x-2">
            <Badge variant="destructive">Admin</Badge>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary" data-testid="text-stat-total-users">
                {filteredUsers.length}
              </div>
              <div className="text-sm text-muted-foreground">Total Users</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-secondary" data-testid="text-stat-admins">
                {filteredUsers.filter(u => u.role === 'super_admin').length}
              </div>
              <div className="text-sm text-muted-foreground">Admins</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-accent" data-testid="text-stat-verified">
                {filteredUsers.filter(u => u.isVerified).length}
              </div>
              <div className="text-sm text-muted-foreground">Verified</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-muted-foreground" data-testid="text-stat-active">
                {filteredUsers.filter(u => new Date(u.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}
              </div>
              <div className="text-sm text-muted-foreground">Recent</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
              data-testid="input-search-users"
            />
          </div>
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-40" data-testid="select-filter-role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="user">Regular Users</SelectItem>
              <SelectItem value="venue_admin">Venue Admins</SelectItem>
              <SelectItem value="super_admin">Super Admins</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Users List */}
      <div className="px-4">
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <i className="fas fa-spinner fa-spin text-2xl text-muted-foreground mb-4"></i>
              <p className="text-muted-foreground">Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <i className="fas fa-users text-4xl text-muted-foreground mb-4"></i>
                <h3 className="text-lg font-semibold mb-2">No users found</h3>
                <p className="text-muted-foreground">
                  {debouncedSearchTerm ? "Try adjusting your search terms." : "No users match the current filter."}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredUsers.map((user: any) => (
              <Card key={user.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-medium">
                        {user.name?.slice(0, 2)?.toUpperCase() || "??"}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold" data-testid={`text-user-name-${user.id}`}>
                            {user.name || "Unnamed User"}
                          </h3>
                          <Badge 
                            variant={getRoleBadgeVariant(user.role)}
                            data-testid={`badge-user-role-${user.id}`}
                          >
                            {user.role === 'super_admin' ? 'Super Admin' : 
                             user.role === 'venue_admin' ? 'Venue Admin' : 'User'}
                          </Badge>
                          {user.isVerified && (
                            <Badge variant="outline" data-testid={`badge-user-verified-${user.id}`}>
                              <i className="fas fa-check-circle mr-1"></i>
                              Verified
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-1" data-testid={`text-user-email-${user.id}`}>
                          {user.email}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <span data-testid={`text-user-joined-${user.id}`}>
                            <i className="fas fa-calendar mr-1"></i>
                            Joined {formatDate(user.createdAt)}
                          </span>
                          {user.homeCity && (
                            <span data-testid={`text-user-city-${user.id}`}>
                              <i className="fas fa-map-marker-alt mr-1"></i>
                              {user.homeCity}
                            </span>
                          )}
                          {user.ratingScore && (
                            <span data-testid={`text-user-rating-${user.id}`}>
                              <i className="fas fa-star mr-1 text-yellow-500"></i>
                              {user.ratingScore} ({user.ratingCount} ratings)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Select 
                      value={user.role} 
                      onValueChange={(value) => handleQuickRoleChange(user.id, value)}
                      disabled={updateUserMutation.isPending}
                    >
                      <SelectTrigger className="w-32" data-testid={`select-user-role-${user.id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="venue_admin">Venue Admin</SelectItem>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleQuickVerification(user.id, user.isVerified)}
                      disabled={updateUserMutation.isPending}
                      data-testid={`button-toggle-verify-user-${user.id}`}
                    >
                      <i className={`fas ${user.isVerified ? 'fa-times' : 'fa-check'} mr-1`}></i>
                      {user.isVerified ? 'Unverify' : 'Verify'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditUser(user)}
                      data-testid={`button-edit-user-${user.id}`}
                    >
                      <i className="fas fa-edit mr-1"></i>
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateUser} className="space-y-4">
            <div className="flex items-center space-x-4 p-3 bg-muted rounded-lg">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-medium">
                {selectedUser?.name?.slice(0, 2)?.toUpperCase() || "??"}
              </div>
              <div>
                <div className="font-medium">{selectedUser?.name}</div>
                <div className="text-sm text-muted-foreground">{selectedUser?.email}</div>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-role">User Role</Label>
              <Select value={editData.role} onValueChange={(value) => setEditData(prev => ({ ...prev, role: value }))}>
                <SelectTrigger data-testid="select-edit-user-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Regular User</SelectItem>
                  <SelectItem value="venue_admin">Venue Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-verified"
                checked={editData.isVerified}
                onChange={(e) => setEditData(prev => ({ ...prev, isVerified: e.target.checked }))}
                data-testid="checkbox-edit-user-verified"
              />
              <Label htmlFor="edit-verified">Account verified</Label>
            </div>
            <div className="flex space-x-2 pt-4">
              <Button type="button" variant="secondary" onClick={() => setIsEditDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={updateUserMutation.isPending} className="flex-1" data-testid="button-update-user">
                {updateUserMutation.isPending ? "Updating..." : "Update User"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}