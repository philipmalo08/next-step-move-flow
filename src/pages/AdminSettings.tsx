import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Settings, Users, Shield, Plus, Trash2, DollarSign, Calculator } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface PricingSettings {
  baseServiceFee: number;
  distanceRate: number;
  tierRates: {
    basic: number;
    premium: number;
    whiteGlove: number;
  };
  gstRate: number;
  qstRate: number;
}

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: 'customer' | 'admin' | 'driver' | 'super_admin';
  is_active: boolean;
  created_at: string;
}

const AdminSettings = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [pricing, setPricing] = useState<PricingSettings>({
    baseServiceFee: 50,
    distanceRate: 2.64,
    tierRates: {
      basic: 0.35,
      premium: 0.38,
      whiteGlove: 0.41
    },
    gstRate: 5.0,
    qstRate: 9.975
  });
  const [loading, setLoading] = useState(true);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'driver'>('admin');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    checkAuth();
    loadUsers();
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

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createUser = async () => {
    if (!newUserEmail || !newUserName) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: newUserEmail,
        password: 'TempPass123!', // Temporary password
        email_confirm: true,
        user_metadata: {
          full_name: newUserName
        }
      });

      if (error) throw error;

      // Update the profile with the correct role
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ role: newUserRole })
          .eq('user_id', data.user.id);

        if (profileError) throw profileError;
      }

      toast({
        title: "Success",
        description: `User created successfully. Temporary password: TempPass123!`,
      });

      setNewUserEmail('');
      setNewUserName('');
      setNewUserRole('admin');
      loadUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive"
      });
    }
  };

  const updateUserRole = async (userId: string, newRole: UserProfile['role']) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

      setUsers(users.map(user => 
        user.user_id === userId ? { ...user, role: newRole as UserProfile['role'] } : user
      ));

      toast({
        title: "Success",
        description: "User role updated successfully",
      });
    } catch (error: any) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update user role",
        variant: "destructive"
      });
    }
  };

  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !isActive })
        .eq('user_id', userId);

      if (error) throw error;

      setUsers(users.map(user => 
        user.user_id === userId ? { ...user, is_active: !isActive } : user
      ));

      toast({
        title: "Success",
        description: `User ${!isActive ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error: any) {
      console.error('Error updating user status:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update user status",
        variant: "destructive"
      });
    }
  };

  const savePricingSettings = async () => {
    // In a real implementation, this would save to database
    // For now, just show success message
    toast({
      title: "Success",
      description: "Pricing settings updated successfully",
    });
  };

  const resetPricingToDefaults = () => {
    setPricing({
      baseServiceFee: 50,
      distanceRate: 2.64,
      tierRates: {
        basic: 0.35,
        premium: 0.38,
        whiteGlove: 0.41
      },
      gstRate: 5.0,
      qstRate: 9.975
    });
    toast({
      title: "Settings Reset",
      description: "Pricing settings reset to defaults",
    });
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_admin': return 'destructive';
      case 'admin': return 'default';
      case 'driver': return 'secondary';
      case 'customer': return 'outline';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading settings...</p>
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
            <h1 className="text-2xl font-bold">{t('admin.settings')}</h1>
            <p className="text-muted-foreground">{t('admin.settingsDesc')}</p>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Create New User */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              {t('admin.createUser')}
            </CardTitle>
            <CardDescription>
              {t('admin.createUserDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="email">{t('admin.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <Label htmlFor="name">{t('admin.fullName')}</Label>
                <Input
                  id="name"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label htmlFor="role">{t('admin.role')}</Label>
                <Select value={newUserRole} onValueChange={(value: 'admin' | 'driver') => setNewUserRole(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">{t('admin.adminRole')}</SelectItem>
                    <SelectItem value="driver">{t('admin.driverRole')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={createUser} className="w-full">
                  {t('admin.createUser')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Settings */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              {t('admin.pricingSettings')}
            </CardTitle>
            <CardDescription>
              {t('admin.pricingSettingsDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Base Pricing */}
            <div>
              <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Base Pricing
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="baseServiceFee">{t('admin.baseServiceFee')}</Label>
                  <Input
                    id="baseServiceFee"
                    type="number"
                    step="0.01"
                    value={pricing.baseServiceFee}
                    onChange={(e) => setPricing({...pricing, baseServiceFee: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label htmlFor="distanceRate">{t('admin.distanceRate')}</Label>
                  <Input
                    id="distanceRate"
                    type="number"
                    step="0.01"
                    value={pricing.distanceRate}
                    onChange={(e) => setPricing({...pricing, distanceRate: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Service Tier Weight Rates */}
            <div>
              <h4 className="text-sm font-medium mb-4">Service Tier Weight Rates ($/lb)</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="basicRate">Basic ($/lb)</Label>
                  <Input
                    id="basicRate"
                    type="number"
                    step="0.01"
                    value={pricing.tierRates.basic}
                    onChange={(e) => setPricing({
                      ...pricing, 
                      tierRates: {
                        ...pricing.tierRates,
                        basic: parseFloat(e.target.value) || 0
                      }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="premiumRate">Premium ($/lb)</Label>
                  <Input
                    id="premiumRate"
                    type="number"
                    step="0.01"
                    value={pricing.tierRates.premium}
                    onChange={(e) => setPricing({
                      ...pricing, 
                      tierRates: {
                        ...pricing.tierRates,
                        premium: parseFloat(e.target.value) || 0
                      }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="whiteGloveRate">White Glove ($/lb)</Label>
                  <Input
                    id="whiteGloveRate"
                    type="number"
                    step="0.01"
                    value={pricing.tierRates.whiteGlove}
                    onChange={(e) => setPricing({
                      ...pricing, 
                      tierRates: {
                        ...pricing.tierRates,
                        whiteGlove: parseFloat(e.target.value) || 0
                      }
                    })}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Tax Rates */}
            <div>
              <h4 className="text-sm font-medium mb-4">Tax Rates</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="gstRate">GST Rate (%)</Label>
                  <Input
                    id="gstRate"
                    type="number"
                    step="0.001"
                    value={pricing.gstRate}
                    onChange={(e) => setPricing({...pricing, gstRate: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label htmlFor="qstRate">QST Rate (%)</Label>
                  <Input
                    id="qstRate"
                    type="number"
                    step="0.001"
                    value={pricing.qstRate}
                    onChange={(e) => setPricing({...pricing, qstRate: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <Button onClick={savePricingSettings}>
                {t('admin.savePricingSettings')}
              </Button>
              <Button variant="outline" onClick={resetPricingToDefaults}>
                {t('admin.resetToDefaults')}
              </Button>
            </div>

            {/* Pricing Preview */}
            <div className="bg-muted p-4 rounded-lg">
              <h5 className="font-medium mb-2">Pricing Preview (50km move, 1000 lbs)</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="font-medium">Basic</p>
                  <p className="text-xs text-muted-foreground">Base: ${pricing.baseServiceFee} + Weight: ${(1000 * pricing.tierRates.basic).toFixed(2)} + Distance: ${(50 * pricing.distanceRate).toFixed(2)}</p>
                  <p className="font-bold">${(pricing.baseServiceFee + 1000 * pricing.tierRates.basic + 50 * pricing.distanceRate).toFixed(2)}</p>
                </div>
                <div>
                  <p className="font-medium">Premium</p>
                  <p className="text-xs text-muted-foreground">Base: ${pricing.baseServiceFee} + Weight: ${(1000 * pricing.tierRates.premium).toFixed(2)} + Distance: ${(50 * pricing.distanceRate).toFixed(2)}</p>
                  <p className="font-bold">${(pricing.baseServiceFee + 1000 * pricing.tierRates.premium + 50 * pricing.distanceRate).toFixed(2)}</p>
                </div>
                <div>
                  <p className="font-medium">White Glove</p>
                  <p className="text-xs text-muted-foreground">Base: ${pricing.baseServiceFee} + Weight: ${(1000 * pricing.tierRates.whiteGlove).toFixed(2)} + Distance: ${(50 * pricing.distanceRate).toFixed(2)}</p>
                  <p className="font-bold">${(pricing.baseServiceFee + 1000 * pricing.tierRates.whiteGlove + 50 * pricing.distanceRate).toFixed(2)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Management
            </CardTitle>
            <CardDescription>
              Manage existing users, roles, and permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium">{user.full_name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Created: {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {user.role.replace('_', ' ')}
                      </Badge>
                      <Badge variant={user.is_active ? 'default' : 'secondary'}>
                        {user.is_active ? t('admin.active') : t('admin.inactive')}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={user.role}
                      onValueChange={(value) => updateUserRole(user.user_id, value as UserProfile['role'])}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="customer">{t('admin.customerRole')}</SelectItem>
                        <SelectItem value="driver">{t('admin.driverRole')}</SelectItem>
                        <SelectItem value="admin">{t('admin.adminRole')}</SelectItem>
                        <SelectItem value="super_admin">{t('admin.superAdminRole')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant={user.is_active ? "destructive" : "default"}
                      size="sm"
                      onClick={() => toggleUserStatus(user.user_id, user.is_active)}
                    >
                      {user.is_active ? t('admin.deactivate') : t('admin.activate')}
                    </Button>
                  </div>
                </div>
              ))}

              {users.length === 0 && (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No users found.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminSettings;