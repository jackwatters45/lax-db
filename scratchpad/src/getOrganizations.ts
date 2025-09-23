// getActiveOrganization: (userId: string) =>
//   Effect.gen(function* () {
//     const dbService = yield* DatabaseService;

//     // First, try to get the active organization from the session
//     const session = yield* Effect.tryPromise(() =>
//       dbService.db
//         .select({
//           activeOrganizationId: sessionTable.activeOrganizationId,
//         })
//         .from(sessionTable)
//         .where(eq(sessionTable.userId, userId))
//         .limit(1),
//     ).pipe(
//       Effect.mapError(
//         (cause) =>
//           new TeamsError(
//             cause,
//             'Failed to query session for active organization',
//           ),
//       ),
//     );

//     if (session.length > 0 && session[0]?.activeOrganizationId) {
//       // Get the organization details
//       const organization = yield* Effect.tryPromise(() =>
//         dbService.db
//           .select()
//           .from(organizationTable)
//           .where(
//             eq(organizationTable.id, session[0]?.activeOrganizationId!),
//           )
//           .limit(1),
//       ).pipe(
//         Effect.mapError(
//           (cause) =>
//             new TeamsError(cause, 'Failed to get organization details'),
//         ),
//       );

//       if (organization.length > 0) {
//         return organization[0] as Organization;
//       }
//     }

//     // If no active organization found, get user's organizations from member table
//     const userMemberships = yield* Effect.tryPromise(() =>
//       dbService.db
//         .select({
//           organizationId: memberTable.organizationId,
//           role: memberTable.role,
//         })
//         .from(memberTable)
//         .where(eq(memberTable.userId, userId)),
//     ).pipe(
//       Effect.mapError(
//         (cause) =>
//           new TeamsError(cause, 'Failed to get user memberships'),
//       ),
//     );

//     if (userMemberships.length === 0) {
//       throw new TeamsError(
//         'No organizations found',
//         'No organizations found',
//       );
//     }

//     // Get the first organization's details
//     const firstMembership = userMemberships[0];
//     if (!firstMembership) {
//       throw new TeamsError('No membership found', 'No membership found');
//     }

//     const organization = yield* Effect.tryPromise(() =>
//       dbService.db
//         .select()
//         .from(organizationTable)
//         .where(eq(organizationTable.id, firstMembership.organizationId))
//         .limit(1),
//     ).pipe(
//       Effect.mapError(
//         (cause) =>
//           new TeamsError(cause, 'Failed to get organization details'),
//       ),
//     );

//     if (organization.length === 0) {
//       throw new TeamsError(
//         'Organization not found',
//         'Organization not found',
//       );
//     }

//     const org = organization[0];
//     if (!org) {
//       throw new TeamsError(
//         'Organization data is invalid',
//         'Organization data is invalid',
//       );
//     }

//     // Set this organization as active in the session
//     yield* Effect.tryPromise(() =>
//       dbService.db
//         .update(sessionTable)
//         .set({
//           activeOrganizationId: org.id,
//           updatedAt: new Date(),
//         })
//         .where(eq(sessionTable.userId, userId)),
//     ).pipe(
//       Effect.mapError(
//         (cause) =>
//           new TeamsError(cause, 'Failed to set active organization'),
//       ),
//     );

//     return org as Organization;
//   }),
