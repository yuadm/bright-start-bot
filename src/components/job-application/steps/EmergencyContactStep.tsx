import { useState, useEffect } from 'react';
import { EmergencyContact } from '../types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';

interface EmergencyContactStepProps {
  data: EmergencyContact;
  updateData: (field: keyof EmergencyContact, value: string) => void;
}

interface EmergencySetting {
  id: string;
  setting_type: string;
  value: string;
  is_active: boolean;
  display_order: number;
}

export function EmergencyContactStep({ data, updateData }: EmergencyContactStepProps) {
  const [relationships, setRelationships] = useState<string[]>([]);
  const [hearAboutUs, setHearAboutUs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data: settingsData, error } = await supabase
          .from('application_emergency_settings')
          .select('*')
          .eq('is_active', true)
          .order('setting_type, display_order');

        if (error) throw error;

        const relationshipOptions = settingsData
          ?.filter(item => item.setting_type === 'relationship')
          .map(item => item.value) || [];
        
        const howHeardOptions = settingsData
          ?.filter(item => item.setting_type === 'how_heard')
          .map(item => item.value) || [];
        
        setRelationships(relationshipOptions);
        setHearAboutUs(howHeardOptions);
      } catch (error) {
        console.error('Failed to fetch emergency contact settings:', error);
        // Fallback to hardcoded values
        setRelationships(['Parent', 'Spouse', 'Partner', 'Sibling', 'Friend', 'Other Family Member', 'Other']);
        setHearAboutUs(['Job Website', 'Social Media', 'Friend/Family', 'Local Advertisement', 'Recruitment Agency', 'Walk-in', 'Other']);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  if (loading) {
    return <div className="text-center py-8">Loading emergency contact options...</div>;
  }
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Emergency Contact</h3>
        <p className="text-muted-foreground mb-6">Please provide details of someone we can contact in case of emergency.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="emergencyFullName">Full Name *</Label>
          <Input
            id="emergencyFullName"
            value={data.fullName}
            onChange={(e) => updateData('fullName', e.target.value)}
            placeholder="Full Name"
            required
          />
        </div>

        <div>
          <Label htmlFor="relationship">Relationship *</Label>
          <Select value={data.relationship} onValueChange={(value) => updateData('relationship', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Relationship" />
            </SelectTrigger>
            <SelectContent>
              {relationships.map(relationship => (
                <SelectItem key={relationship} value={relationship}>{relationship}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="emergencyContactNumber">Contact number *</Label>
          <Input
            id="emergencyContactNumber"
            value={data.contactNumber}
            onChange={(e) => updateData('contactNumber', e.target.value)}
            placeholder="Contact number"
            required
          />
        </div>

        <div>
          <Label htmlFor="howDidYouHear">How did you Hear about us? *</Label>
          <Select value={data.howDidYouHear} onValueChange={(value) => updateData('howDidYouHear', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {hearAboutUs.map(option => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}