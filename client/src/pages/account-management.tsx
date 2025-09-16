import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";

interface AccountManagementProps {
  onNavigate: (page: string, data?: any) => void;
  onGoBack: () => void;
}

export default function AccountManagementPage({ onNavigate, onGoBack }: AccountManagementProps) {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [confirmText, setConfirmText] = useState("");
  const [acknowledgeWarnings, setAcknowledgeWarnings] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      // In a real app, this would call a DELETE endpoint
      const response = await apiRequest('DELETE', `/api/users/${user?.id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Account deleted",
        description: "Your account has been permanently deleted.",
      });
      logout();
    },
    onError: (error: any) => {
      toast({
        title: "Deletion failed",
        description: error.message || "Failed to delete account. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsDeleting(false);
    },
  });

  const handleDeleteAccount = () => {
    if (!acknowledgeWarnings) {
      toast({
        title: "Please acknowledge the warnings",
        description: "You must acknowledge that you understand the consequences.",
        variant: "destructive",
      });
      return;
    }

    if (confirmText !== "DELETE MY ACCOUNT") {
      toast({
        title: "Confirmation text incorrect",
        description: "Please type 'DELETE MY ACCOUNT' exactly as shown.",
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(true);
    deleteAccountMutation.mutate();
  };

  const handleDataDownload = () => {
    // In a real app, this would generate and download user data
    toast({
      title: "Data export requested",
      description: "Your data export will be emailed to you within 24 hours.",
    });
  };

  const isConfirmationValid = confirmText === "DELETE MY ACCOUNT" && acknowledgeWarnings;

  return (
    <section className="space-y-6 pb-20">
      {/* Header */}
      <div className="px-4 pt-4">
        <div className="flex items-center mb-4">
          <Button variant="ghost" size="sm" className="mr-3" onClick={onGoBack} data-testid="button-go-back">
            <i className="fas fa-arrow-left"></i>
          </Button>
          <h1 className="text-xl font-display font-semibold">Account Management</h1>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Data Export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <i className="fas fa-download text-white text-sm"></i>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Download Your Data</h3>
                <p className="text-sm text-muted-foreground">Get a copy of all your personal data</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Request a download of all your personal data including profile information, 
              challenge history, messages, and game statistics.
            </p>
            <Button 
              onClick={handleDataDownload}
              className="w-full"
              data-testid="button-download-data"
            >
              <i className="fas fa-download mr-2"></i>
              Request Data Download
            </Button>
          </CardContent>
        </Card>

        {/* Account Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                <i className="fas fa-chart-bar text-white text-sm"></i>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Account Statistics</h3>
                <p className="text-sm text-muted-foreground">Overview of your account data</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">47</div>
                <div className="text-xs text-muted-foreground">Challenges Played</div>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-accent">12</div>
                <div className="text-xs text-muted-foreground">Messages Sent</div>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-secondary">3</div>
                <div className="text-xs text-muted-foreground">Venues Visited</div>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">89</div>
                <div className="text-xs text-muted-foreground">Days Active</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Deletion */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-destructive">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                <i className="fas fa-exclamation-triangle text-white text-sm"></i>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Delete Account</h3>
                <p className="text-sm text-muted-foreground">Permanently remove your account and all data</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-destructive/50">
              <i className="fas fa-exclamation-triangle text-destructive"></i>
              <AlertDescription>
                <strong>Warning:</strong> This action cannot be undone. All your data including profile, 
                challenges, messages, and statistics will be permanently deleted.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-sm mb-2">What will be deleted:</h4>
                <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                  <li>• Your profile and personal information</li>
                  <li>• All challenge history and statistics</li>
                  <li>• Messages and chat history</li>
                  <li>• Reviews and ratings</li>
                  <li>• Account settings and preferences</li>
                </ul>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="acknowledge-warnings"
                    checked={acknowledgeWarnings}
                    onCheckedChange={(checked) => setAcknowledgeWarnings(checked as boolean)}
                    data-testid="checkbox-acknowledge-warnings"
                  />
                  <Label htmlFor="acknowledge-warnings" className="text-sm leading-relaxed">
                    I understand that deleting my account is permanent and cannot be undone. 
                    All my data will be permanently removed from the system.
                  </Label>
                </div>

                <div>
                  <Label htmlFor="confirm-text" className="text-sm font-medium">
                    Type "DELETE MY ACCOUNT" to confirm:
                  </Label>
                  <Input
                    id="confirm-text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="DELETE MY ACCOUNT"
                    className="mt-2"
                    data-testid="input-confirm-delete"
                  />
                </div>
              </div>

              <Button
                variant="destructive"
                className="w-full"
                onClick={handleDeleteAccount}
                disabled={!isConfirmationValid || isDeleting}
                data-testid="button-delete-account"
              >
                {isDeleting ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Deleting Account...
                  </>
                ) : (
                  <>
                    <i className="fas fa-trash-alt mr-2"></i>
                    Delete My Account Permanently
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}