import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, FileSpreadsheet, FileJson } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export default function AdminExport() {
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedFormat, setSelectedFormat] = useState<string>('csv');
  const { toast } = useToast();

  const { data: user } = useQuery({
    queryKey: ['/api/auth/me'],
  });

  const { data: analytics } = useQuery({
    queryKey: ['/api/admin/analytics'],
    enabled: (user as any)?.role === 'super_admin',
  });

  const exportTypes = [
    { value: 'users', label: 'Users', description: 'All user accounts and profiles', count: (analytics as any)?.users?.total || 0 },
    { value: 'venues', label: 'Venues', description: 'All venue locations and details', count: (analytics as any)?.venues?.total || 0 },
    { value: 'challenges', label: 'Challenges', description: 'All challenges and game sessions', count: (analytics as any)?.challenges?.total || 0 },
    { value: 'reports', label: 'Reports', description: 'All user reports and moderation data', count: 0 }
  ];

  const handleExport = async () => {
    if (!selectedType) {
      toast({
        title: "Selection Required",
        description: "Please select a data type to export",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/admin/export?type=${selectedType}&format=${selectedFormat}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${selectedType}-export.${selectedFormat}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export Successful",
        description: `${selectedType} data exported as ${selectedFormat.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "There was an error exporting the data",
        variant: "destructive",
      });
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
          <h1 className="text-3xl font-bold">Export Data</h1>
          <p className="text-muted-foreground">Download platform data for analysis and backup</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Select Data Type</CardTitle>
            <CardDescription>Choose which data you want to export</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              {exportTypes.map((type) => (
                <div
                  key={type.value}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedType === type.value 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedType(type.value)}
                  data-testid={`export-type-${type.value}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{type.label}</h3>
                      <p className="text-sm text-muted-foreground">{type.description}</p>
                    </div>
                    <Badge variant="secondary">{type.count.toLocaleString()} records</Badge>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <label className="text-sm font-medium">Export Format</label>
              <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                <SelectTrigger className="mt-2" data-testid="export-format-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4" />
                      CSV (Spreadsheet)
                    </div>
                  </SelectItem>
                  <SelectItem value="json">
                    <div className="flex items-center gap-2">
                      <FileJson className="h-4 w-4" />
                      JSON (Raw Data)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleExport} 
              className="w-full" 
              disabled={!selectedType}
              data-testid="button-export"
            >
              <Download className="h-4 w-4 mr-2" />
              Export {selectedType && `${exportTypes.find(t => t.value === selectedType)?.label}`} as {selectedFormat.toUpperCase()}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Export Information</CardTitle>
            <CardDescription>Important details about data exports</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-sm">
              <div>
                <h4 className="font-medium">CSV Format</h4>
                <p className="text-muted-foreground">Excel-compatible spreadsheet format. Great for analysis in Excel, Google Sheets, or other tools.</p>
              </div>
              
              <div>
                <h4 className="font-medium">JSON Format</h4>
                <p className="text-muted-foreground">Raw data format including all fields and nested relationships. Best for technical integration.</p>
              </div>
              
              <div>
                <h4 className="font-medium">Data Privacy</h4>
                <p className="text-muted-foreground">Sensitive data like passwords are excluded from exports. User data follows GDPR compliance.</p>
              </div>

              <div>
                <h4 className="font-medium">File Size</h4>
                <p className="text-muted-foreground">Large exports may take a few moments to process. Please be patient during download.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}