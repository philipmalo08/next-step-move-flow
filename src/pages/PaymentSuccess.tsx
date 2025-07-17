import { useEffect, useState } from "react";
import { useSearchParams, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, Home, Receipt } from "lucide-react";
import { HelpSupportButton } from "@/components/HelpSupportButton";
import { supabase } from "@/integrations/supabase/client";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const [paymentVerified, setPaymentVerified] = useState<boolean | null>(null);
  const [bookingData, setBookingData] = useState<any>(null);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId) {
        setPaymentVerified(false);
        return;
      }

      try {
        // Get stored data from session storage
        const bookingId = sessionStorage.getItem('pending_booking_id');
        const paymentFormData = sessionStorage.getItem('payment_form_data');

        if (bookingId && paymentFormData) {
          setBookingData({
            bookingId,
            paymentData: JSON.parse(paymentFormData)
          });
          setPaymentVerified(true);

          // Clear session storage
          sessionStorage.removeItem('pending_booking_id');
          sessionStorage.removeItem('payment_form_data');
          sessionStorage.removeItem('booking_session_id');
        } else {
          setPaymentVerified(false);
        }
      } catch (error) {
        console.error('Error verifying payment:', error);
        setPaymentVerified(false);
      }
    };

    verifyPayment();
  }, [sessionId]);

  if (paymentVerified === null) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center p-4">
        <Card className="p-8 max-w-md text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying your payment...</p>
        </Card>
      </div>
    );
  }

  if (!paymentVerified) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">
        <Card className="p-8 text-center shadow-soft">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-success rounded-full mb-6">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-3xl font-bold text-foreground mb-4">Payment Successful!</h1>
          <p className="text-lg text-muted-foreground mb-6">
            Your booking has been confirmed and payment processed successfully.
          </p>

          {bookingData && (
            <div className="bg-muted/30 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Receipt className="w-5 h-5 text-primary" />
                <span className="font-medium">Booking Confirmation</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Booking ID: <span className="font-mono font-medium">{bookingData.bookingId}</span>
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                A confirmation email has been sent to {bookingData.paymentData.email}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <Button 
              onClick={() => window.location.href = '/'}
              className="w-full"
              size="lg"
            >
              <Home className="w-4 h-4 mr-2" />
              Return to Home
            </Button>
            
            <p className="text-sm text-muted-foreground">
              Need help? Contact us at (438) 543-0904 or mouvementsuivant@outlook.com
            </p>
          </div>
        </Card>
      </div>
      
      <HelpSupportButton />
    </div>
  );
}