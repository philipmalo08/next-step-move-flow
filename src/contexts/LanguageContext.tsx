import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'fr';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: React.ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

const translations = {
  en: {
    // Navigation & Common
    'nav.home': 'Home',
    'nav.about': 'About',
    'nav.services': 'Services',
    'nav.contact': 'Contact',
    'nav.faq': 'FAQ',
    'nav.terms': 'Terms & Conditions',
    'common.next': 'Next',
    'common.back': 'Back',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.close': 'Close',
    'common.save': 'Save',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.download': 'Download',
    
    // Welcome Screen
    'welcome.title': 'Professional Moving Services in Montreal',
    'welcome.subtitle': 'Reliable, efficient, and affordable moving solutions for your home or business.',
    'welcome.getQuote': 'Get Your Free Quote',
    'welcome.features.experience': '5+ Years Experience',
    'welcome.features.insured': 'Fully Insured',
    'welcome.features.support': '24/7 Support',
    
    // Address Screen
    'address.title': 'Where are you moving?',
    'address.subtitle': 'Add your pickup and drop-off locations',
    'address.pickup': 'Pickup Location',
    'address.dropoff': 'Drop-off Location',
    'address.addPickup': 'Add Pickup Location',
    'address.addDropoff': 'Add Drop-off Location',
    'address.placeholder': 'Enter address...',
    
    // Date & Time Screen
    'datetime.title': 'When do you want to move?',
    'datetime.subtitle': 'Select your preferred date and time',
    'datetime.selectDate': 'Select Date',
    'datetime.selectTime': 'Select Time Slot',
    'datetime.timeSlots.8-10': '8:00 AM - 10:00 AM',
    'datetime.timeSlots.10-12': '10:00 AM - 12:00 PM',
    'datetime.timeSlots.12-14': '12:00 PM - 2:00 PM',
    'datetime.timeSlots.14-16': '2:00 PM - 4:00 PM',
    'datetime.timeSlots.16-18': '4:00 PM - 6:00 PM',
    'datetime.timeSlots.18-20': '6:00 PM - 8:00 PM',
    
    // Service Tier Screen
    'service.title': 'Choose your service level',
    'service.subtitle': 'Select the service that best fits your needs',
    'service.basic.name': 'Basic Move',
    'service.basic.description': 'Standard moving service with professional movers',
    'service.premium.name': 'Premium Move',
    'service.premium.description': 'Full-service moving with packing and unpacking',
    'service.luxury.name': 'Luxury Move',
    'service.luxury.description': 'White-glove service with premium care',
    
    // Items Screen
    'items.title': 'What are you moving?',
    'items.subtitle': 'Select the items you need to move',
    'items.categories.bedroom': 'Bedroom',
    'items.categories.livingRoom': 'Living Room',
    'items.categories.kitchen': 'Kitchen',
    'items.categories.office': 'Office',
    'items.categories.appliances': 'Appliances',
    'items.categories.outdoor': 'Outdoor',
    'items.categories.custom': 'Custom',
    'items.addCustom': 'Add Custom Item',
    'items.customName': 'Item Name',
    'items.customWeight': 'Weight (kg)',
    'items.customVolume': 'Volume (m³)',
    'items.quantity': 'Quantity',
    
    // Quote Screen
    'quote.title': 'Your Moving Quote',
    'quote.subtitle': 'Review your estimate and continue to payment',
    'quote.baseService': 'Base Service Fee',
    'quote.itemCost': 'Item Cost',
    'quote.distanceFee': 'Distance Fee',
    'quote.subtotal': 'Subtotal',
    'quote.gst': 'GST (5%)',
    'quote.qst': 'QST (9.975%)',
    'quote.total': 'Total',
    
    // Payment Screen
    'payment.title': 'Complete Your Booking',
    'payment.subtitle': 'Enter your details to confirm your move',
    'payment.contactInfo': 'Contact Information',
    'payment.fullName': 'Full Name',
    'payment.email': 'Email Address',
    'payment.phone': 'Phone Number',
    'payment.billingInfo': 'Billing Information',
    'payment.billingAddress': 'Billing Address',
    'payment.city': 'City',
    'payment.postal': 'Postal Code',
    'payment.payNow': 'Pay Now',
    
    // Confirmation Screen
    'confirmation.title': 'Booking Confirmed!',
    'confirmation.subtitle': 'Your move has been successfully scheduled. A booking confirmation and receipt will be sent to you by email.',
    'confirmation.bookingId': 'Booking ID',
    'confirmation.dateTime': 'Date & Time',
    'confirmation.serviceDetails': 'Service Details',
    'confirmation.serviceTier': 'Service Tier',
    'confirmation.totalCost': 'Total Cost',
    'confirmation.locations': 'Locations',
    'confirmation.pickupLocation': 'Pickup Location(s)',
    'confirmation.dropoffLocation': 'Drop-off Location(s)',
    'confirmation.itemsSummary': 'Items Summary',
    'confirmation.totalItems': 'Total Items',
    'confirmation.contactInfo': 'Contact Information',
    'confirmation.needChanges': 'Need to make changes? Contact us at',
    'confirmation.downloadPdf': 'Download Move Details & Checklist',
    'confirmation.generating': 'Generating PDF...',
    'confirmation.bookAnother': 'Book Another Move',
    'confirmation.copyright': '© 2021 Next Movement. All rights reserved.',
    
    // FAQ
    'faq.title': 'Frequently Asked Questions',
    'faq.q1': 'What areas do you serve?',
    'faq.a1': 'We provide moving services throughout Montreal and the greater Montreal area, including Laval, Longueuil, and surrounding suburbs.',
    'faq.q2': 'How far in advance should I book?',
    'faq.a2': 'We recommend booking at least 2 weeks in advance, especially during peak moving seasons (summer months and end/beginning of months).',
    'faq.q3': 'What is included in the moving service?',
    'faq.a3': 'Our standard service includes professional movers, moving truck, basic equipment (dollies, straps, blankets), and loading/unloading. Packing services are available as add-ons.',
    'faq.q4': 'Are my belongings insured?',
    'faq.a4': 'Yes, we provide basic coverage for your belongings. Additional insurance options are available for high-value items.',
    'faq.q5': 'What happens if there are delays?',
    'faq.a5': 'We strive to be punctual, but if delays occur due to unforeseen circumstances, we will notify you immediately and work to minimize any inconvenience.',
    'faq.q6': 'Do you provide packing materials?',
    'faq.a6': 'Yes, we offer a full range of packing materials including boxes, tape, bubble wrap, and packing paper. These can be purchased separately or as part of our packing service.',
    'faq.q7': 'Can you move pianos and special items?',
    'faq.a7': 'Yes, we have experience moving pianos, artwork, antiques, and other specialty items. Additional fees may apply for special handling.',
    'faq.q8': 'What payment methods do you accept?',
    'faq.a8': 'We accept cash, credit cards (Visa, Mastercard), and e-transfer. Payment is typically due upon completion of the move.',
    
    // Admin
    'admin.login': 'Admin Login',
    'admin.dashboard': 'Dashboard',
    'admin.bookings': 'Bookings',
    'admin.drivers': 'Drivers',
    'admin.analytics': 'Analytics',
    'admin.support': 'Support',
    'admin.settings': 'Settings',
    
    // Error Messages
    'error.addressRequired': 'Please add at least one pickup and one drop-off address',
    'error.dateRequired': 'Please select a date and time',
    'error.serviceRequired': 'Please select a service tier',
    'error.itemsRequired': 'Please select at least one item',
    'error.paymentRequired': 'Please fill in all required payment information',
    
    // Success Messages
    'success.bookingSaved': 'Booking saved successfully',
    'success.emailSent': 'Confirmation email sent',
    'success.pdfGenerated': 'PDF generated successfully',
  },
  fr: {
    // Navigation & Common
    'nav.home': 'Accueil',
    'nav.about': 'À Propos',
    'nav.services': 'Services',
    'nav.contact': 'Contact',
    'nav.faq': 'FAQ',
    'nav.terms': 'Termes et Conditions',
    'common.next': 'Suivant',
    'common.back': 'Retour',
    'common.cancel': 'Annuler',
    'common.confirm': 'Confirmer',
    'common.loading': 'Chargement...',
    'common.error': 'Erreur',
    'common.success': 'Succès',
    'common.close': 'Fermer',
    'common.save': 'Enregistrer',
    'common.edit': 'Modifier',
    'common.delete': 'Supprimer',
    'common.download': 'Télécharger',
    
    // Welcome Screen
    'welcome.title': 'Services de Déménagement Professionnels à Montréal',
    'welcome.subtitle': 'Solutions de déménagement fiables, efficaces et abordables pour votre maison ou entreprise.',
    'welcome.getQuote': 'Obtenez Votre Devis Gratuit',
    'welcome.features.experience': '5+ Années d\'Expérience',
    'welcome.features.insured': 'Entièrement Assuré',
    'welcome.features.support': 'Support 24/7',
    
    // Address Screen
    'address.title': 'Où déménagez-vous?',
    'address.subtitle': 'Ajoutez vos lieux de ramassage et de livraison',
    'address.pickup': 'Lieu de Ramassage',
    'address.dropoff': 'Lieu de Livraison',
    'address.addPickup': 'Ajouter un Lieu de Ramassage',
    'address.addDropoff': 'Ajouter un Lieu de Livraison',
    'address.placeholder': 'Entrez l\'adresse...',
    
    // Date & Time Screen
    'datetime.title': 'Quand voulez-vous déménager?',
    'datetime.subtitle': 'Sélectionnez votre date et heure préférées',
    'datetime.selectDate': 'Sélectionner la Date',
    'datetime.selectTime': 'Sélectionner le Créneau Horaire',
    'datetime.timeSlots.8-10': '8h00 - 10h00',
    'datetime.timeSlots.10-12': '10h00 - 12h00',
    'datetime.timeSlots.12-14': '12h00 - 14h00',
    'datetime.timeSlots.14-16': '14h00 - 16h00',
    'datetime.timeSlots.16-18': '16h00 - 18h00',
    'datetime.timeSlots.18-20': '18h00 - 20h00',
    
    // Service Tier Screen
    'service.title': 'Choisissez votre niveau de service',
    'service.subtitle': 'Sélectionnez le service qui correspond le mieux à vos besoins',
    'service.basic.name': 'Déménagement Standard',
    'service.basic.description': 'Service de déménagement standard avec déménageurs professionnels',
    'service.premium.name': 'Déménagement Premium',
    'service.premium.description': 'Service complet avec emballage et déballage',
    'service.luxury.name': 'Déménagement de Luxe',
    'service.luxury.description': 'Service haut de gamme avec soins premium',
    
    // Items Screen
    'items.title': 'Que déménagez-vous?',
    'items.subtitle': 'Sélectionnez les articles que vous devez déménager',
    'items.categories.bedroom': 'Chambre',
    'items.categories.livingRoom': 'Salon',
    'items.categories.kitchen': 'Cuisine',
    'items.categories.office': 'Bureau',
    'items.categories.appliances': 'Électroménagers',
    'items.categories.outdoor': 'Extérieur',
    'items.categories.custom': 'Personnalisé',
    'items.addCustom': 'Ajouter un Article Personnalisé',
    'items.customName': 'Nom de l\'Article',
    'items.customWeight': 'Poids (kg)',
    'items.customVolume': 'Volume (m³)',
    'items.quantity': 'Quantité',
    
    // Quote Screen
    'quote.title': 'Votre Devis de Déménagement',
    'quote.subtitle': 'Examinez votre estimation et continuez vers le paiement',
    'quote.baseService': 'Frais de Service de Base',
    'quote.itemCost': 'Coût des Articles',
    'quote.distanceFee': 'Frais de Distance',
    'quote.subtotal': 'Sous-total',
    'quote.gst': 'TPS (5%)',
    'quote.qst': 'TVQ (9.975%)',
    'quote.total': 'Total',
    
    // Payment Screen
    'payment.title': 'Complétez Votre Réservation',
    'payment.subtitle': 'Entrez vos détails pour confirmer votre déménagement',
    'payment.contactInfo': 'Informations de Contact',
    'payment.fullName': 'Nom Complet',
    'payment.email': 'Adresse E-mail',
    'payment.phone': 'Numéro de Téléphone',
    'payment.billingInfo': 'Informations de Facturation',
    'payment.billingAddress': 'Adresse de Facturation',
    'payment.city': 'Ville',
    'payment.postal': 'Code Postal',
    'payment.payNow': 'Payer Maintenant',
    
    // Confirmation Screen
    'confirmation.title': 'Réservation Confirmée!',
    'confirmation.subtitle': 'Votre déménagement a été programmé avec succès. Une confirmation de réservation et un reçu vous seront envoyés par e-mail.',
    'confirmation.bookingId': 'ID de Réservation',
    'confirmation.dateTime': 'Date et Heure',
    'confirmation.serviceDetails': 'Détails du Service',
    'confirmation.serviceTier': 'Niveau de Service',
    'confirmation.totalCost': 'Coût Total',
    'confirmation.locations': 'Emplacements',
    'confirmation.pickupLocation': 'Lieu(x) de Ramassage',
    'confirmation.dropoffLocation': 'Lieu(x) de Livraison',
    'confirmation.itemsSummary': 'Résumé des Articles',
    'confirmation.totalItems': 'Total des Articles',
    'confirmation.contactInfo': 'Informations de Contact',
    'confirmation.needChanges': 'Besoin de faire des changements? Contactez-nous au',
    'confirmation.downloadPdf': 'Télécharger les Détails et Liste de Vérification',
    'confirmation.generating': 'Génération du PDF...',
    'confirmation.bookAnother': 'Réserver un Autre Déménagement',
    'confirmation.copyright': '© 2021 Next Movement. Tous droits réservés.',
    
    // FAQ
    'faq.title': 'Questions Fréquemment Posées',
    'faq.q1': 'Quelles zones desservez-vous?',
    'faq.a1': 'Nous fournissons des services de déménagement dans tout Montréal et la grande région de Montréal, y compris Laval, Longueuil et les banlieues environnantes.',
    'faq.q2': 'Combien de temps à l\'avance dois-je réserver?',
    'faq.a2': 'Nous recommandons de réserver au moins 2 semaines à l\'avance, surtout pendant les saisons de pointe (mois d\'été et fin/début de mois).',
    'faq.q3': 'Qu\'est-ce qui est inclus dans le service de déménagement?',
    'faq.a3': 'Notre service standard comprend des déménageurs professionnels, un camion de déménagement, de l\'équipement de base (diables, sangles, couvertures), et le chargement/déchargement. Les services d\'emballage sont disponibles en option.',
    'faq.q4': 'Mes biens sont-ils assurés?',
    'faq.a4': 'Oui, nous fournissons une couverture de base pour vos biens. Des options d\'assurance supplémentaires sont disponibles pour les articles de grande valeur.',
    'faq.q5': 'Que se passe-t-il s\'il y a des retards?',
    'faq.a5': 'Nous nous efforçons d\'être ponctuels, mais si des retards surviennent en raison de circonstances imprévues, nous vous en informerons immédiatement et travaillerons pour minimiser tout inconvénient.',
    'faq.q6': 'Fournissez-vous du matériel d\'emballage?',
    'faq.a6': 'Oui, nous offrons une gamme complète de matériaux d\'emballage incluant des boîtes, du ruban adhésif, du papier bulle et du papier d\'emballage. Ceux-ci peuvent être achetés séparément ou dans le cadre de notre service d\'emballage.',
    'faq.q7': 'Pouvez-vous déménager des pianos et des articles spéciaux?',
    'faq.a7': 'Oui, nous avons de l\'expérience dans le déménagement de pianos, d\'œuvres d\'art, d\'antiquités et d\'autres articles spécialisés. Des frais supplémentaires peuvent s\'appliquer pour la manipulation spéciale.',
    'faq.q8': 'Quels modes de paiement acceptez-vous?',
    'faq.a8': 'Nous acceptons l\'argent comptant, les cartes de crédit (Visa, Mastercard) et les virements électroniques. Le paiement est généralement dû à la fin du déménagement.',
    
    // Admin
    'admin.login': 'Connexion Administrateur',
    'admin.dashboard': 'Tableau de Bord',
    'admin.bookings': 'Réservations',
    'admin.drivers': 'Chauffeurs',
    'admin.analytics': 'Analytiques',
    'admin.support': 'Support',
    'admin.settings': 'Paramètres',
    
    // Error Messages
    'error.addressRequired': 'Veuillez ajouter au moins une adresse de ramassage et une de livraison',
    'error.dateRequired': 'Veuillez sélectionner une date et une heure',
    'error.serviceRequired': 'Veuillez sélectionner un niveau de service',
    'error.itemsRequired': 'Veuillez sélectionner au moins un article',
    'error.paymentRequired': 'Veuillez remplir toutes les informations de paiement requises',
    
    // Success Messages
    'success.bookingSaved': 'Réservation enregistrée avec succès',
    'success.emailSent': 'E-mail de confirmation envoyé',
    'success.pdfGenerated': 'PDF généré avec succès',
  }
};