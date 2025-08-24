import { useState, useEffect } from 'react';
import { Availability } from '../types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface AvailabilityStepProps {
  data: Availability;
  updateData: (field: keyof Availability, value: string | Record<string, string[]>) => void;
}

interface TimeSlot {
  id: string;
  name: string;
  label: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

const DAYS_OF_WEEK = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

export function AvailabilityStep({ data, updateData }: AvailabilityStepProps) {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTimeSlots();
  }, []);

  const fetchTimeSlots = async () => {
    try {
      const { data: slotsData, error } = await supabase
        .from('application_shift_settings')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      setTimeSlots(slotsData || []);
    } catch (error) {
      console.error('Error fetching time slots:', error);
      setTimeSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDayToggle = (timeSlotId: string, day: string, checked: boolean) => {
    const currentTimeSlots = data.timeSlots || {};
    const currentDays = currentTimeSlots[timeSlotId] || [];
    
    let updatedDays: string[];
    if (checked) {
      updatedDays = [...currentDays, day];
    } else {
      updatedDays = currentDays.filter(d => d !== day);
    }
    
    const updatedTimeSlots = {
      ...currentTimeSlots,
      [timeSlotId]: updatedDays
    };
    
    updateData('timeSlots', updatedTimeSlots);
  };

  if (loading) {
    return <div>Loading time slot options...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Availability</h3>
        <p className="text-muted-foreground mb-6">Please Specify What Days And Time You Are Available To Work (You May Choose More Than One Shift Pattern).</p>
      </div>

      <div className="space-y-6">
        {timeSlots.map(timeSlot => (
          <div key={timeSlot.id} className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="min-w-0 flex-1">
                <h4 className="font-medium text-foreground">{timeSlot.label}</h4>
              </div>
              <div className="flex-shrink-0">
                <span className="inline-flex items-center px-3 py-1 rounded-md bg-muted text-sm font-medium text-muted-foreground">
                  {timeSlot.start_time} - {timeSlot.end_time}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {DAYS_OF_WEEK.map(day => (
                <div key={`${timeSlot.id}-${day}`} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${timeSlot.id}-${day}`}
                    checked={data.timeSlots?.[timeSlot.id]?.includes(day) || false}
                    onCheckedChange={(checked) => handleDayToggle(timeSlot.id, day, checked === true)}
                  />
                  <Label 
                    htmlFor={`${timeSlot.id}-${day}`} 
                    className="text-sm font-medium cursor-pointer"
                  >
                    {day}
                  </Label>
                </div>
              ))}
            </div>
            
            {timeSlot.id !== timeSlots[timeSlots.length - 1]?.id && (
              <div className="border-b border-border"></div>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="hoursPerWeek">How many hours per week are you willing to work? *</Label>
          <Input
            id="hoursPerWeek"
            type="number"
            value={data.hoursPerWeek}
            onChange={(e) => updateData('hoursPerWeek', e.target.value)}
            placeholder="Hours"
            min="1"
            max="168"
            required
          />
        </div>

        <div>
          <Label htmlFor="hasRightToWork">Do you have current right to live and work in the UK? *</Label>
          <Select value={data.hasRightToWork} onValueChange={(value) => updateData('hasRightToWork', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}