// Defining middleware
// To add middleware to the RPC server (& optionally the client), you can use the RpcMiddleware module.

// The first step is to define the middleware context tag, which is used to both implement and access the middleware.

// // middleware.ts
// import { RpcMiddleware } from "@effect/rpc"
// import { Context } from "effect"
// import type { User } from "./request.js"

// // A context tag which represents the current user
// export class CurrentUser extends Context.Tag("CurrentUser")<
//   CurrentUser,
//   User
// >() {}

// // The context tag for the authentication middleware
// export class AuthMiddleware extends RpcMiddleware.Tag<AuthMiddleware>()(
//   "AuthMiddleware",
//   {
//     // This middleware will provide the current user context
//     provides: CurrentUser,
//     // This middleware requires a client implementation too
//     requiredForClient: true
//   }
// ) {}
// Implementing middleware
// Once the middleware context tag is defined, you can then use it in a RpcGroup to apply it to various RPCs.

// When it has been applied, you can then implement the middleware logic and add it to your server and client.

// import { Headers } from "@effect/platform"
// import { Rpc, RpcClient, RpcGroup, RpcMiddleware, RpcServer } from "@effect/rpc"
// import { Effect, Layer, Schema } from "effect"
// import { AuthMiddleware } from "./middleware.js"
// import { User } from "./request.js"

// export class UserRpcs extends RpcGroup.make(
//   Rpc.make("UserById", {
//     success: User,
//     payload: {
//       id: Schema.String
//     }
//   })
//     // apply the middleware to a single RPC
//     .middleware(AuthMiddleware)
// )
//   // or apply the middleware to the entire group
//   .middleware(AuthMiddleware) {}

// // Implement the middleware for a server
// export const AuthLive: Layer.Layer<AuthMiddleware> = Layer.succeed(
//   AuthMiddleware,
//   // A middleware that provides the current user.
//   //
//   // You can access the headers, payload, and the RPC definition when
//   // implementing the middleware.
//   AuthMiddleware.of(({ headers, payload, rpc }) =>
//     Effect.succeed(new User({ id: "123", name: "Logged in user" }))
//   )
// )

// // apply the middleware to a rpc server
// RpcServer.layer(UserRpcs).pipe(Layer.provide(AuthLive))

// // Implement the middleware for a client
// //
// // The client middleware can access the request and the RPC definition, and
// // returns a modified request.
// export const AuthClientLive: Layer.Layer<
//   RpcMiddleware.ForClient<AuthMiddleware>
// > = RpcMiddleware.layerClient(AuthMiddleware, ({ request, rpc }) =>
//   Effect.succeed({
//     ...request,
//     headers: Headers.set(request.headers, "authorization", "Bearer token")
//   })
// )

// // apply the middleware to a rpc client
// export class UsersClient extends Effect.Service<UsersClient>()("UsersClient", {
//   scoped: RpcClient.make(UserRpcs),
//   // add the middleware layer to the dependencies
//   dependencies: [AuthClientLive]
// }) {}
