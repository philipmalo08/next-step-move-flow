import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { MessageCircle, Send, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { getUserIdentifier } from '@/lib/sessionManager';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { t, language } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: t('chatbotWelcome'),
      isBot: true,
      timestamp: new Date(),
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    
    const newQuestionCount = questionCount + 1;
    setQuestionCount(newQuestionCount);

    // Check if user has reached the limit
    if (newQuestionCount >= 3) {
      const limitMessage: Message = {
        id: (Date.now() + 2).toString(),
        text: t('chatbotLimit'),
        isBot: true,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, limitMessage]);
      setShowEmailForm(true);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('chatbot', {
        body: { message: inputMessage, language }
      });

      if (error) throw error;

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response,
        isBot: true,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chatbot error:', error);
      toast({
        title: t('error'),
        description: t('chatbotError'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const submitEmail = async () => {
    if (!email.trim() || !email.includes('@')) {
      toast({
        title: t('error'),
        description: t('chatbotEmailError'),
        variant: "destructive",
      });
      return;
    }

    try {
      const userIdentifier = await getUserIdentifier();
      
      const { error } = await supabase
        .from('chatbot_emails')
        .insert({
          email: email.trim(),
          user_session_id: userIdentifier,
          questions_asked: questionCount
        });

      if (error) throw error;

      const thankYouMessage: Message = {
        id: (Date.now() + 3).toString(),
        text: t('chatbotThankYou'),
        isBot: true,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, thankYouMessage]);
      setShowEmailForm(false);
      setEmail('');
      
      toast({
        title: "Success",
        description: "Thank you for your email. Please visit our Help & Support section.",
      });
    } catch (error) {
      console.error('Error saving email:', error);
      toast({
        title: t('error'),
        description: "Failed to save email. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-20 left-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full w-12 h-12 shadow-glow"
          size="sm"
        >
          <MessageCircle className="w-5 h-5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-20 left-6 z-50 w-80 h-96">
      <Card className="h-full flex flex-col shadow-xl">
        <div className="flex items-center justify-between p-4 border-b bg-primary text-primary-foreground rounded-t-lg">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            <span className="font-semibold">{t('chatbotTitle')}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-64 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.isBot
                        ? 'bg-secondary text-secondary-foreground'
                        : 'bg-primary text-primary-foreground'
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-secondary text-secondary-foreground p-3 rounded-lg">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </CardContent>

        <div className="p-4 border-t">
          {showEmailForm ? (
            <div className="space-y-3">
              <Label htmlFor="chatbot-email">{t('chatbotEmail')}</Label>
              <Input
                id="chatbot-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    submitEmail();
                  }
                }}
              />
              <Button
                onClick={submitEmail}
                className="w-full"
                size="sm"
              >
                {t('chatbotSubmit')}
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t('chatbotPlaceholder')}
                disabled={isLoading || questionCount >= 3}
                className="flex-1"
              />
              <Button
                onClick={sendMessage}
                disabled={isLoading || !inputMessage.trim() || questionCount >= 3}
                size="sm"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Chatbot;