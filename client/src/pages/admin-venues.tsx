import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

interface AdminVenuesProps {
  onNavigate: (page: string, data?: any) => void;
  onGoBack: () => void;
}

export default function AdminVenuesPage({ onNavigate, onGoBack }: AdminVenuesProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    address: "",
    lat: "",
    lng: "",
    city: "Göteborg",
    contactEmail: "",
    contactPhone: "",
    verified: false
  });

  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all venues
  const { data: venues = [], isLoading } = useQuery({
    queryKey: ['/api/venues'],
  });

  const createVenueMutation = useMutation({
    mutationFn: async (venueData: any) => {
      const response = await apiRequest('POST', '/api/admin/venues', venueData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/venues'] });
      toast({
        title: "Venue created successfully!",
        description: "The new venue has been added to the platform.",
      });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create venue",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateVenueMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest('PATCH', `/api/admin/venues/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/venues'] });
      toast({
        title: "Venue updated successfully!",
        description: "The venue information has been updated.",
      });
      setIsEditDialogOpen(false);
      setSelectedVenue(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update venue",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteVenueMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/admin/venues/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/venues'] });
      toast({
        title: "Venue deleted successfully!",
        description: "The venue has been removed from the platform.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete venue",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      category: "",
      address: "",
      lat: "",
      lng: "",
      city: "Göteborg",
      contactEmail: "",
      contactPhone: "",
      verified: false
    });
  };

  const handleCreateVenue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.address || !formData.lat || !formData.lng) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    createVenueMutation.mutate(formData);
  };

  const handleEditVenue = (venue: any) => {
    setSelectedVenue(venue);
    setFormData({
      name: venue.name || "",
      category: venue.category || "",
      address: venue.address || "",
      lat: venue.lat || "",
      lng: venue.lng || "",
      city: venue.city || "Göteborg",
      contactEmail: venue.contactEmail || "",
      contactPhone: venue.contactPhone || "",
      verified: venue.verified || false
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateVenue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVenue) return;
    updateVenueMutation.mutate({ id: selectedVenue.id, data: formData });
  };

  const handleDeleteVenue = (id: string) => {
    if (confirm("Are you sure you want to delete this venue? This action cannot be undone.")) {
      deleteVenueMutation.mutate(id);
    }
  };

  const handleVerifyVenue = (venue: any) => {
    updateVenueMutation.mutate({ 
      id: venue.id, 
      data: { verified: !venue.verified } 
    });
  };

  const filteredVenues = (venues as any[]).filter((venue: any) => {
    const matchesSearch = venue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         venue.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || 
                         (filterStatus === "verified" && venue.verified) ||
                         (filterStatus === "unverified" && !venue.verified);
    return matchesSearch && matchesFilter;
  });

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
          <h1 className="text-xl font-display font-semibold">Venue Management</h1>
          <div className="ml-auto flex items-center space-x-2">
            <Badge variant="destructive">Admin</Badge>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="px-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search venues by name or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
              data-testid="input-search-venues"
            />
          </div>
          <div className="flex gap-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32" data-testid="select-filter-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="unverified">Unverified</SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-venue">
                  <i className="fas fa-plus mr-2"></i>
                  Add Venue
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Venue</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateVenue} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Venue Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                      data-testid="input-venue-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger data-testid="select-venue-category">
                        <SelectValue placeholder="Select category..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sports Bar">Sports Bar</SelectItem>
                        <SelectItem value="Board Game Cafe">Board Game Cafe</SelectItem>
                        <SelectItem value="Gaming Center">Gaming Center</SelectItem>
                        <SelectItem value="Pool Hall">Pool Hall</SelectItem>
                        <SelectItem value="Arcade">Arcade</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="address">Address *</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      required
                      data-testid="textarea-venue-address"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="lat">Latitude *</Label>
                      <Input
                        id="lat"
                        type="number"
                        step="any"
                        value={formData.lat}
                        onChange={(e) => setFormData(prev => ({ ...prev, lat: e.target.value }))}
                        required
                        data-testid="input-venue-lat"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lng">Longitude *</Label>
                      <Input
                        id="lng"
                        type="number"
                        step="any"
                        value={formData.lng}
                        onChange={(e) => setFormData(prev => ({ ...prev, lng: e.target.value }))}
                        required
                        data-testid="input-venue-lng"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      data-testid="input-venue-city"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                      data-testid="input-venue-email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactPhone">Contact Phone</Label>
                    <Input
                      id="contactPhone"
                      value={formData.contactPhone}
                      onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                      data-testid="input-venue-phone"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="verified"
                      checked={formData.verified}
                      onChange={(e) => setFormData(prev => ({ ...prev, verified: e.target.checked }))}
                      data-testid="checkbox-venue-verified"
                    />
                    <Label htmlFor="verified">Mark as verified</Label>
                  </div>
                  <div className="flex space-x-2 pt-4">
                    <Button type="button" variant="secondary" onClick={() => setIsCreateDialogOpen(false)} className="flex-1">
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createVenueMutation.isPending} className="flex-1" data-testid="button-submit-venue">
                      {createVenueMutation.isPending ? "Creating..." : "Create Venue"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Venues List */}
      <div className="px-4">
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <i className="fas fa-spinner fa-spin text-2xl text-muted-foreground mb-4"></i>
              <p className="text-muted-foreground">Loading venues...</p>
            </div>
          ) : filteredVenues.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <i className="fas fa-map-marker-alt text-4xl text-muted-foreground mb-4"></i>
                <h3 className="text-lg font-semibold mb-2">No venues found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? "Try adjusting your search terms." : "Get started by adding your first venue."}
                </p>
                {!searchTerm && (
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <i className="fas fa-plus mr-2"></i>
                    Add First Venue
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredVenues.map((venue: any) => (
              <Card key={venue.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold" data-testid={`text-venue-name-${venue.id}`}>
                          {venue.name}
                        </h3>
                        <Badge 
                          variant={venue.verified ? "default" : "secondary"}
                          data-testid={`badge-venue-status-${venue.id}`}
                        >
                          {venue.verified ? "Verified" : "Unverified"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2" data-testid={`text-venue-address-${venue.id}`}>
                        {venue.address}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span data-testid={`text-venue-category-${venue.id}`}>
                          <i className="fas fa-tag mr-1"></i>
                          {venue.category}
                        </span>
                        <span data-testid={`text-venue-city-${venue.id}`}>
                          <i className="fas fa-map-marker-alt mr-1"></i>
                          {venue.city}
                        </span>
                        {venue.rating && (
                          <span data-testid={`text-venue-rating-${venue.id}`}>
                            <i className="fas fa-star mr-1 text-yellow-500"></i>
                            {venue.rating}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleVerifyVenue(venue)}
                      disabled={updateVenueMutation.isPending}
                      data-testid={`button-toggle-verify-${venue.id}`}
                    >
                      <i className={`fas ${venue.verified ? 'fa-times' : 'fa-check'} mr-1`}></i>
                      {venue.verified ? 'Unverify' : 'Verify'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditVenue(venue)}
                      data-testid={`button-edit-venue-${venue.id}`}
                    >
                      <i className="fas fa-edit mr-1"></i>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteVenue(venue.id)}
                      disabled={deleteVenueMutation.isPending}
                      className="text-destructive hover:text-destructive"
                      data-testid={`button-delete-venue-${venue.id}`}
                    >
                      <i className="fas fa-trash mr-1"></i>
                      Delete
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
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Venue</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateVenue} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Venue Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
                data-testid="input-edit-venue-name"
              />
            </div>
            <div>
              <Label htmlFor="edit-category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger data-testid="select-edit-venue-category">
                  <SelectValue placeholder="Select category..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sports Bar">Sports Bar</SelectItem>
                  <SelectItem value="Board Game Cafe">Board Game Cafe</SelectItem>
                  <SelectItem value="Gaming Center">Gaming Center</SelectItem>
                  <SelectItem value="Pool Hall">Pool Hall</SelectItem>
                  <SelectItem value="Arcade">Arcade</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-address">Address *</Label>
              <Textarea
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                required
                data-testid="textarea-edit-venue-address"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-lat">Latitude *</Label>
                <Input
                  id="edit-lat"
                  type="number"
                  step="any"
                  value={formData.lat}
                  onChange={(e) => setFormData(prev => ({ ...prev, lat: e.target.value }))}
                  required
                  data-testid="input-edit-venue-lat"
                />
              </div>
              <div>
                <Label htmlFor="edit-lng">Longitude *</Label>
                <Input
                  id="edit-lng"
                  type="number"
                  step="any"
                  value={formData.lng}
                  onChange={(e) => setFormData(prev => ({ ...prev, lng: e.target.value }))}
                  required
                  data-testid="input-edit-venue-lng"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-city">City</Label>
              <Input
                id="edit-city"
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                data-testid="input-edit-venue-city"
              />
            </div>
            <div>
              <Label htmlFor="edit-contactEmail">Contact Email</Label>
              <Input
                id="edit-contactEmail"
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                data-testid="input-edit-venue-email"
              />
            </div>
            <div>
              <Label htmlFor="edit-contactPhone">Contact Phone</Label>
              <Input
                id="edit-contactPhone"
                value={formData.contactPhone}
                onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                data-testid="input-edit-venue-phone"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-verified"
                checked={formData.verified}
                onChange={(e) => setFormData(prev => ({ ...prev, verified: e.target.checked }))}
                data-testid="checkbox-edit-venue-verified"
              />
              <Label htmlFor="edit-verified">Mark as verified</Label>
            </div>
            <div className="flex space-x-2 pt-4">
              <Button type="button" variant="secondary" onClick={() => setIsEditDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={updateVenueMutation.isPending} className="flex-1" data-testid="button-update-venue">
                {updateVenueMutation.isPending ? "Updating..." : "Update Venue"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}