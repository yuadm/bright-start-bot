import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit2, Save, X, Trash2, GripVertical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EmergencySetting {
  id: string;
  setting_type: string;
  value: string;
  is_active: boolean;
  display_order: number;
}

export function ApplicationEmergencySettings() {
  const [relationships, setRelationships] = useState<EmergencySetting[]>([]);
  const [howHeard, setHowHeard] = useState<EmergencySetting[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<EmergencySetting>>({});
  const [newItemForm, setNewItemForm] = useState<{ type: string; value: string }>({ type: '', value: '' });
  const [showNewForm, setShowNewForm] = useState<{ relationships: boolean; how_heard: boolean }>({ 
    relationships: false, 
    how_heard: false 
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('application_emergency_settings')
        .select('*')
        .order('setting_type, display_order');

      if (error) throw error;
      
      const relationshipData = data?.filter(item => item.setting_type === 'relationship') || [];
      const howHeardData = data?.filter(item => item.setting_type === 'how_heard') || [];
      
      setRelationships(relationshipData);
      setHowHeard(howHeardData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch emergency contact settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleEdit = (setting: EmergencySetting) => {
    setEditingId(setting.id);
    setEditForm(setting);
  };

  const handleSave = async () => {
    if (!editingId || !editForm) return;

    try {
      const { error } = await supabase
        .from('application_emergency_settings')
        .update({
          value: editForm.value,
          is_active: editForm.is_active,
          display_order: editForm.display_order,
        })
        .eq('id', editingId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Setting updated successfully",
      });

      setEditingId(null);
      setEditForm({});
      fetchSettings();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update setting",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('application_emergency_settings')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Setting deleted successfully",
      });

      fetchSettings();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete setting",
        variant: "destructive",
      });
    }
  };

  const handleAddNew = async (settingType: string) => {
    if (!newItemForm.value.trim()) return;

    try {
      const currentItems = settingType === 'relationship' ? relationships : howHeard;
      const maxOrder = Math.max(...currentItems.map(item => item.display_order), 0);

      const { error } = await supabase
        .from('application_emergency_settings')
        .insert({
          setting_type: settingType,
          value: newItemForm.value.trim(),
          display_order: maxOrder + 1,
          is_active: true,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "New setting added successfully",
      });

      setNewItemForm({ type: '', value: '' });
      setShowNewForm({ ...showNewForm, [settingType]: false });
      fetchSettings();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to add new setting",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const renderSettingsList = (settings: EmergencySetting[], type: string) => (
    <div className="space-y-3">
      {settings.map((setting) => (
        <Card key={setting.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  {editingId === setting.id ? (
                    <div className="flex items-center space-x-2">
                      <Input
                        value={editForm.value || ''}
                        onChange={(e) => setEditForm({ ...editForm, value: e.target.value })}
                        className="h-8"
                      />
                      <Input
                        type="number"
                        value={editForm.display_order || 0}
                        onChange={(e) => setEditForm({ ...editForm, display_order: parseInt(e.target.value) })}
                        className="h-8 w-20"
                        min="0"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{setting.value}</span>
                      <Badge variant="outline" className="text-xs">
                        Order: {setting.display_order}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {editingId === setting.id ? (
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={editForm.is_active || false}
                      onCheckedChange={(checked) => setEditForm({ ...editForm, is_active: checked })}
                    />
                    <Button size="sm" onClick={handleSave}>
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleCancel}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Badge variant={setting.is_active ? "default" : "secondary"}>
                      {setting.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <Button size="sm" variant="outline" onClick={() => handleEdit(setting)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(setting.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {showNewForm[type as keyof typeof showNewForm] ? (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Enter new option"
                value={newItemForm.value}
                onChange={(e) => setNewItemForm({ ...newItemForm, value: e.target.value })}
              />
              <Button size="sm" onClick={() => handleAddNew(type)}>
                <Save className="h-4 w-4" />
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setShowNewForm({ ...showNewForm, [type]: false })}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowNewForm({ ...showNewForm, [type]: true })}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Option
        </Button>
      )}
    </div>
  );

  if (loading) {
    return <div className="text-center py-8">Loading emergency contact settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Emergency Contact Settings</h3>
        <p className="text-muted-foreground">
          Manage relationship types and "How did you hear about us" options for the emergency contact step.
        </p>
      </div>

      <Tabs defaultValue="relationships" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="relationships">Relationship Types</TabsTrigger>
          <TabsTrigger value="how_heard">How Did You Hear</TabsTrigger>
        </TabsList>
        
        <TabsContent value="relationships" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Relationship Options</CardTitle>
              <CardDescription>
                Configure the relationship options available in the emergency contact form.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderSettingsList(relationships, 'relationship')}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="how_heard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>How Did You Hear About Us</CardTitle>
              <CardDescription>
                Configure the options for how applicants heard about your company.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderSettingsList(howHeard, 'how_heard')}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}