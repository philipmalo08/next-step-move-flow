import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { HelpSupportButton } from "@/components/HelpSupportButton";
import { useLanguage } from "@/contexts/LanguageContext";

const TermsConditions = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

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
            {t('back')}
          </Button>
          <h1 className="text-3xl font-bold">{t('termsConditions')}</h1>
        </div>

        <div className="space-y-6">
          {/* Refund and Dispute Policy */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-primary">{t('refundDisputePolicy')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">{t('refundEligibility')}</h3>
                <p className="text-muted-foreground">
                  {t('refundEligibilityDesc')}
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                  <li>{t('refundEligibility1')}</li>
                  <li>{t('refundEligibility2')}</li>
                  <li>{t('refundEligibility3')}</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">{t('disputeResolution')}</h3>
                <p className="text-muted-foreground">
                  {t('disputeResolutionDesc')}
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">{t('refundProcess')}</h3>
                <p className="text-muted-foreground">
                  {t('refundProcessDesc')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Cancellation Policy */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-primary">{t('cancellationPolicy')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">{t('noticeRequirement')}</h3>
                <p className="text-muted-foreground">
                  <strong>{t('noticeRequirementDesc')}</strong>
                </p>
                <p className="text-muted-foreground mt-2">
                  {t('noticeRequirementReason')}
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">{t('howToCancel')}</h3>
                <p className="text-muted-foreground">
                  {t('howToCancelDesc')}
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                  <li>{t('phone')}: (438) 543-0904</li>
                  <li>{t('email')}: mouvementsuivant@outlook.com</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">{t('weatherEmergencyTitle')}</h3>
                <p className="text-muted-foreground">
                  {t('weatherEmergencyDesc')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Additional Charges Policy */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-primary">{t('additionalCharges')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">{t('undeclaredItems')}</h3>
                <p className="text-muted-foreground">
                  <strong>{t('undeclaredItemsDesc')}</strong>
                </p>
                <p className="text-muted-foreground mt-2">
                  {t('undeclaredItemsDetail')}
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">{t('undeclaredAddresses')}</h3>
                <p className="text-muted-foreground">
                  <strong>{t('undeclaredAddressesDesc')}</strong>
                </p>
                <p className="text-muted-foreground mt-2">
                  {t('undeclaredAddressesDetail')}
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">{t('otherAdditionalCharges')}</h3>
                <p className="text-muted-foreground">
                  {t('otherAdditionalChargesDesc')}
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                  <li>{t('additionalCharge1')}</li>
                  <li>{t('additionalCharge2')}</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-primary">{t('questions')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {t('termsQuestionsDesc')}
              </p>
              <div className="mt-4 space-y-2">
                <p className="text-muted-foreground">
                  <strong>{t('phone')}:</strong> <a href="tel:+14385430904" className="text-primary hover:underline">(438) 543-0904</a>
                </p>
                <p className="text-muted-foreground">
                  <strong>{t('email')}:</strong> <a href="mailto:mouvementsuivant@outlook.com" className="text-primary hover:underline">mouvementsuivant@outlook.com</a>
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