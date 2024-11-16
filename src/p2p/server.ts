import Session from "./session";

export interface Server {
  readonly sesh: Session
}

export function Server(sesh: Session): Server {
  const server = {
    sesh
  }

  sesh._trysteroRoom.onPeerJoin (peerId => {
    // send handshake and await response
    

  })
  sesh._trysteroRoom.onPeerLeave(peerId => {

  })

  Server.on(Server.CLIENT_CONNECTED   , () => {

  })

  Server.on(Server.CLIENT_DISCONNECTED, () => {
    
  })

  return server
}

export namespace Server {
  export const CLIENT_CONNECTED    = "__client_connected__"
  export const CLIENT_DISCONNECTED = "__client_disconnected__"

  export function on (kind: string, then: any) {

  }

  export function off(kind: string, then: any) {

  }

  export function message(kind: string, data: any, resId ?: string, reqId ?: string) {
    
  }
}

export default Server;