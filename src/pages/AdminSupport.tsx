import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, MessageSquare, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  customer_name: string;
  customer_email: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  booking_id?: string;
}

const AdminSupport = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    loadTickets();
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

  const loadTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets((data || []) as SupportTicket[]);
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ status: newStatus })
        .eq('id', ticketId);

      if (error) throw error;
      
      setTickets(tickets.map(ticket => 
        ticket.id === ticketId ? { ...ticket, status: newStatus as any } : ticket
      ));
    } catch (error) {
      console.error('Error updating ticket status:', error);
    }
  };

  const filteredTickets = selectedStatus === 'all' 
    ? tickets 
    : tickets.filter(ticket => ticket.status === selectedStatus);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'resolved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'closed': return <CheckCircle className="h-4 w-4 text-gray-500" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading support tickets...</p>
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
            <h1 className="text-2xl font-bold">Customer Support</h1>
            <p className="text-muted-foreground">Manage customer support tickets</p>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tickets</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-muted-foreground">
            {filteredTickets.length} tickets
          </div>
        </div>

        <div className="grid gap-4">
          {filteredTickets.map((ticket) => (
            <Card key={ticket.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {getStatusIcon(ticket.status)}
                    {ticket.subject}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={getPriorityColor(ticket.priority)}>
                      {ticket.priority}
                    </Badge>
                    <Select
                      value={ticket.status}
                      onValueChange={(value) => updateTicketStatus(ticket.id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <CardDescription>
                  From: {ticket.customer_name} ({ticket.customer_email})
                  {ticket.booking_id && ` • Booking ID: ${ticket.booking_id}`}
                  • {new Date(ticket.created_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{ticket.message}</p>
              </CardContent>
            </Card>
          ))}

          {filteredTickets.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {selectedStatus === 'all' ? 'No support tickets found.' : `No ${selectedStatus} tickets found.`}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSupport;