import type {
  Member,
  Organization,
  Team,
  TeamMember,
} from 'better-auth/plugins';
import { Schema } from 'effect';

export class CreateOrganizationInput extends Schema.Class<CreateOrganizationInput>(
  'CreateOrganizationInput',
)({
  name: Schema.String,
  slug: Schema.String,
}) {}

export class AcceptInvitationInput extends Schema.Class<AcceptInvitationInput>(
  'AcceptInvitationInput',
)({
  invitationId: Schema.String,
}) {}

// Dashboard-specific type
export interface DashboardData {
  activeOrganization: Organization;
  teams: (Team & { members: TeamMember[] })[];
  activeMember: Member | null;
  canManageTeams: boolean;
}
