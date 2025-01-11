import p2p      from "."
import Message  from "./message"
import Request  from "./request"
import Version  from "./version"
import Listener from "./listener"

import Trystero from "trystero"

export interface Session {
  readonly secret: string
  readonly id    : string
  readonly pw    : string
  readonly is    : "client" | "server"

  readonly clientIds: Set<string>
  readonly clientId :     string
           serverId :     string
  readonly requests : Map<string, Request>
  readonly listeners: Map<string, Set<Listener<any>>>

  readonly __trystero__room: Trystero.Room
  readonly __trystero__tx  : Trystero.ActionSender  <Message>
  readonly __trystero__rx  : Trystero.ActionReceiver<Message>
}

export namespace Session {
  export const APPLICATION_ID = Version.toString(p2p.VERSION)
}

export default Session;