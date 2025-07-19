import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

const FAQ = () => {
  const { t } = useLanguage();
  
  const faqSections = [
    {
      title: t('faqServiceAreasTitle'),
      questions: [
        {
          q: t('faqServiceAreasQ1'),
          a: t('faqServiceAreasA1')
        },
        {
          q: t('faqServiceAreasQ2'),
          a: t('faqServiceAreasA2')
        }
      ]
    },
    {
      title: t('faqServicesTitle'),
      questions: [
        {
          q: t('faqServicesQ1'),
          a: t('faqServicesA1')
        },
        {
          q: t('faqServicesQ2'),
          a: t('faqServicesA2')
        },
        {
          q: t('faqServicesQ3'),
          a: t('faqServicesA3')
        },
        {
          q: t('faqServicesQ4'),
          a: t('faqServicesA4')
        },
        {
          q: t('faqServicesQ5'),
          a: t('faqServicesA5')
        }
      ]
    },
    {
      title: t('faqPricingTitle'),
      questions: [
        {
          q: t('faqPricingQ1'),
          a: t('faqPricingA1')
        },
        {
          q: t('faqPricingQ2'),
          a: t('faqPricingA2')
        },
        {
          q: t('faqPricingQ3'),
          a: t('faqPricingA3')
        },
      ]
    },
    {
      title: t('faqBookingTitle'),
      questions: [
        {
          q: t('faqBookingQ1'),
          a: t('faqBookingA1')
        },
        {
          q: t('faqBookingQ2'),
          a: t('faqBookingA2')
        },
        {
          q: t('faqBookingQ3'),
          a: t('faqBookingA3')
        },
        {
          q: t('faqBookingQ4'),
          a: t('faqBookingA4')
        },
        {
          q: t('faqBookingQ5'),
          a: t('faqBookingA5')
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
              {t('backToHome')}
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">{t('frequentlyAskedQuestions')}</h1>
        </div>

        {/* Contact Info */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              {t('faqNeedMoreHelp')}{" "}
              <a href="tel:4385430904" className="text-primary hover:underline font-medium">
                (438) 543-0904
              </a>{" "}
              {t('or')}{" "}
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
            <h3 className="text-xl font-semibold mb-4">{t('readyToGetStarted')}</h3>
            <Link to="/">
              <Button size="lg">{t('getYourFreeQuote')}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FAQ;