import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PersonalSetting {
  id: string;
  setting_type: string;
  value: string;
  is_active: boolean;
  display_order: number;
}

const SETTING_TYPES = [
  { value: 'title', label: 'Titles' },
  { value: 'borough', label: 'Boroughs' },
  { value: 'language', label: 'Languages' },
  { value: 'english_level', label: 'English Proficiency Levels' },
  { value: 'dbs_option', label: 'DBS Options' },
  { value: 'personal_care_option', label: 'Personal Care Options' },
];

export function ApplicationPersonalSettings() {
  const [settings, setSettings] = useState<PersonalSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('title');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newValue, setNewValue] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('application_personal_settings')
        .select('*')
        .order('setting_type', { ascending: true })
        .order('display_order', { ascending: true });

      if (error) throw error;
      setSettings(data || []);
    } catch (error) {
      console.error('Error fetching personal settings:', error);
      toast({
        title: "Error",
        description: "Failed to load personal settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addSetting = async () => {
    if (!newValue.trim()) return;

    try {
      const maxOrder = Math.max(
        ...settings
          .filter(s => s.setting_type === selectedType)
          .map(s => s.display_order),
        0
      );

      const { error } = await supabase
        .from('application_personal_settings')
        .insert({
          setting_type: selectedType,
          value: newValue.trim(),
          display_order: maxOrder + 1,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Setting added successfully",
      });

      setNewValue('');
      setShowAddForm(false);
      fetchSettings();
    } catch (error) {
      console.error('Error adding setting:', error);
      toast({
        title: "Error",
        description: "Failed to add setting",
        variant: "destructive",
      });
    }
  };

  const updateSetting = async (id: string, updates: Partial<PersonalSetting>) => {
    try {
      const { error } = await supabase
        .from('application_personal_settings')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Setting updated successfully",
      });

      fetchSettings();
    } catch (error) {
      console.error('Error updating setting:', error);
      toast({
        title: "Error",
        description: "Failed to update setting",
        variant: "destructive",
      });
    }
  };

  const deleteSetting = async (id: string) => {
    try {
      const { error } = await supabase
        .from('application_personal_settings')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Setting deleted successfully",
      });

      fetchSettings();
    } catch (error) {
      console.error('Error deleting setting:', error);
      toast({
        title: "Error",
        description: "Failed to delete setting",
        variant: "destructive",
      });
    }
  };

  const getFilteredSettings = () => {
    return settings.filter(s => s.setting_type === selectedType);
  };

  if (loading) {
    return <div>Loading personal settings...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Personal Information Settings
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            className="ml-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Setting
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <Label htmlFor="settingType">Setting Type:</Label>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SETTING_TYPES.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {showAddForm && (
          <Card className="p-4 bg-muted/50">
            <div className="flex items-center gap-4">
              <Input
                placeholder="Enter new value"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                className="flex-1"
              />
              <Button onClick={addSetting} disabled={!newValue.trim()}>
                <Save className="w-4 h-4 mr-2" />
                Add
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddForm(false);
                  setNewValue('');
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Value</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Display Order</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {getFilteredSettings().map((setting) => (
              <TableRow key={setting.id}>
                <TableCell>
                  {editingId === setting.id ? (
                    <Input
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          updateSetting(setting.id, { value: newValue });
                          setEditingId(null);
                          setNewValue('');
                        }
                      }}
                    />
                  ) : (
                    setting.value
                  )}
                </TableCell>
                <TableCell>
                  <Switch
                    checked={setting.is_active}
                    onCheckedChange={(checked) =>
                      updateSetting(setting.id, { is_active: checked })
                    }
                  />
                  <Badge variant={setting.is_active ? 'default' : 'secondary'} className="ml-2">
                    {setting.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={setting.display_order}
                    onChange={(e) =>
                      updateSetting(setting.id, { display_order: parseInt(e.target.value) })
                    }
                    className="w-20"
                  />
                </TableCell>
                <TableCell className="space-x-2">
                  {editingId === setting.id ? (
                    <>
                      <Button
                        size="sm"
                        onClick={() => {
                          updateSetting(setting.id, { value: newValue });
                          setEditingId(null);
                          setNewValue('');
                        }}
                      >
                        <Save className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingId(null);
                          setNewValue('');
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingId(setting.id);
                          setNewValue(setting.value);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteSetting(setting.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}