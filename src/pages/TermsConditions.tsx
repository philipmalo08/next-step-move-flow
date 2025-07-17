import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { HelpSupportButton } from "@/components/HelpSupportButton";

const TermsConditions = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Terms and Conditions</h1>
        </div>

        <div className="space-y-6">
          {/* Refund and Dispute Policy */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-primary">Refund and Dispute Policy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Refund Eligibility</h3>
                <p className="text-muted-foreground">
                  Refunds may be considered under the following circumstances:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                  <li>Service cancellation with proper notice (48+ hours in advance)</li>
                  <li>Failure to provide agreed-upon services</li>
                  <li>Damage to property due to negligence on our part</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Dispute Resolution</h3>
                <p className="text-muted-foreground">
                  Any disputes regarding services or charges should be reported within 48 hours of the moving date. 
                  We are committed to resolving all disputes fairly and promptly through direct communication with our customer service team.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Refund Process</h3>
                <p className="text-muted-foreground">
                  Approved refunds will be processed within 5-10 business days and credited back to the original payment method.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Cancellation Policy */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-primary">Cancellation Policy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">48-Hour Notice Requirement</h3>
                <p className="text-muted-foreground">
                  <strong>Cancellations made less than 48 hours in advance of the reserved moving time slot are non-refundable.</strong>
                </p>
                <p className="text-muted-foreground mt-2">
                  This policy is in place due to the specialized nature of our services and the advance scheduling required 
                  for our moving teams and equipment.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">How to Cancel</h3>
                <p className="text-muted-foreground">
                  To cancel your moving service, please contact our customer service team:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                  <li>Phone: (438) 543-0904</li>
                  <li>Email: mouvementsuivant@outlook.com</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Weather and Emergency Cancellations</h3>
                <p className="text-muted-foreground">
                  In cases of severe weather or emergency situations that make moving unsafe, 
                  we may need to reschedule your move. In such cases, no cancellation fees apply, 
                  and we will work with you to find an alternative date.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Additional Charges Policy */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-primary">Additional Charges</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Undeclared Items</h3>
                <p className="text-muted-foreground">
                  <strong>On moving day, any undeclared items are subject to additional charges.</strong>
                </p>
                <p className="text-muted-foreground mt-2">
                  All items to be moved must be declared during the booking process to ensure accurate pricing and proper preparation. 
                  Additional items discovered on moving day will be charged at current market rates.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Undeclared Addresses</h3>
                <p className="text-muted-foreground">
                  <strong>Any undeclared addresses on moving day are subject to additional charges.</strong>
                </p>
                <p className="text-muted-foreground mt-2">
                  All pickup and drop-off locations must be specified during booking. Additional stops or address changes 
                  on the day of the move will incur extra charges based on distance and time required.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Other Additional Charges</h3>
                <p className="text-muted-foreground">
                  Additional charges may apply for:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                  <li>Packing services requested on moving day</li>
                  <li>Waiting time due to customer delays</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-primary">Questions?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                If you have any questions about these terms and conditions, please don't hesitate to contact us:
              </p>
              <div className="mt-4 space-y-2">
                <p className="text-muted-foreground">
                  <strong>Phone:</strong> <a href="tel:+14385430904" className="text-primary hover:underline">(438) 543-0904</a>
                </p>
                <p className="text-muted-foreground">
                  <strong>Email:</strong> <a href="mailto:mouvementsuivant@outlook.com" className="text-primary hover:underline">mouvementsuivant@outlook.com</a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <HelpSupportButton />
    </div>
  );
};

export default TermsConditions;