import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { GAME_ICONS, GAME_COLORS, SKILL_LEVELS, CHALLENGE_STATUS } from "@/lib/constants";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { Gamepad2 } from "lucide-react";

interface AdminChallengesProps {
  onNavigate: (page: string, data?: any) => void;
  onGoBack: () => void;
}

export default function AdminChallengesPage({ onNavigate, onGoBack }: AdminChallengesProps) {
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPreset, setFilterPreset] = useState("all");

  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all challenges
  const { data: challenges = [], isLoading } = useQuery({
    queryKey: ['/api/admin/challenges'],
    enabled: user?.role === 'super_admin',
  });

  const updateChallengeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest('PATCH', `/api/admin/challenges/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/challenges'] });
      toast({
        title: "Challenge updated successfully!",
        description: "The challenge has been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update challenge",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteChallengeMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/admin/challenges/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/challenges'] });
      toast({
        title: "Challenge deleted successfully!",
        description: "The challenge has been removed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete challenge",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleViewDetails = (challenge: any) => {
    setSelectedChallenge(challenge);
    setIsDetailsDialogOpen(true);
  };

  const handleUpdateStatus = (challengeId: string, newStatus: string) => {
    updateChallengeMutation.mutate({ id: challengeId, data: { status: newStatus } });
  };

  const handleDeleteChallenge = (id: string) => {
    if (confirm("Are you sure you want to delete this challenge? This action cannot be undone.")) {
      deleteChallengeMutation.mutate(id);
    }
  };

  const filteredChallenges = (challenges as any[]).filter((item: any) => {
    const challenge = item.challenge || item;
    const matchesSearch = challenge.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.host?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.venue?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || challenge.status === filterStatus;
    const matchesPreset = filterPreset === "all" || challenge.preset === filterPreset;
    return matchesSearch && matchesStatus && matchesPreset;
  });

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'open': return 'default';
      case 'in_progress': return 'secondary';
      case 'completed': return 'outline';
      case 'cancelled': return 'destructive';
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
          <h1 className="text-xl font-display font-semibold">Challenge Management</h1>
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
              <div className="text-2xl font-bold text-primary" data-testid="text-stat-total-challenges">
                {filteredChallenges.length}
              </div>
              <div className="text-sm text-muted-foreground">Total Challenges</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-500" data-testid="text-stat-open-challenges">
                {filteredChallenges.filter(c => (c.challenge || c).status === 'open').length}
              </div>
              <div className="text-sm text-muted-foreground">Open</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-500" data-testid="text-stat-in-progress-challenges">
                {filteredChallenges.filter(c => (c.challenge || c).status === 'in_progress').length}
              </div>
              <div className="text-sm text-muted-foreground">In Progress</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-accent" data-testid="text-stat-completed-challenges">
                {filteredChallenges.filter(c => (c.challenge || c).status === 'completed').length}
              </div>
              <div className="text-sm text-muted-foreground">Completed</div>
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
              placeholder="Search challenges by title, host, or venue..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
              data-testid="input-search-challenges"
            />
          </div>
          <div className="flex gap-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32" data-testid="select-filter-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPreset} onValueChange={setFilterPreset}>
              <SelectTrigger className="w-32" data-testid="select-filter-preset">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Games</SelectItem>
                <SelectItem value="Chess">Chess</SelectItem>
                <SelectItem value="Pool">Pool</SelectItem>
                <SelectItem value="Darts">Darts</SelectItem>
                <SelectItem value="Nintendo">Nintendo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Challenges List */}
      <div className="px-4">
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <i className="fas fa-spinner fa-spin text-2xl text-muted-foreground mb-4"></i>
              <p className="text-muted-foreground">Loading challenges...</p>
            </div>
          ) : filteredChallenges.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Gamepad2 className="w-16 h-16 text-muted-foreground mb-4 animate-slow-spin" />
                <h3 className="text-lg font-semibold mb-2">No challenges found</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? "Try adjusting your search terms." : "No challenges match the current filter."}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredChallenges.map((item: any) => {
              const challenge = item.challenge || item;
              const host = item.host;
              const venue = item.venue;
              const gameIcon = GAME_ICONS[challenge.preset] || GAME_ICONS.default;
              const gameColor = GAME_COLORS[challenge.preset] || GAME_COLORS.default;
              
              return (
                <Card key={challenge.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-4 mb-4">
                      <div className={`w-12 h-12 bg-gradient-to-br ${gameColor} rounded-lg flex items-center justify-center text-white`}>
                        <i className={`${gameIcon} text-lg`}></i>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold mb-1" data-testid={`text-challenge-title-${challenge.id}`}>
                              {challenge.title}
                            </h3>
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge 
                                variant={getStatusBadgeVariant(challenge.status)}
                                data-testid={`badge-challenge-status-${challenge.id}`}
                              >
                                {CHALLENGE_STATUS[challenge.status as keyof typeof CHALLENGE_STATUS]?.label || challenge.status}
                              </Badge>
                              <Badge variant="outline" data-testid={`badge-challenge-preset-${challenge.id}`}>
                                {challenge.preset}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground mb-3">
                          <div data-testid={`text-challenge-host-${challenge.id}`}>
                            <i className="fas fa-user mr-1"></i>
                            Host: {host?.name || "Unknown"}
                          </div>
                          <div data-testid={`text-challenge-venue-${challenge.id}`}>
                            <i className="fas fa-map-marker-alt mr-1"></i>
                            {venue?.name || "No venue"}
                          </div>
                          <div data-testid={`text-challenge-datetime-${challenge.id}`}>
                            <i className="fas fa-calendar mr-1"></i>
                            {formatDateTime(challenge.startAt)}
                          </div>
                          <div data-testid={`text-challenge-participants-${challenge.id}`}>
                            <i className="fas fa-users mr-1"></i>
                            {item.participantCount || 0}/{challenge.maxParticipants} players
                          </div>
                        </div>
                        {challenge.description && (
                          <p className="text-sm text-muted-foreground mb-3" data-testid={`text-challenge-description-${challenge.id}`}>
                            {challenge.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 flex-wrap gap-2">
                      <Select 
                        value={challenge.status} 
                        onValueChange={(value) => handleUpdateStatus(challenge.id, value)}
                        disabled={updateChallengeMutation.isPending}
                      >
                        <SelectTrigger className="w-32" data-testid={`select-challenge-status-${challenge.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleViewDetails(item)}
                        data-testid={`button-view-challenge-${challenge.id}`}
                      >
                        <i className="fas fa-eye mr-1"></i>
                        View Details
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onNavigate('challenge-detail', challenge)}
                        data-testid={`button-open-challenge-${challenge.id}`}
                      >
                        <i className="fas fa-external-link-alt mr-1"></i>
                        Open
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteChallenge(challenge.id)}
                        disabled={deleteChallengeMutation.isPending}
                        className="text-destructive hover:text-destructive"
                        data-testid={`button-delete-challenge-${challenge.id}`}
                      >
                        <i className="fas fa-trash mr-1"></i>
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Challenge Details</DialogTitle>
          </DialogHeader>
          {selectedChallenge && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Title</Label>
                  <p className="font-medium" data-testid="dialog-challenge-title">
                    {(selectedChallenge.challenge || selectedChallenge).title}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Game</Label>
                  <p data-testid="dialog-challenge-preset">
                    {(selectedChallenge.challenge || selectedChallenge).preset}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <Badge variant={getStatusBadgeVariant((selectedChallenge.challenge || selectedChallenge).status)}>
                    {CHALLENGE_STATUS[(selectedChallenge.challenge || selectedChallenge).status as keyof typeof CHALLENGE_STATUS]?.label || (selectedChallenge.challenge || selectedChallenge).status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Skill Level</Label>
                  <p data-testid="dialog-challenge-skill">
                    {SKILL_LEVELS[(selectedChallenge.challenge || selectedChallenge).skillLevel as keyof typeof SKILL_LEVELS]?.label || (selectedChallenge.challenge || selectedChallenge).skillLevel}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Start Time</Label>
                  <p data-testid="dialog-challenge-start">
                    {formatDateTime((selectedChallenge.challenge || selectedChallenge).startAt)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Participants</Label>
                  <p data-testid="dialog-challenge-participants">
                    {selectedChallenge.participantCount || 0}/{(selectedChallenge.challenge || selectedChallenge).maxParticipants}
                  </p>
                </div>
              </div>
              
              {(selectedChallenge.challenge || selectedChallenge).description && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                  <p className="mt-1" data-testid="dialog-challenge-description">
                    {(selectedChallenge.challenge || selectedChallenge).description}
                  </p>
                </div>
              )}

              {selectedChallenge.host && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Host Information</Label>
                  <div className="flex items-center space-x-3 mt-1 p-3 bg-muted rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-medium">
                      {selectedChallenge.host.name?.slice(0, 2)?.toUpperCase() || "??"}
                    </div>
                    <div>
                      <div className="font-medium" data-testid="dialog-host-name">
                        {selectedChallenge.host.name}
                      </div>
                      <div className="text-sm text-muted-foreground" data-testid="dialog-host-email">
                        {selectedChallenge.host.email}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedChallenge.venue && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Venue Information</Label>
                  <div className="mt-1 p-3 bg-muted rounded-lg">
                    <div className="font-medium" data-testid="dialog-venue-name">
                      {selectedChallenge.venue.name}
                    </div>
                    <div className="text-sm text-muted-foreground" data-testid="dialog-venue-address">
                      {selectedChallenge.venue.address}
                    </div>
                    <div className="text-sm text-muted-foreground" data-testid="dialog-venue-category">
                      {selectedChallenge.venue.category} • {selectedChallenge.venue.city}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex space-x-2 pt-4">
                <Button 
                  onClick={() => onNavigate('challenge-detail', selectedChallenge.challenge || selectedChallenge)} 
                  className="flex-1"
                  data-testid="button-open-challenge-detail"
                >
                  <i className="fas fa-external-link-alt mr-2"></i>
                  Open Challenge
                </Button>
                <Button variant="secondary" onClick={() => setIsDetailsDialogOpen(false)} className="flex-1">
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}