import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";

const FAQ = () => {
  const faqSections = [
    {
      title: "Service Areas & Coverage",
      questions: [
        {
          q: "What areas do you service?",
          a: "We primarily serve the Greater Montreal Area and surrounding regions, including Laval, Longueuil, and the South Shore. For long-distance moves, please contact us directly."
        },
        {
          q: "Do you offer long-distance moves?",
          a: "Yes, we provide both local and long-distance moving services across Quebec and neighboring provinces. Quotes may vary based on mileage and complexity."
        }
      ]
    },
    {
      title: "Services & Equipment",
      questions: [
        {
          q: "Can you move pianos or heavy furniture?",
          a: "We move heavy furniture but unfortunately, we do not move pianos."
        },
        {
          q: "Do you provide packing materials?",
          a: "Yes, for White Glove service tier, we offer boxes, tape, bubble wrap, and other packing supplies."
        },
        {
          q: "Can I hire movers without a truck?",
          a: "Yes, we offer labor-only services for loading/unloading or in-home moves where transportation isn't required. For a move with a truck you supply, the base service fee and distance fee would be waived. For commercial labor such as offices and warehouses, contact the customer service number at (438) 543-0904."
        },
        {
          q: "Do you disassemble and reassemble furniture?",
          a: "Yes, our team can disassemble and reassemble beds, tables, and other furniture as part of the move with the Premium service tier."
        },
        {
          q: "What's included in each service tier?",
          a: "Our service tiers vary from basic loading/unloading to full-service moves with packing, materials, and furniture assembly. You'll see details during booking."
        }
      ]
    },
    {
      title: "Pricing & Costs",
      questions: [
        {
          q: "How much does a 1-bedroom apartment move cost?",
          a: "Prices typically start at $350–$600 for a 1-bedroom move, depending on the distance, items, and service tier. Use our online quote tool for an instant estimate."
        },
        {
          q: "Is your quote final or will there be extra charges?",
          a: "The quote you receive is a final flat rate based on the inventory and details you provide. Additional charges only apply for last-minute changes or significant item additions."
        },
        {
          q: "Do you charge hourly or flat rate?",
          a: "We use flat-rate pricing for transparency and simplicity. However, hourly rates may apply in custom or special cases (commercial jobs)."
        },
      ]
    },
    {
      title: "Booking & Scheduling",
      questions: [
        {
          q: "How far in advance should I book?",
          a: "We recommend booking 2–3 weeks in advance, especially during weekends or at the end of the month when demand is highest."
        },
        {
          q: "Can I change my moving date after booking?",
          a: "Yes, you can reschedule up to 48 hours before your move without penalty, contact support to make changes."
        },
        {
          q: "Do you offer same-day or next-day service?",
          a: "We do offer last-minute bookings when availability allows. Contact us or check online for real-time scheduling."
        },
        {
          q: "What time will the movers arrive?",
          a: "You'll be given a time window when booking, and our team will confirm 24 hours before your move. We also send live updates the day of."
        },
        {
          q: "Can I schedule a move for the evening or weekend?",
          a: "Yes, we operate 7 days a week and offer evening time slots to accommodate your schedule."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link to="/">
            <Button variant="ghost" size="sm" className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Frequently Asked Questions</h1>
        </div>

        {/* Contact Info */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Need more help? Contact us directly at{" "}
              <a href="tel:4385430904" className="text-primary hover:underline font-medium">
                (438) 543-0904
              </a>{" "}
              or{" "}
              <a href="mailto:mouvementsuivant@outlook.com" className="text-primary hover:underline font-medium">
                mouvementsuivant@outlook.com
              </a>
            </p>
          </CardContent>
        </Card>

        {/* FAQ Sections */}
        <div className="space-y-8">
          {faqSections.map((section, sectionIndex) => (
            <Card key={sectionIndex}>
              <CardHeader>
                <CardTitle className="text-xl">{section.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {section.questions.map((item, itemIndex) => (
                    <div key={itemIndex}>
                      <h3 className="font-semibold text-foreground mb-2">
                        {item.q}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {item.a}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Get Quote CTA */}
        <Card className="mt-8">
          <CardContent className="pt-6 text-center">
            <h3 className="text-xl font-semibold mb-4">Ready to get started?</h3>
            <Link to="/">
              <Button size="lg">Get Your Free Quote</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FAQ;