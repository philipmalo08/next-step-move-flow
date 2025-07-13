import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Users, 
  Calendar, 
  DollarSign, 
  BarChart3, 
  Search, 
  Filter,
  Plus,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Package,
  Truck,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Booking {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
  pickup: string;
  dropoff: string;
  serviceTier: string;
  total: number;
  items: number;
  assignedMover?: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalBookings: number;
  totalSpent: number;
  lastMove: string;
}

interface Mover {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'available' | 'busy' | 'off-duty';
  rating: number;
  completedMoves: number;
  currentAssignments: number;
}

const AdminPanel = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  
  // Mock data - in real app this would come from Firebase/Supabase
  const [bookings] = useState<Booking[]>([
    {
      id: "NM-001234",
      customerName: "John Smith",
      email: "john@example.com",
      phone: "(514) 555-0123",
      date: "2024-01-15",
      time: "Morning (8:00 AM - 12:00 PM)",
      status: "confirmed",
      pickup: "123 Main St, Montreal, QC",
      dropoff: "456 Oak Ave, Laval, QC",
      serviceTier: "Standard Moving",
      total: 450.75,
      items: 12,
      assignedMover: "Mike Johnson"
    },
    {
      id: "NM-001235",
      customerName: "Sarah Wilson",
      email: "sarah@example.com",
      phone: "(514) 555-0124",
      date: "2024-01-16",
      time: "Afternoon (12:00 PM - 5:00 PM)",
      status: "pending",
      pickup: "789 Pine St, Montreal, QC",
      dropoff: "321 Elm St, Longueuil, QC",
      serviceTier: "Premium Moving",
      total: 675.50,
      items: 18
    }
  ]);

  const [customers] = useState<Customer[]>([
    {
      id: "CUST-001",
      name: "John Smith",
      email: "john@example.com",
      phone: "(514) 555-0123",
      totalBookings: 3,
      totalSpent: 1200.50,
      lastMove: "2024-01-15"
    },
    {
      id: "CUST-002",
      name: "Sarah Wilson",
      email: "sarah@example.com",
      phone: "(514) 555-0124",
      totalBookings: 1,
      totalSpent: 675.50,
      lastMove: "2024-01-16"
    }
  ]);

  const [movers] = useState<Mover[]>([
    {
      id: "MOV-001",
      name: "Mike Johnson",
      email: "mike@nextmovement.com",
      phone: "(514) 555-0200",
      status: "busy",
      rating: 4.8,
      completedMoves: 145,
      currentAssignments: 2
    },
    {
      id: "MOV-002",
      name: "David Brown",
      email: "david@nextmovement.com",
      phone: "(514) 555-0201",
      status: "available",
      rating: 4.9,
      completedMoves: 203,
      currentAssignments: 0
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'in-progress': return <Truck className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getMoverStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'busy': return 'bg-yellow-100 text-yellow-800';
      case 'off-duty': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-background">
      {/* Header */}
      <div className="bg-card shadow-soft border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Next Movement Admin</h1>
              <p className="text-muted-foreground">Manage bookings, customers, and operations</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                New Booking
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Bookings</p>
                <p className="text-3xl font-bold text-foreground">247</p>
              </div>
              <Calendar className="w-8 h-8 text-primary" />
            </div>
          </Card>
          
          <Card className="p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Customers</p>
                <p className="text-3xl font-bold text-foreground">156</p>
              </div>
              <Users className="w-8 h-8 text-primary" />
            </div>
          </Card>
          
          <Card className="p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                <p className="text-3xl font-bold text-foreground">$24,750</p>
              </div>
              <DollarSign className="w-8 h-8 text-primary" />
            </div>
          </Card>
          
          <Card className="p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Available Movers</p>
                <p className="text-3xl font-bold text-foreground">8</p>
              </div>
              <Truck className="w-8 h-8 text-primary" />
            </div>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="bookings" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="movers">Movers</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">All Bookings</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Booking
                </Button>
              </div>
            </div>

            <div className="grid gap-4">
              {bookings.map((booking) => (
                <Card key={booking.id} className="p-6 shadow-soft">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(booking.status)}>
                        {getStatusIcon(booking.status)}
                        <span className="ml-1 capitalize">{booking.status}</span>
                      </Badge>
                      <span className="font-mono text-sm text-muted-foreground">{booking.id}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="font-semibold mb-2">Customer</h4>
                      <p className="text-foreground">{booking.customerName}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Mail className="w-3 h-3" />
                        {booking.email}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        {booking.phone}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Move Details</h4>
                      <div className="flex items-center gap-2 text-sm mb-1">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        {booking.date}
                      </div>
                      <div className="flex items-center gap-2 text-sm mb-1">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        {booking.time}
                      </div>
                      <div className="flex items-center gap-2 text-sm mb-1">
                        <Package className="w-3 h-3 text-muted-foreground" />
                        {booking.items} items
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">{booking.serviceTier}</span>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Locations & Cost</h4>
                      <div className="text-sm mb-2">
                        <div className="flex items-start gap-2 mb-1">
                          <MapPin className="w-3 h-3 text-green-600 mt-1 flex-shrink-0" />
                          <span className="text-muted-foreground">{booking.pickup}</span>
                        </div>
                        <div className="flex items-start gap-2 mb-2">
                          <MapPin className="w-3 h-3 text-red-600 mt-1 flex-shrink-0" />
                          <span className="text-muted-foreground">{booking.dropoff}</span>
                        </div>
                      </div>
                      <div className="text-xl font-bold text-primary">${booking.total.toFixed(2)}</div>
                      {booking.assignedMover && (
                        <div className="text-sm text-muted-foreground mt-1">
                          Assigned: {booking.assignedMover}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Customers Tab */}
          <TabsContent value="customers" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Customer Management</h2>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Customer
              </Button>
            </div>

            <div className="grid gap-4">
              {customers.map((customer) => (
                <Card key={customer.id} className="p-6 shadow-soft">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                        <span className="text-primary-foreground font-semibold">
                          {customer.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{customer.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {customer.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {customer.phone}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-sm text-muted-foreground">Bookings</p>
                          <p className="font-semibold">{customer.totalBookings}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Total Spent</p>
                          <p className="font-semibold">${customer.totalSpent.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Last Move</p>
                          <p className="font-semibold">{customer.lastMove}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Movers Tab */}
          <TabsContent value="movers" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Mover Management</h2>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Mover
              </Button>
            </div>

            <div className="grid gap-4">
              {movers.map((mover) => (
                <Card key={mover.id} className="p-6 shadow-soft">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-secondary rounded-full flex items-center justify-center">
                        <Truck className="w-6 h-6 text-secondary-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground">{mover.name}</h3>
                          <Badge className={getMoverStatusColor(mover.status)}>
                            {mover.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {mover.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {mover.phone}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-sm text-muted-foreground">Rating</p>
                          <p className="font-semibold">⭐ {mover.rating}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Completed</p>
                          <p className="font-semibold">{mover.completedMoves}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Current Jobs</p>
                          <p className="font-semibold">{mover.currentAssignments}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Pricing Tab */}
          <TabsContent value="pricing" className="space-y-6">
            <h2 className="text-xl font-semibold">Pricing Management</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6 shadow-soft">
                <h3 className="text-lg font-semibold mb-4">Service Tiers</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Basic Moving</p>
                      <p className="text-sm text-muted-foreground">Essential moving services</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">$2.50/lb</p>
                      <Button variant="outline" size="sm">Edit</Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Standard Moving</p>
                      <p className="text-sm text-muted-foreground">Professional moving with protection</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">$3.25/lb</p>
                      <Button variant="outline" size="sm">Edit</Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Premium Moving</p>
                      <p className="text-sm text-muted-foreground">Full-service white-glove moving</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">$4.75/lb</p>
                      <Button variant="outline" size="sm">Edit</Button>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6 shadow-soft">
                <h3 className="text-lg font-semibold mb-4">Additional Fees</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Base Service Fee</Label>
                    <div className="flex items-center gap-2">
                      <Input type="number" value="75" className="w-20" />
                      <Button variant="outline" size="sm">Update</Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>Distance Rate (per km)</Label>
                    <div className="flex items-center gap-2">
                      <Input type="number" value="1.50" className="w-20" />
                      <Button variant="outline" size="sm">Update</Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>GST Rate (%)</Label>
                    <div className="flex items-center gap-2">
                      <Input type="number" value="5" className="w-20" />
                      <Button variant="outline" size="sm">Update</Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>QST Rate (%)</Label>
                    <div className="flex items-center gap-2">
                      <Input type="number" value="9.975" className="w-20" />
                      <Button variant="outline" size="sm">Update</Button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <h2 className="text-xl font-semibold">Business Analytics</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6 shadow-soft">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Monthly Performance
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Total Moves</span>
                    <span className="font-semibold">47</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Revenue</span>
                    <span className="font-semibold">$24,750</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Average Move Value</span>
                    <span className="font-semibold">$526</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Customer Satisfaction</span>
                    <span className="font-semibold">4.8/5</span>
                  </div>
                </div>
              </Card>

              <Card className="p-6 shadow-soft">
                <h3 className="text-lg font-semibold mb-4">Popular Services</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Standard Moving</span>
                    <Badge variant="secondary">68%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Premium Moving</span>
                    <Badge variant="secondary">22%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Basic Moving</span>
                    <Badge variant="secondary">10%</Badge>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;