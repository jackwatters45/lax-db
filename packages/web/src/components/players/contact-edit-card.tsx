import { Facebook, Linkedin, Mail, MessageCircle, Phone } from 'lucide-react';
import { createContext, useContext } from 'react';
import type { FieldValues, UseFormReturn } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { InstagramIcon, SOCIAL_PLATFORM_CONFIG } from '../social-icons';

type ContactEditCardContextType<T extends FieldValues = any> = {
  form: UseFormReturn<T>;
  name: keyof T;
  label: string;
  prefix?: string;
};

const ContactEditCardContext = createContext<ContactEditCardContextType | null>(
  null,
);

function useContactEditCard<T extends FieldValues = any>() {
  const context = useContext(ContactEditCardContext);
  if (!context) {
    throw new Error(
      'ContactEditCard components must be used within ContactEditCard',
    );
  }
  return context as ContactEditCardContextType<T>;
}

type ContactEditCardProps<T extends FieldValues = any> = {
  children: React.ReactNode;
  form: UseFormReturn<T>;
  name: keyof T;
  label: string;
  prefix?: string;
};

function ContactEditCard<T extends FieldValues>({
  children,
  form,
  name,
  label,
  prefix,
}: ContactEditCardProps<T>) {
  return (
    <ContactEditCardContext.Provider value={{ form, name, label, prefix }}>
      {children}
    </ContactEditCardContext.Provider>
  );
}

function ContactEditCardField() {
  const { form, name, prefix } = useContactEditCard();

  return (
    <FormField
      control={form.control}
      name={name as any}
      render={({ field }) => (
        <FormItem>
          <ContactEditCardLabel />
          <ContactEditCardInput icon={null} prefix={prefix} field={field} />
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function ContactEditCardLabel() {
  const { label } = useContactEditCard();
  return (
    <FormLabel className="text-xs font-medium text-muted-foreground">
      {label}
    </FormLabel>
  );
}

type ContactEditCardInputProps = {
  icon: React.ReactNode;
  prefix?: string;
  field: any;
};

function ContactEditCardInput({
  icon,
  prefix,
  field,
}: ContactEditCardInputProps) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <FormControl>
        {prefix ? (
          <div className="flex flex-1 items-center border rounded-md">
            <span className="px-3 text-sm text-muted-foreground bg-muted border-r h-8 flex items-center">
              {prefix}
            </span>
            <Input
              {...field}
              className="h-8 text-sm border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
        ) : (
          <Input {...field} className="h-8 text-sm" />
        )}
      </FormControl>
    </div>
  );
}

type ContactEditCardIconProps = {
  children: React.ReactNode;
};

function ContactEditCardIcon({ children }: ContactEditCardIconProps) {
  const { form, name, prefix } = useContactEditCard();

  return (
    <FormField
      control={form.control}
      name={name as any}
      render={({ field }) => (
        <FormItem>
          <ContactEditCardLabel />
          <ContactEditCardInput icon={children} prefix={prefix} field={field} />
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// Individual card components
type EmailEditCardProps<T extends FieldValues = any> = {
  form: UseFormReturn<T>;
};

export function EmailEditCard<T extends FieldValues>({
  form,
}: EmailEditCardProps<T>) {
  return (
    <ContactEditCard form={form} name={'email' as keyof T} label="Email">
      <ContactEditCardIcon>
        <Mail className="h-4 w-4 text-muted-foreground" />
      </ContactEditCardIcon>
    </ContactEditCard>
  );
}

type PhoneEditCardProps<T extends FieldValues = any> = {
  form: UseFormReturn<T>;
};

export function PhoneEditCard<T extends FieldValues>({
  form,
}: PhoneEditCardProps<T>) {
  return (
    <ContactEditCard form={form} name={'phone' as keyof T} label="Phone">
      <ContactEditCardIcon>
        <Phone className="h-4 w-4 text-muted-foreground" />
      </ContactEditCardIcon>
    </ContactEditCard>
  );
}

type FacebookEditCardProps<T extends FieldValues = any> = {
  form: UseFormReturn<T>;
};

export function FacebookEditCard<T extends FieldValues>({
  form,
}: FacebookEditCardProps<T>) {
  return (
    <ContactEditCard
      form={form}
      name={'facebook' as keyof T}
      label="Facebook"
      prefix={SOCIAL_PLATFORM_CONFIG.facebook.prefix}
    >
      <ContactEditCardIcon>
        <Facebook className="h-4 w-4 text-muted-foreground" />
      </ContactEditCardIcon>
    </ContactEditCard>
  );
}

type InstagramEditCardProps<T extends FieldValues = any> = {
  form: UseFormReturn<T>;
};

export function InstagramEditCard<T extends FieldValues>({
  form,
}: InstagramEditCardProps<T>) {
  return (
    <ContactEditCard
      form={form}
      name={'instagram' as keyof T}
      label="Instagram"
      prefix={SOCIAL_PLATFORM_CONFIG.instagram.prefix}
    >
      <ContactEditCardIcon>
        <InstagramIcon className="h-4 w-4 text-muted-foreground" />
      </ContactEditCardIcon>
    </ContactEditCard>
  );
}

type WhatsAppEditCardProps<T extends FieldValues = any> = {
  form: UseFormReturn<T>;
};

export function WhatsAppEditCard<T extends FieldValues>({
  form,
}: WhatsAppEditCardProps<T>) {
  return (
    <ContactEditCard
      form={form}
      name={'whatsapp' as keyof T}
      label="WhatsApp"
      prefix={SOCIAL_PLATFORM_CONFIG.whatsapp.prefix}
    >
      <ContactEditCardIcon>
        <MessageCircle className="h-4 w-4 text-muted-foreground" />
      </ContactEditCardIcon>
    </ContactEditCard>
  );
}

type GroupMeEditCardProps<T extends FieldValues = any> = {
  form: UseFormReturn<T>;
};

export function GroupMeEditCard<T extends FieldValues>({
  form,
}: GroupMeEditCardProps<T>) {
  return (
    <ContactEditCard
      form={form}
      name={'groupme' as keyof T}
      label="GroupMe"
      prefix={SOCIAL_PLATFORM_CONFIG.groupme.prefix}
    >
      <ContactEditCardIcon>
        <MessageCircle className="h-4 w-4 text-muted-foreground" />
      </ContactEditCardIcon>
    </ContactEditCard>
  );
}

type LinkedInEditCardProps<T extends FieldValues = any> = {
  form: UseFormReturn<T>;
};

export function LinkedInEditCard<T extends FieldValues>({
  form,
}: LinkedInEditCardProps<T>) {
  return (
    <ContactEditCard
      form={form}
      name={'linkedin' as keyof T}
      label="LinkedIn"
      prefix={SOCIAL_PLATFORM_CONFIG.linkedin.prefix}
    >
      <ContactEditCardIcon>
        <Linkedin className="h-4 w-4 text-muted-foreground" />
      </ContactEditCardIcon>
    </ContactEditCard>
  );
}

type EmergencyContactNameEditCardProps<T extends FieldValues = any> = {
  form: UseFormReturn<T>;
};

export function EmergencyContactNameEditCard<T extends FieldValues>({
  form,
}: EmergencyContactNameEditCardProps<T>) {
  return (
    <ContactEditCard
      form={form}
      name={'emergencyContactName' as keyof T}
      label="Emergency Contact Name"
    >
      <ContactEditCardIcon>
        <Phone className="h-4 w-4 text-muted-foreground" />
      </ContactEditCardIcon>
    </ContactEditCard>
  );
}

type EmergencyContactPhoneEditCardProps<T extends FieldValues = any> = {
  form: UseFormReturn<T>;
};

export function EmergencyContactPhoneEditCard<T extends FieldValues>({
  form,
}: EmergencyContactPhoneEditCardProps<T>) {
  return (
    <ContactEditCard
      form={form}
      name={'emergencyContactPhone' as keyof T}
      label="Emergency Contact Phone"
    >
      <ContactEditCardIcon>
        <Phone className="h-4 w-4 text-muted-foreground" />
      </ContactEditCardIcon>
    </ContactEditCard>
  );
}

export {
  ContactEditCard,
  ContactEditCardField,
  ContactEditCardLabel,
  ContactEditCardInput,
  ContactEditCardIcon,
};
