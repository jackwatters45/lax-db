import type { PlayerWithContactInfoNonNullable } from '@lax-db/core/player/contact-info';

// TODO: need to move this to props
export const playerInfo = {
  id: '1',
  name: 'Jack Watters',
  age: '25',
  gradeLevel: null,
  heightFeet: 5,
  heightInches: 11,
  weightPounds: 180,
  primaryPosition: 'attack',
  developmentTrend: 'improving',
};
export type PlayerInfoType = typeof playerInfo;

export const contactInfo: PlayerWithContactInfoNonNullable = {
  id: '1',
  name: 'Jack Watters',
  email: 'jack.watters@example.com',
  // contact info
  phone: '9544949167',
  facebook: 'jack.watters45',
  groupme: '9544949167',
  whatsapp: '9544949167',
  instagram: 'jackwatters45',
  linkedin: 'jackwatters45',
  emergencyContactName: 'John Smith',
  emergencyContactPhone: '123-456-7890',
};
