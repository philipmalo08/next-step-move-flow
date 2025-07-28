import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Search, Filter, Calendar, MapPin, User, DollarSign, Download } from 'lucide-react';
import { generateBookingPDF, downloadPDF } from '@/lib/pdfGenerator';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';

interface Booking {
  id: string;
  booking_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  booking_date: string;
  booking_time: string;
  pickup_addresses: string[];
  dropoff_addresses: string[];
  service_tier: string;
  status: string;
  total: number;
  created_at: string;
}

interface Assignment {
  driver_id: string;
  status: string;
  driver?: {
    profile_id: string;
    profiles?: {
      full_name: string;
    };
  };
}

const AdminBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [assignments, setAssignments] = useState<Record<string, Assignment>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [downloadingPDF, setDownloadingPDF] = useState<string | null>(null);
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    checkAuth();
    loadBookings();
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

    if (!profile || !['admin', 'super_admin', 'driver'].includes(profile.role)) {
      navigate('/admin/login');
      return;
    }
  };

  const loadBookings = async () => {
    try {
      const { data: bookingsData, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setBookings(bookingsData || []);

      // Load assignments for these bookings
      if (bookingsData && bookingsData.length > 0) {
        const { data: assignmentsData } = await supabase
          .from('job_assignments')
          .select(`
            booking_id,
            driver_id,
            status,
            drivers (
              profile_id,
              profiles (
                full_name
              )
            )
          `)
          .in('booking_id', bookingsData.map(b => b.id));

        const assignmentsMap = (assignmentsData || []).reduce((acc, assignment) => {
          acc[assignment.booking_id] = assignment;
          return acc;
        }, {} as Record<string, any>);

        setAssignments(assignmentsMap);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (bookingId: string) => {
    setDownloadingPDF(bookingId);
    try {
      // Fetch full booking details
      const { data: fullBooking, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (error || !fullBooking) {
        throw new Error('Failed to fetch booking details');
      }

      // Convert the admin booking format to the format expected by PDF generator
      const pdfBookingData = {
        date: new Date(fullBooking.booking_date),
        time: fullBooking.booking_time,
        addresses: [
          ...fullBooking.pickup_addresses.map((addr: string, index: number) => ({
            id: `pickup-${index}`,
            address: addr,
            type: 'pickup' as const
          })),
          ...fullBooking.dropoff_addresses.map((addr: string, index: number) => ({
            id: `dropoff-${index}`,
            address: addr,
            type: 'dropoff' as const
          }))
        ],
        serviceTier: {
          id: 'service-1',
          name: fullBooking.service_tier,
          price: fullBooking.service_price,
          priceUnit: 'base'
        },
        items: Object.entries(fullBooking.selected_items || {}).map(([name, quantity]) => ({
          id: name.toLowerCase().replace(/\s+/g, '-'),
          name,
          category: 'Furniture', // Default category
          quantity: quantity as number,
          weight: 50, // Default weight
          volume: 2   // Default volume
        })),
        quote: {
          baseServiceFee: fullBooking.service_price,
          itemCost: 0,
          distanceFee: 0,
          subtotal: fullBooking.subtotal,
          gst: fullBooking.gst,
          qst: fullBooking.qst,
          total: fullBooking.total
        },
        paymentData: {
          fullName: fullBooking.customer_name,
          email: fullBooking.customer_email,
          phone: fullBooking.customer_phone,
          billingAddress: typeof fullBooking.payment_details_summary === 'object' && fullBooking.payment_details_summary && 'billingAddress' in fullBooking.payment_details_summary 
            ? (fullBooking.payment_details_summary as any).billingAddress || '' 
            : '',
          billingCity: '',
          billingPostal: ''
        }
      };

      const pdfBlob = await generateBookingPDF(pdfBookingData, fullBooking.booking_id);
      const filename = `NextMovement-Booking-${fullBooking.booking_id}.pdf`;
      downloadPDF(pdfBlob, filename);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setDownloadingPDF(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'assigned': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.booking_id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading bookings...</p>
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
                {t('admin.backToDashboard')}
              </Button>
              <h1 className="text-2xl font-bold">{t('admin.bookingManagement')}</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="mr-2 h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by customer name, email, or booking ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Bookings List */}
        <div className="space-y-4">
          {filteredBookings.map((booking) => {
            const assignment = assignments[booking.id];
            return (
              <Card key={booking.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{booking.booking_id}</h3>
                      <p className="text-muted-foreground">{booking.customer_name}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Badge className={getStatusColor(booking.status)}>
                        {booking.status}
                      </Badge>
                      {assignment && (
                        <Badge variant="outline">
                          {assignment.status}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {format(new Date(booking.booking_date), 'MMM dd, yyyy')} at {booking.booking_time}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{booking.customer_email}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">${booking.total}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{booking.service_tier}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Pickup:</p>
                      <p className="text-sm">{booking.pickup_addresses?.[0] || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Dropoff:</p>
                      <p className="text-sm">{booking.dropoff_addresses?.[0] || 'N/A'}</p>
                    </div>
                  </div>

                  {assignment && assignment.driver && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-muted-foreground mb-1">Assigned Driver:</p>
                      <p className="text-sm">{assignment.driver.profiles?.full_name || 'Unknown'}</p>
                    </div>
                  )}

                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadPDF(booking.id)}
                      disabled={downloadingPDF === booking.id}
                      className="flex items-center gap-2"
                    >
                      <Download className="w-3 h-3" />
                      {downloadingPDF === booking.id ? 'Generating...' : 'Download PDF'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/admin/bookings/${booking.id}`)}
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {filteredBookings.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">No bookings found matching your criteria.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminBookings;