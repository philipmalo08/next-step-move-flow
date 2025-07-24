import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Trash2, Edit, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AvailabilitySlot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface EditableAvailabilitySlotProps {
  slot: AvailabilitySlot;
  onUpdate: () => void;
  onToggle: (id: string, currentStatus: boolean) => void;
  onDelete: (id: string) => void;
}

const DAYS_OF_WEEK = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

export function EditableAvailabilitySlot({ slot, onUpdate, onToggle, onDelete }: EditableAvailabilitySlotProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editedSlot, setEditedSlot] = useState({
    start_time: slot.start_time,
    end_time: slot.end_time,
    is_available: slot.is_available
  });

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('company_availability')
        .update({
          start_time: editedSlot.start_time,
          end_time: editedSlot.end_time,
          is_available: editedSlot.is_available
        })
        .eq('id', slot.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Availability slot updated successfully"
      });

      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating availability slot:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update availability slot"
      });
    }
  };

  const handleCancel = () => {
    setEditedSlot({
      start_time: slot.start_time,
      end_time: slot.end_time,
      is_available: slot.is_available
    });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="p-3 border rounded-lg bg-muted/30">
        <div className="flex items-center justify-between mb-3">
          <Badge variant="outline">{DAYS_OF_WEEK[slot.day_of_week]}</Badge>
          <div className="flex items-center space-x-2">
            <Switch
              checked={editedSlot.is_available}
              onCheckedChange={(checked) => setEditedSlot({ ...editedSlot, is_available: checked })}
            />
            <span className="text-sm">{editedSlot.is_available ? 'Available' : 'Unavailable'}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <Input
            type="time"
            value={editedSlot.start_time}
            onChange={(e) => setEditedSlot({ ...editedSlot, start_time: e.target.value })}
          />
          <Input
            type="time"
            value={editedSlot.end_time}
            onChange={(e) => setEditedSlot({ ...editedSlot, end_time: e.target.value })}
          />
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" size="sm" onClick={handleCancel}>
            <X className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={handleSave}>
            <Check className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex items-center space-x-4">
        <Badge variant="outline">{DAYS_OF_WEEK[slot.day_of_week]}</Badge>
        <span className="text-sm">{slot.start_time} - {slot.end_time}</span>
        <Badge variant={slot.is_available ? "default" : "secondary"}>
          {slot.is_available ? 'Available' : 'Unavailable'}
        </Badge>
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          checked={slot.is_available}
          onCheckedChange={() => onToggle(slot.id, slot.is_available)}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsEditing(true)}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(slot.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}