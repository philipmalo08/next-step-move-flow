import { supabase } from '@/integrations/supabase/client';

export interface AvailabilitySlot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export interface BlackoutDate {
  id: string;
  date: string;
  reason: string;
}

export const availabilityService = {
  /**
   * Check if the company is available on a given date and time
   */
  async isDateTimeAvailable(date: Date, timeSlot: string): Promise<boolean> {
    try {
      // Check if the date is a blackout date
      const dateString = date.toISOString().split('T')[0];
      const { data: blackoutDates } = await supabase
        .from('company_blackout_dates')
        .select('id')
        .eq('date', dateString);

      if (blackoutDates && blackoutDates.length > 0) {
        return false; // Company is not available on blackout dates
      }

      // Check if the company has availability for this day of week and time
      const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
      
      // Map time slots to hour ranges
      const timeRanges = {
        'morning': { start: '08:00:00', end: '12:00:00' },
        'afternoon': { start: '12:00:00', end: '17:00:00' },
        'evening': { start: '17:00:00', end: '21:00:00' }
      };

      const timeRange = timeRanges[timeSlot as keyof typeof timeRanges];
      if (!timeRange) return false;

      // Check for any availability slot that overlaps with the requested time range
      const { data: availability } = await supabase
        .from('company_availability')
        .select('start_time, end_time, is_available')
        .eq('day_of_week', dayOfWeek)
        .eq('is_available', true);

      if (!availability || availability.length === 0) return false;

      // Check if any availability slot covers the requested time range
      return availability.some(slot => {
        const slotStart = slot.start_time;
        const slotEnd = slot.end_time;
        
        // Check if the availability slot overlaps with the requested time range
        return slotStart <= timeRange.start && slotEnd >= timeRange.end;
      });
    } catch (error) {
      console.error('Error checking availability:', error);
      return false; // Default to unavailable on error
    }
  },

  /**
   * Get all blackout dates
   */
  async getBlackoutDates(): Promise<BlackoutDate[]> {
    try {
      const { data, error } = await supabase
        .from('company_blackout_dates')
        .select('*')
        .order('date');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching blackout dates:', error);
      return [];
    }
  },

  /**
   * Get company availability schedule
   */
  async getAvailabilitySchedule(): Promise<AvailabilitySlot[]> {
    try {
      const { data, error } = await supabase
        .from('company_availability')
        .select('*')
        .order('day_of_week')
        .order('start_time');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching availability schedule:', error);
      return [];
    }
  },

  /**
   * Check if a specific date is a blackout date
   */
  async isBlackoutDate(date: Date): Promise<boolean> {
    try {
      const dateString = date.toISOString().split('T')[0];
      const { data } = await supabase
        .from('company_blackout_dates')
        .select('id')
        .eq('date', dateString);

      return data && data.length > 0;
    } catch (error) {
      console.error('Error checking blackout date:', error);
      return false;
    }
  },

  /**
   * Check if the company operates on a specific day of the week
   */
  async isOperatingDay(dayOfWeek: number): Promise<boolean> {
    try {
      const { data } = await supabase
        .from('company_availability')
        .select('is_available')
        .eq('day_of_week', dayOfWeek)
        .eq('is_available', true);

      return data && data.length > 0;
    } catch (error) {
      console.error('Error checking operating day:', error);
      return false;
    }
  }
};