import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, Mail, HelpCircle, FileQuestion, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const HelpSupportButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isTicketDialogOpen, setIsTicketDialogOpen] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    priority: 'medium'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useLanguage();
  const { toast } = useToast();

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('support_tickets')
        .insert({
          customer_name: ticketForm.name,
          customer_email: ticketForm.email,
          subject: ticketForm.subject,
          message: ticketForm.message,
          priority: ticketForm.priority
        });

      if (error) throw error;

      toast({
        title: t('common.success'),
        description: t('support.ticketSubmitted')
      });

      setTicketForm({
        name: '',
        email: '',
        subject: '',
        message: '',
        priority: 'medium'
      });
      setIsTicketDialogOpen(false);
      setIsOpen(false);
    } catch (error) {
      console.error('Error submitting ticket:', error);
      toast({
        title: t('common.error'),
        description: t('support.ticketError'),
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-6 left-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          variant="secondary"
          size="sm"
          className="shadow-glow"
        >
          <HelpCircle className="w-4 h-4 mr-2" />
          {t('helpSupport')}
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">{t('customerSupport')}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <Link to="/faq" onClick={() => setIsOpen(false)} className="block">
              <Button variant="outline" className="w-full justify-start">
                <FileQuestion className="w-4 h-4 mr-2" />
                {t('viewFAQ')}
              </Button>
            </Link>

            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => {
                setIsOpen(false);
                setIsTicketDialogOpen(true);
              }}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              {t('support.createTicket')}
            </Button>
            
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-3 p-4 bg-muted rounded-lg">
                <Phone className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('phone')}</p>
                  <a 
                    href="tel:+14385430904" 
                    className="text-lg font-semibold text-primary hover:underline"
                  >
                    (438) 543-0904
                  </a>
                </div>
              </div>

              <div className="flex items-center justify-center space-x-3 p-4 bg-muted rounded-lg">
                <Mail className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('email')}</p>
                  <a 
                    href="mailto:mouvementsuivant@outlook.com" 
                    className="text-lg font-semibold text-primary hover:underline"
                  >
                    mouvementsuivant@outlook.com
                  </a>
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {t('customerServiceDescription')}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Support Ticket Dialog */}
      <Dialog open={isTicketDialogOpen} onOpenChange={setIsTicketDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('support.createTicket')}</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmitTicket} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">{t('payment.fullName')}</Label>
                <Input
                  id="name"
                  value={ticketForm.name}
                  onChange={(e) => setTicketForm({...ticketForm, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">{t('payment.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={ticketForm.email}
                  onChange={(e) => setTicketForm({...ticketForm, email: e.target.value})}
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="subject">{t('support.subject')}</Label>
              <Input
                id="subject"
                value={ticketForm.subject}
                onChange={(e) => setTicketForm({...ticketForm, subject: e.target.value})}
                required
              />
            </div>

            <div>
              <Label htmlFor="priority">{t('support.priority')}</Label>
              <Select value={ticketForm.priority} onValueChange={(value) => setTicketForm({...ticketForm, priority: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{t('support.low')}</SelectItem>
                  <SelectItem value="medium">{t('support.medium')}</SelectItem>
                  <SelectItem value="high">{t('support.high')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="message">{t('support.message')}</Label>
              <Textarea
                id="message"
                value={ticketForm.message}
                onChange={(e) => setTicketForm({...ticketForm, message: e.target.value})}
                rows={4}
                required
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsTicketDialogOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t('payment.processing') : t('support.submitTicket')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};