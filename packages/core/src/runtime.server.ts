import { Layer, ManagedRuntime } from 'effect';
import { DatabaseLive } from './drizzle';
import { FeedbackService } from './feedback';
import { GameService } from './game';
import { OrganizationService } from './organization';
import { PlayerService } from './player';
import { PlayerContactInfoService } from './player/contact-info/index';
import { RedisService } from './redis';
import { SeasonService } from './season';
import { TeamService } from './team';
import { UserService } from './user';

const MainLayer = Layer.mergeAll(
  RedisService.Default,
  DatabaseLive,
  OrganizationService.Default,
  TeamService.Default,
  SeasonService.Default,
  GameService.Default,
  UserService.Default,
  PlayerService.Default,
  PlayerContactInfoService.Default,
  FeedbackService.Default,
);

export const RuntimeServer = ManagedRuntime.make(MainLayer);
