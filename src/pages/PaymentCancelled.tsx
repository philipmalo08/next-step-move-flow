import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { XCircle, ArrowLeft, Home } from "lucide-react";

export default function PaymentCancelled() {
  return (
    <div className="min-h-screen bg-gradient-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">
        <Card className="p-8 text-center shadow-soft">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-full mb-6">
            <XCircle className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-3xl font-bold text-foreground mb-4">Payment Cancelled</h1>
          <p className="text-lg text-muted-foreground mb-6">
            Your payment was cancelled. No charges have been made to your account.
          </p>

          <div className="bg-muted/30 rounded-lg p-4 mb-6">
            <p className="text-sm text-muted-foreground">
              Your booking information has been saved. You can complete your payment at any time.
            </p>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={() => window.history.back()}
              className="w-full"
              size="lg"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to Booking
            </Button>
            
            <Button 
              onClick={() => window.location.href = '/'}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <Home className="w-4 h-4 mr-2" />
              Start New Booking
            </Button>
            
            <p className="text-sm text-muted-foreground">
              Need help? Contact us at (438) 543-0904 or mouvementsuivant@outlook.com
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}