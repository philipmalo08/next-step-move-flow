import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingUp, DollarSign, Calendar, Users } from 'lucide-react';

interface AnalyticsData {
  totalBookings: number;
  totalRevenue: number;
  averageBookingValue: number;
  monthlyGrowth: number;
  bookingsByMonth: Array<{ month: string; count: number; revenue: number }>;
  topServiceTiers: Array<{ tier: string; count: number; revenue: number }>;
}

const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalBookings: 0,
    totalRevenue: 0,
    averageBookingValue: 0,
    monthlyGrowth: 0,
    bookingsByMonth: [],
    topServiceTiers: []
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    loadAnalytics();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/admin/login');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      navigate('/admin');
      return;
    }
  };

  const loadAnalytics = async () => {
    try {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('created_at, total, service_tier');

      if (error) throw error;

      if (!bookings) {
        setLoading(false);
        return;
      }

      // Calculate basic metrics
      const totalBookings = bookings.length;
      const totalRevenue = bookings.reduce((sum, b) => sum + Number(b.total), 0);
      const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

      // Group by month
      const monthlyData = bookings.reduce((acc, booking) => {
        const month = new Date(booking.created_at).toISOString().slice(0, 7); // YYYY-MM
        if (!acc[month]) {
          acc[month] = { count: 0, revenue: 0 };
        }
        acc[month].count++;
        acc[month].revenue += Number(booking.total);
        return acc;
      }, {} as Record<string, { count: number; revenue: number }>);

      const bookingsByMonth = Object.entries(monthlyData)
        .map(([month, data]) => ({ month, ...data }))
        .sort((a, b) => a.month.localeCompare(b.month));

      // Calculate monthly growth
      const currentMonth = bookingsByMonth[bookingsByMonth.length - 1];
      const previousMonth = bookingsByMonth[bookingsByMonth.length - 2];
      const monthlyGrowth = previousMonth 
        ? ((currentMonth?.count || 0) - previousMonth.count) / previousMonth.count * 100
        : 0;

      // Group by service tier
      const tierData = bookings.reduce((acc, booking) => {
        const tier = booking.service_tier;
        if (!acc[tier]) {
          acc[tier] = { count: 0, revenue: 0 };
        }
        acc[tier].count++;
        acc[tier].revenue += Number(booking.total);
        return acc;
      }, {} as Record<string, { count: number; revenue: number }>);

      const topServiceTiers = Object.entries(tierData)
        .map(([tier, data]) => ({ tier, ...data }))
        .sort((a, b) => b.revenue - a.revenue);

      setAnalytics({
        totalBookings,
        totalRevenue,
        averageBookingValue,
        monthlyGrowth,
        bookingsByMonth,
        topServiceTiers
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-background">
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Analytics</h1>
            <p className="text-muted-foreground">Business insights and reports</p>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalBookings}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${analytics.totalRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Booking Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${analytics.averageBookingValue.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Growth</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.monthlyGrowth > 0 ? '+' : ''}{analytics.monthlyGrowth.toFixed(1)}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Bookings</CardTitle>
              <CardDescription>Bookings and revenue by month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.bookingsByMonth.slice(-6).map((month) => (
                  <div key={month.month} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{new Date(month.month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</p>
                      <p className="text-sm text-muted-foreground">{month.count} bookings</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${month.revenue.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Service Tiers */}
          <Card>
            <CardHeader>
              <CardTitle>Top Service Tiers</CardTitle>
              <CardDescription>Revenue by service tier</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.topServiceTiers.map((tier) => (
                  <div key={tier.tier} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium capitalize">{tier.tier.replace('_', ' ')}</p>
                      <p className="text-sm text-muted-foreground">{tier.count} bookings</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${tier.revenue.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">
                        ${(tier.revenue / tier.count).toFixed(2)} avg
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;