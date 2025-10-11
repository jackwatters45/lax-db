import { createFileRoute } from '@tanstack/react-router';
import { CreateOrganizationForm } from '@/components/organizations/create-form';

export const Route = createFileRoute('/_protected/organizations/create')({
  component: CreateOrganizationPage,
});

function CreateOrganizationPage() {
  return (
    <div className="container mx-auto max-w-2xl py-8">
      <div className="mb-8">
        <h1 className="font-bold text-3xl">Create Your Athletic Club</h1>
        <p className="text-muted-foreground">
          Set up your organization to start managing teams and players
        </p>
      </div>
      <CreateOrganizationForm />
    </div>
  );
}
