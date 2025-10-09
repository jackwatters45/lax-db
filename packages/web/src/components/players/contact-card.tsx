import {
  Copy,
  ExternalLink,
  Facebook,
  Linkedin,
  Mail,
  MessageCircle,
  Phone,
} from 'lucide-react';
import { createContext, useContext } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { InstagramIcon } from '../social-icons';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from '../ui/item';

type ContactCardContextType = {
  label: string;
  value: string;
  href?: string;
};

const ContactCardContext = createContext<ContactCardContextType | null>(null);

function useContactCard() {
  const context = useContext(ContactCardContext);
  if (!context) {
    throw new Error('ContactCard components must be used within ContactCard');
  }
  return context;
}

type ContactCardProps = {
  children: React.ReactNode;
  className?: string;
  label: string;
  value: string;
  href?: string;
};

function ContactCard({
  children,
  className,
  label,
  value,
  href,
}: ContactCardProps) {
  return (
    <ContactCardContext.Provider value={{ label, value, href }}>
      <Item
        variant={'outline'}
        className={`w-full items-center justify-between gap-2 p-2 shadow-sm hover:shadow-md transition-shadow ${className || ''}`}
      >
        {children}
      </Item>
    </ContactCardContext.Provider>
  );
}

type ContactCardContentProps = {
  children: React.ReactNode;
};

function ContactCardContent({ children }: ContactCardContentProps) {
  return (
    <ItemContent className="flex-row items-center gap-2">
      {children}
    </ItemContent>
  );
}

type ContactCardIconProps = {
  children: React.ReactNode;
};

function ContactCardIcon({ children }: ContactCardIconProps) {
  return <ItemMedia variant="icon">{children}</ItemMedia>;
}

function ContactCardData() {
  return (
    <ItemGroup>
      <ContactCardLabel />
      <ContactCardValue />
    </ItemGroup>
  );
}

function ContactCardLabel() {
  const { label } = useContactCard();
  return (
    <ItemTitle className="text-xs text-muted-foreground">{label}</ItemTitle>
  );
}

function ContactCardValue() {
  const { href, value } = useContactCard();
  return href ? (
    <a
      href={href}
      target={href.startsWith('http') ? '_blank' : undefined}
      rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
      className="text-blue-600 hover:underline text-sm font-medium break-all"
    >
      {value}
    </a>
  ) : (
    <span className="text-sm font-medium break-all">{value}</span>
  );
}

function ContactCardActions() {
  const { value, label, href } = useContactCard();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <TooltipProvider>
      <ItemActions className="gap-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-6 w-6 p-0"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Copy value</p>
          </TooltipContent>
        </Tooltip>
        {href && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" asChild className="h-6 w-6 p-0">
                <a
                  href={href}
                  target={href.startsWith('http') ? '_blank' : undefined}
                  rel={
                    href.startsWith('http') ? 'noopener noreferrer' : undefined
                  }
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Open link</p>
            </TooltipContent>
          </Tooltip>
        )}
      </ItemActions>
    </TooltipProvider>
  );
}

type EmailContactCardProps = {
  email: string;
};

function EmailContactCard({ email }: EmailContactCardProps) {
  return (
    <ContactCard label="Email" value={email} href={`mailto:${email}`}>
      <ContactCardContent>
        <ContactCardIcon>
          <Mail className="h-4 w-4 text-muted-foreground" />
        </ContactCardIcon>
        <ContactCardData />
      </ContactCardContent>
      <ContactCardActions />
    </ContactCard>
  );
}

type PhoneContactCardProps = {
  phone: string;
};

function PhoneContactCard({ phone }: PhoneContactCardProps) {
  return (
    <ContactCard label="Phone" value={phone} href={`tel:${phone}`}>
      <ContactCardContent>
        <ContactCardIcon>
          <Phone className="h-4 w-4 text-muted-foreground" />
        </ContactCardIcon>
        <ContactCardData />
      </ContactCardContent>
      <ContactCardActions />
    </ContactCard>
  );
}

type FacebookContactCardProps = {
  username: string;
};

function FacebookContactCard({ username }: FacebookContactCardProps) {
  return (
    <ContactCard
      label="Facebook"
      value={username}
      href={`https://facebook.com/${username}`}
    >
      <ContactCardContent>
        <ContactCardIcon>
          <Facebook className="h-4 w-4 text-muted-foreground" />
        </ContactCardIcon>
        <ContactCardData />
      </ContactCardContent>
      <ContactCardActions />
    </ContactCard>
  );
}

type InstagramContactCardProps = {
  username: string;
};

function InstagramContactCard({ username }: InstagramContactCardProps) {
  return (
    <ContactCard
      label="Instagram"
      value={`@${username}`}
      href={`https://instagram.com/${username}`}
    >
      <ContactCardContent>
        <ContactCardIcon>
          <InstagramIcon className="h-4 w-4 text-muted-foreground" />
        </ContactCardIcon>
        <ContactCardData />
      </ContactCardContent>
      <ContactCardActions />
    </ContactCard>
  );
}

type WhatsAppContactCardProps = {
  phone: string;
};

function WhatsAppContactCard({ phone }: WhatsAppContactCardProps) {
  return (
    <ContactCard label="WhatsApp" value={phone} href={`https://wa.me/${phone}`}>
      <ContactCardContent>
        <ContactCardIcon>
          <MessageCircle className="h-4 w-4 text-muted-foreground" />
        </ContactCardIcon>
        <ContactCardData />
      </ContactCardContent>
      <ContactCardActions />
    </ContactCard>
  );
}

type GroupMeContactCardProps = {
  username: string;
};

function GroupMeContactCard({ username }: GroupMeContactCardProps) {
  return (
    <ContactCard
      label="GroupMe"
      value={username}
      href={`https://groupme.com/contact/${username}`}
    >
      <ContactCardContent>
        <ContactCardIcon>
          <MessageCircle className="h-4 w-4 text-muted-foreground" />
        </ContactCardIcon>
        <ContactCardData />
      </ContactCardContent>
      <ContactCardActions />
    </ContactCard>
  );
}

type LinkedInContactCardProps = {
  username: string;
};

function LinkedInContactCard({ username }: LinkedInContactCardProps) {
  return (
    <ContactCard
      label="LinkedIn"
      value={username}
      href={`https://linkedin.com/in/${username}`}
    >
      <ContactCardContent>
        <ContactCardIcon>
          <Linkedin className="h-4 w-4 text-muted-foreground" />
        </ContactCardIcon>
        <ContactCardData />
      </ContactCardContent>
      <ContactCardActions />
    </ContactCard>
  );
}

type EmergencyContactNameCardProps = {
  name: string;
};

function EmergencyContactNameCard({ name }: EmergencyContactNameCardProps) {
  return (
    <ContactCard label="Emergency Contact Name" value={name}>
      <ContactCardContent>
        <ContactCardIcon>
          <Phone className="h-4 w-4 text-muted-foreground" />
        </ContactCardIcon>
        <ContactCardData />
      </ContactCardContent>
      <ContactCardActions />
    </ContactCard>
  );
}

type EmergencyContactPhoneCardProps = {
  phone: string;
};

function EmergencyContactPhoneCard({ phone }: EmergencyContactPhoneCardProps) {
  return (
    <ContactCard
      label="Emergency Contact Phone"
      value={phone}
      href={`tel:${phone}`}
    >
      <ContactCardContent>
        <ContactCardIcon>
          <Phone className="h-4 w-4 text-muted-foreground" />
        </ContactCardIcon>
        <ContactCardData />
      </ContactCardContent>
      <ContactCardActions />
    </ContactCard>
  );
}

export {
  ContactCard,
  ContactCardActions,
  ContactCardContent,
  ContactCardData,
  ContactCardIcon,
  ContactCardLabel,
  ContactCardValue,
  EmailContactCard,
  EmergencyContactNameCard,
  EmergencyContactPhoneCard,
  FacebookContactCard,
  GroupMeContactCard,
  InstagramContactCard,
  LinkedInContactCard,
  PhoneContactCard,
  WhatsAppContactCard,
};
