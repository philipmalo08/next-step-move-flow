import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Search, UserPlus, Truck, Phone, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Driver {
  id: string;
  profile_id: string;
  license_number: string;
  vehicle_info: any;
  is_available: boolean;
  profiles: {
    full_name: string;
    email: string;
    phone: string;
    is_active: boolean;
  };
}

const AdminDrivers = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newDriver, setNewDriver] = useState({
    email: '',
    fullName: '',
    phone: '',
    licenseNumber: '',
    vehicleType: '',
    vehicleModel: ''
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
    loadDrivers();
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

  const loadDrivers = async () => {
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select(`
          *,
          profiles (
            full_name,
            email,
            phone,
            is_active
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDrivers(data || []);
    } catch (error) {
      console.error('Error loading drivers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load drivers',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleDriverAvailability = async (driverId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('drivers')
        .update({ is_available: !currentStatus })
        .eq('id', driverId);

      if (error) throw error;

      setDrivers(drivers.map(driver => 
        driver.id === driverId 
          ? { ...driver, is_available: !currentStatus }
          : driver
      ));

      toast({
        title: 'Success',
        description: `Driver ${!currentStatus ? 'activated' : 'deactivated'} successfully`
      });
    } catch (error) {
      console.error('Error updating driver:', error);
      toast({
        title: 'Error',
        description: 'Failed to update driver status',
        variant: 'destructive'
      });
    }
  };

  const handleAddDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('Attempting to create driver via Edge Function...');
      
      // Create user via Edge Function (uses service role key)
      const { data: createResponse, error: createError } = await supabase.functions.invoke('admin-create-user', {
        body: {
          email: newDriver.email,
          password: 'TempPass123!', // Temporary password - driver should reset
          fullName: newDriver.fullName,
          phone: newDriver.phone,
          role: 'driver'
        }
      });

      console.log('Edge Function response:', { createResponse, createError });

      if (createError) {
        console.error('Edge Function call error:', createError);
        throw new Error(`Edge Function error: ${createError.message}`);
      }

      if (!createResponse?.user) {
        console.error('No user data returned from Edge Function');
        throw new Error('No user data returned from creation');
      }

      // Get the profile ID for the driver record
      const { data: profileData, error: profileFetchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', createResponse.user.id)
        .single();

      if (profileFetchError || !profileData) {
        throw new Error('Failed to fetch user profile after creation');
      }

      // Create driver record
      const { error: driverError } = await supabase
        .from('drivers')
        .insert({
          profile_id: profileData.id,
          license_number: newDriver.licenseNumber,
          vehicle_info: {
            type: newDriver.vehicleType,
            model: newDriver.vehicleModel
          }
        });

      if (driverError) throw driverError;

      toast({
        title: 'Success',
        description: 'Driver added successfully. They should reset their password on first login.'
      });

      setIsAddDialogOpen(false);
      setNewDriver({
        email: '',
        fullName: '',
        phone: '',
        licenseNumber: '',
        vehicleType: '',
        vehicleModel: ''
      });
      loadDrivers();
    } catch (error: any) {
      console.error('Error adding driver:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add driver',
        variant: 'destructive'
      });
    }
  };

  const filteredDrivers = drivers.filter(driver =>
    driver.profiles.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.profiles.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading drivers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-background">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/admin')}
                className="flex items-center"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
              <h1 className="text-2xl font-bold">Driver Management</h1>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Driver
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Driver</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddDriver} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={newDriver.fullName}
                        onChange={(e) => setNewDriver({...newDriver, fullName: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newDriver.email}
                        onChange={(e) => setNewDriver({...newDriver, email: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={newDriver.phone}
                        onChange={(e) => setNewDriver({...newDriver, phone: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="licenseNumber">License Number</Label>
                      <Input
                        id="licenseNumber"
                        value={newDriver.licenseNumber}
                        onChange={(e) => setNewDriver({...newDriver, licenseNumber: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="vehicleType">Vehicle Type</Label>
                      <Select value={newDriver.vehicleType} onValueChange={(value) => setNewDriver({...newDriver, vehicleType: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="truck">Truck</SelectItem>
                          <SelectItem value="van">Van</SelectItem>
                          <SelectItem value="trailer">Trailer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="vehicleModel">Vehicle Model</Label>
                      <Input
                        id="vehicleModel"
                        value={newDriver.vehicleModel}
                        onChange={(e) => setNewDriver({...newDriver, vehicleModel: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Add Driver</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search drivers by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* Drivers List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDrivers.map((driver) => (
            <Card key={driver.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{driver.profiles.full_name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{driver.profiles.email}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Badge variant={driver.is_available ? "default" : "secondary"}>
                      {driver.is_available ? "Available" : "Unavailable"}
                    </Badge>
                    <Badge variant={driver.profiles.is_active ? "default" : "destructive"}>
                      {driver.profiles.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{driver.profiles.phone || 'N/A'}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      License: {driver.license_number}
                    </span>
                  </div>

                  {driver.vehicle_info && (
                    <div className="text-sm">
                      <strong>Vehicle:</strong> {driver.vehicle_info.type} - {driver.vehicle_info.model}
                    </div>
                  )}

                  <div className="flex space-x-2 mt-4">
                    <Button
                      size="sm"
                      variant={driver.is_available ? "outline" : "default"}
                      onClick={() => toggleDriverAvailability(driver.id, driver.is_available)}
                      className="flex-1"
                    >
                      {driver.is_available ? "Set Unavailable" : "Set Available"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredDrivers.length === 0 && (
            <div className="col-span-full">
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">No drivers found matching your search.</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDrivers;