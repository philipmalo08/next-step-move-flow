import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Trash2, Calendar as CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { EditableAvailabilitySlot } from '@/components/EditableAvailabilitySlot';
import { useLanguage } from '@/contexts/LanguageContext';

interface AvailabilitySlot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface BlackoutDate {
  id: string;
  date: string;
  reason: string;
}

const DAYS_OF_WEEK = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

const AdminAvailability: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [blackoutDates, setBlackoutDates] = useState<BlackoutDate[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [blackoutReason, setBlackoutReason] = useState('');
  const [isBlackoutDialogOpen, setIsBlackoutDialogOpen] = useState(false);

  // New availability slot form
  const [newSlot, setNewSlot] = useState({
    day_of_week: 1,
    start_time: '09:00',
    end_time: '17:00',
    is_available: true
  });

  useEffect(() => {
    checkAuth();
    loadAvailability();
    loadBlackoutDates();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/admin/login');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', session.user.id)
      .single();

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      navigate('/admin');
      return;
    }
  };

  const loadAvailability = async () => {
    try {
      const { data, error } = await supabase
        .from('company_availability')
        .select('*')
        .order('day_of_week')
        .order('start_time');

      if (error) throw error;
      setAvailability(data || []);
    } catch (error) {
      console.error('Error loading availability:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load availability settings"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadBlackoutDates = async () => {
    try {
      const { data, error } = await supabase
        .from('company_blackout_dates')
        .select('*')
        .order('date');

      if (error) throw error;
      setBlackoutDates(data || []);
    } catch (error) {
      console.error('Error loading blackout dates:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load blackout dates"
      });
    }
  };

  const handleAddAvailabilitySlot = async () => {
    try {
      const { error } = await supabase
        .from('company_availability')
        .insert([newSlot]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Availability slot added successfully"
      });

      loadAvailability();
      setNewSlot({
        day_of_week: 1,
        start_time: '09:00',
        end_time: '17:00',
        is_available: true
      });
    } catch (error) {
      console.error('Error adding availability slot:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add availability slot"
      });
    }
  };

  const handleToggleAvailability = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('company_availability')
        .update({ is_available: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Availability updated successfully"
      });

      loadAvailability();
    } catch (error) {
      console.error('Error updating availability:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update availability"
      });
    }
  };

  const handleDeleteAvailabilitySlot = async (id: string) => {
    try {
      const { error } = await supabase
        .from('company_availability')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Availability slot deleted successfully"
      });

      loadAvailability();
    } catch (error) {
      console.error('Error deleting availability slot:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete availability slot"
      });
    }
  };

  const handleAddBlackoutDate = async () => {
    if (!selectedDate) return;

    try {
      const { error } = await supabase
        .from('company_blackout_dates')
        .insert([{
          date: format(selectedDate, 'yyyy-MM-dd'),
          reason: blackoutReason
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Blackout date added successfully"
      });

      loadBlackoutDates();
      setSelectedDate(undefined);
      setBlackoutReason('');
      setIsBlackoutDialogOpen(false);
    } catch (error) {
      console.error('Error adding blackout date:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add blackout date"
      });
    }
  };

  const handleDeleteBlackoutDate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('company_blackout_dates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Blackout date removed successfully"
      });

      loadBlackoutDates();
    } catch (error) {
      console.error('Error removing blackout date:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove blackout date"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => navigate('/admin')} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          {t('admin.backToDashboard')}
        </Button>
        <h1 className="text-3xl font-bold">{t('admin.companyAvailability')}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Availability */}
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.weeklyAvailability')}</CardTitle>
            <CardDescription>
              {t('admin.weeklyAvailabilityDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add new slot form */}
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="font-semibold">{t('admin.addNewTimeSlot')}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="day">{t('admin.dayOfWeek')}</Label>
                  <select
                    id="day"
                    value={newSlot.day_of_week}
                    onChange={(e) => setNewSlot({ ...newSlot, day_of_week: Number(e.target.value) })}
                    className="w-full p-2 border rounded-md"
                  >
                    {DAYS_OF_WEEK.map((day, index) => (
                      <option key={index} value={index}>{day}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={newSlot.is_available}
                    onCheckedChange={(checked) => setNewSlot({ ...newSlot, is_available: checked })}
                  />
                  <Label>{newSlot.is_available ? t('admin.available') : t('admin.unavailable')}</Label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_time">{t('admin.startTime')}</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={newSlot.start_time}
                    onChange={(e) => setNewSlot({ ...newSlot, start_time: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="end_time">{t('admin.endTime')}</Label>
                  <Input
                    id="end_time"
                    type="time"
                    value={newSlot.end_time}
                    onChange={(e) => setNewSlot({ ...newSlot, end_time: e.target.value })}
                  />
                </div>
              </div>
              <Button onClick={handleAddAvailabilitySlot} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                {t('admin.addTimeSlot')}
              </Button>
            </div>

            {/* Existing slots */}
            <div className="space-y-2">
              {availability.map((slot) => (
                <EditableAvailabilitySlot 
                  key={slot.id} 
                  slot={slot} 
                  onUpdate={loadAvailability}
                  onToggle={handleToggleAvailability}
                  onDelete={handleDeleteAvailabilitySlot}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Blackout Dates */}
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.blackoutDates')}</CardTitle>
            <CardDescription>
              {t('admin.blackoutDatesDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Dialog open={isBlackoutDialogOpen} onOpenChange={setIsBlackoutDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {t('admin.addBlackoutDate')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('admin.addBlackoutDate')}</DialogTitle>
                  <DialogDescription>
                    {t('admin.addBlackoutDateDesc')}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border"
                    disabled={(date) => date < new Date()}
                  />
                  <div>
                    <Label htmlFor="reason">{t('admin.reasonOptional')}</Label>
                    <Input
                      id="reason"
                      placeholder={t('admin.reasonPlaceholder')}
                      value={blackoutReason}
                      onChange={(e) => setBlackoutReason(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleAddBlackoutDate} disabled={!selectedDate} className="w-full">
                    {t('admin.addBlackoutDate')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Existing blackout dates */}
            <div className="space-y-2">
              {blackoutDates.map((blackout) => (
                <div key={blackout.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{format(new Date(blackout.date), 'PPP')}</div>
                    {blackout.reason && (
                      <div className="text-sm text-muted-foreground">{blackout.reason}</div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteBlackoutDate(blackout.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {blackoutDates.length === 0 && (
                <div className="text-center text-muted-foreground py-6">
                  {t('admin.noBlackoutDates')}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAvailability;
