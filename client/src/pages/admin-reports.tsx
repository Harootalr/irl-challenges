import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertTriangle, CheckCircle, Clock, Eye, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export default function AdminReports() {
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [selectedStatus, setSelectedStatus] = useState('pending');
  const [adminNotes, setAdminNotes] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['/api/auth/me'],
  });

  const { data: reports, isLoading } = useQuery({
    queryKey: ['/api/reports', selectedStatus],
    enabled: (user as any)?.role === 'super_admin',
  });

  const updateReportMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      return apiRequest(`/api/admin/reports/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
      toast({
        title: "Report Updated",
        description: "Report status has been updated successfully",
      });
      setSelectedReport(null);
      setAdminNotes('');
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "There was an error updating the report",
        variant: "destructive",
      });
    },
  });

  const handleStatusUpdate = (reportId: string, newStatus: string) => {
    updateReportMutation.mutate({
      id: reportId,
      updates: {
        status: newStatus,
        adminNotes: adminNotes || undefined,
        reviewedAt: new Date().toISOString(),
      },
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'dismissed': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'resolved': return <CheckCircle className="h-4 w-4" />;
      case 'dismissed': return <Eye className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Reports Management</h1>
          <p className="text-muted-foreground">Review and moderate user reports</p>
        </div>
        
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-[180px]" data-testid="filter-status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending Review</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="dismissed">Dismissed</SelectItem>
            <SelectItem value="">All Reports</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-4 bg-muted rounded w-5/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : reports?.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Reports Found</h3>
            <p className="text-muted-foreground">
              {selectedStatus ? `No ${selectedStatus} reports to review.` : 'No reports have been submitted yet.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {reports?.map((report: any) => (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(report.status)}>
                        {getStatusIcon(report.status)}
                        <span className="ml-1 capitalize">{report.status}</span>
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {report.type}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold">Report Details</h3>
                      <p className="text-muted-foreground mt-1">{report.reason}</p>
                    </div>
                    
                    {report.description && (
                      <div>
                        <h4 className="font-medium text-sm">Additional Information</h4>
                        <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
                      </div>
                    )}
                    
                    <div className="text-sm text-muted-foreground">
                      <span>Reported by: User #{report.reporterId}</span>
                      {report.reportedUserId && <span> • Against: User #{report.reportedUserId}</span>}
                      {report.challengeId && <span> • Challenge: {report.challengeId}</span>}
                    </div>

                    {report.adminNotes && (
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <h4 className="font-medium text-sm mb-1">Admin Notes</h4>
                        <p className="text-sm">{report.adminNotes}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedReport(report)}
                          data-testid={`view-report-${report.id}`}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Review Report</DialogTitle>
                          <DialogDescription>
                            Take action on this user report
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                          <div className="grid gap-4">
                            <div>
                              <label className="text-sm font-medium">Report Type</label>
                              <p className="text-sm text-muted-foreground capitalize">{report.type}</p>
                            </div>
                            
                            <div>
                              <label className="text-sm font-medium">Reason</label>
                              <p className="text-sm text-muted-foreground">{report.reason}</p>
                            </div>
                            
                            {report.description && (
                              <div>
                                <label className="text-sm font-medium">Description</label>
                                <p className="text-sm text-muted-foreground">{report.description}</p>
                              </div>
                            )}
                          </div>

                          <div>
                            <label className="text-sm font-medium">Admin Notes (Optional)</label>
                            <Textarea
                              placeholder="Add notes about your decision..."
                              value={adminNotes}
                              onChange={(e) => setAdminNotes(e.target.value)}
                              className="mt-2"
                              data-testid="admin-notes-input"
                            />
                          </div>

                          <div className="flex gap-2 pt-4">
                            <Button
                              onClick={() => handleStatusUpdate(report.id, 'resolved')}
                              disabled={updateReportMutation.isPending}
                              className="bg-green-600 hover:bg-green-700"
                              data-testid="button-resolve"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Resolve
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleStatusUpdate(report.id, 'dismissed')}
                              disabled={updateReportMutation.isPending}
                              data-testid="button-dismiss"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Dismiss
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}