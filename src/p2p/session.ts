import p2p     from "."
import Secret  from "./secret"
import Message from "./message"
import Request from "./request"
import Version from "./version"

import Trystero from "trystero"


export interface Session {
  readonly secret: string
  readonly id    : string
  readonly pw    : string

  readonly _trysteroRoom: Trystero.Room
  readonly _trysteroTx  : Trystero.ActionSender  <Message>
  readonly _trysteroRx  : Trystero.ActionReceiver<Message>
}

export function Session(secret: Secret, appId=Session.DEFAULT_APPLICATION_ID): Session {
  secret = Secret.mend(secret)
  const
    id    = Secret.id(secret),
    pw    = Secret.pw(secret),
    _trysteroRoom = Trystero.joinRoom({ appId, password: pw }, id),
    [
      _trysteroTx,
      _trysteroRx
    ] = _trysteroRoom.makeAction<Message>(Message.ACTION);

  return {
    secret,
    id, pw,

    _trysteroRoom,
    _trysteroTx  ,
    _trysteroRx  
  }
}

export namespace Session {
  export const DEFAULT_APPLICATION_ID = Version.toString(p2p.VERSION)
}

export default Session;