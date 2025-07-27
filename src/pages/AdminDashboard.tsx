import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Truck, 
  Users, 
  DollarSign, 
  MessageSquare, 
  LogOut,
  BarChart3,
  ClipboardList,
  Settings,
  Clock
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface DashboardStats {
  totalBookings: number;
  todayBookings: number;
  activeDrivers: number;
  totalRevenue: number;
  pendingTickets: number;
}

interface UserProfile {
  role: string;
  full_name: string;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    todayBookings: 0,
    activeDrivers: 0,
    totalRevenue: 0,
    pendingTickets: 0
  });
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    checkAuth();
    loadDashboardData();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/admin/login');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('user_id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin', 'driver'].includes(profile.role)) {
      navigate('/admin/login');
      return;
    }

    setUserProfile(profile);
  };

  const loadDashboardData = async () => {
    try {
      // Get bookings stats
      const { data: bookings } = await supabase
        .from('bookings')
        .select('created_at, total');

      const today = new Date().toISOString().split('T')[0];
      const todayBookings = bookings?.filter(b => 
        b.created_at.startsWith(today)
      ).length || 0;

      const totalRevenue = bookings?.reduce((sum, b) => sum + Number(b.total), 0) || 0;

      // Get active drivers
      const { data: drivers } = await supabase
        .from('drivers')
        .select('id')
        .eq('is_available', true);

      // Get pending support tickets
      const { data: tickets } = await supabase
        .from('support_tickets')
        .select('id')
        .in('status', ['open', 'in_progress']);

      setStats({
        totalBookings: bookings?.length || 0,
        todayBookings,
        activeDrivers: drivers?.length || 0,
        totalRevenue,
        pendingTickets: tickets?.length || 0
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin/login');
  };

  const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'super_admin';

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-background">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{t('admin.adminPortal')}</h1>
            <p className="text-muted-foreground">
              {t('admin.welcomeBack')}, {userProfile?.full_name}
              <Badge variant="secondary" className="ml-2">
                {userProfile?.role}
              </Badge>
            </p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="mr-2 h-4 w-4" />
            {t('admin.logout')}
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards - Hide revenue and tickets for drivers */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('admin.totalBookings')}</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBookings}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('admin.todaysBookings')}</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayBookings}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('admin.activeDrivers')}</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeDrivers}</div>
            </CardContent>
          </Card>

          {isAdmin && (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('admin.totalRevenue')}</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('admin.pendingTickets')}</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.pendingTickets}</div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/bookings')}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ClipboardList className="mr-2 h-5 w-5" />
                {t('admin.manageBookings')}
              </CardTitle>
              <CardDescription>
                {t('admin.manageBookingsDesc')}
              </CardDescription>
            </CardHeader>
          </Card>

          {isAdmin && (
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/drivers')}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  {t('admin.driverManagement')}
                </CardTitle>
                <CardDescription>
                  {t('admin.driverManagementDesc')}
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {isAdmin && (
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/support')}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="mr-2 h-5 w-5" />
                  {t('admin.customerSupport')}
                </CardTitle>
                <CardDescription>
                  {t('admin.customerSupportDesc')}
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {isAdmin && (
            <>
              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/availability')}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="mr-2 h-5 w-5" />
                    {t('admin.companyAvailability')}
                  </CardTitle>
                  <CardDescription>
                    {t('admin.companyAvailabilityDesc')}
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/analytics')}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="mr-2 h-5 w-5" />
                    {t('admin.analytics')}
                  </CardTitle>
                  <CardDescription>
                    {t('admin.analyticsDesc')}
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/settings')}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="mr-2 h-5 w-5" />
                    {t('admin.settings')}
                  </CardTitle>
                  <CardDescription>
                    {t('admin.settingsDesc')}
                  </CardDescription>
                </CardHeader>
              </Card>
            </>
          )}

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/')}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Truck className="mr-2 h-5 w-5" />
                {t('admin.customerPortal')}
              </CardTitle>
              <CardDescription>
                {t('admin.customerPortalDesc')}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;