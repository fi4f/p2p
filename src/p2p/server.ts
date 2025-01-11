import p2p from ".";

import Secret   from "./secret" ;
import Session  from "./session";
import Message  from "./message";
import Request  from "./request";
import Listener from "./listener";

import Trystero, { selfId } from "trystero";

export interface Server extends Session {
  readonly is: "server"
}

export function Server(secret: Secret, appId=Session.APPLICATION_ID): Server {
  secret = Secret.mend(secret)
  const
    id = Secret.id(secret),
    pw = Secret.pw(secret),
    is = "server" as const;

  const 
    __trystero__room = Trystero.joinRoom({appId, password: pw}, id);
  const [
    __trystero__tx,
    __trystero__rx,
  ] = __trystero__room.makeAction<Message>(Message.ACTION);

  const server = {
    secret, id, pw, is,

    clientIds: new Set<string>(),
    clientId : selfId,
    serverId : selfId,
    requests : new Map<string, Request>(),
    listeners: new Map<string, Set<Listener<any>>>(),

    __trystero__room,
    __trystero__tx  ,
    __trystero__rx  ,
  }

  __trystero__room.onPeerLeave(async peerId => {
    // reject all pending requests from this peer
    for(const [requestId, request] of server.requests) {
      if(request.peerId === peerId)
        rejectRequest(server, requestId)
    }
  })

  __trystero__room.onPeerJoin (async peerId => {
    const
      __hello__ = await p2p.hash(  peerId ),
      __world__ = await p2p.hash(__hello__);
  })

  return server
}

export namespace Server {
  export function message(server: Server, type: string, data: any, to: string, o ?: { requestId?: string, responseId?: string }) {
    tx(server, { type, data, ...o }, to)
  }

  export function request(server: Server, type: string, data: any, to: string, o ?: { requestId?: string, responseId?: string }) {
    return new Promise((
      resolve: (a  : any) => void,
      reject : (a ?: any) => void,
    ) => {
      const requestId = getUniqueRequestId(server)
      
      tx(server, { type, data, ...o, requestId }, to)

      server.requests.set(requestId, {
        peerId: to,
        resolve, 
        reject ,
      })
    })
  }
}

/***************
 * PRIVATE API *
 ***************/

function tx(server: Server, message: Message, to: null | string | Array<string>) {
  server.__trystero__tx(message, to)
}

function rx(server: Server, message: Message, from: string) {

}

function queue(server: Server, message: Message, from: string) {

}

function flush(server: Server, message: Message, from: string) {

}

function onMessageReceived (server: Server, message: Message, from: string) {
  if(from === selfId || server.clientIds.has(from))
    _on(sesh, message, from)
  else if(message.type === '__world__')
    _on(sesh, message, from)
}

function onMessageValidated(server: Server, message: Message, from: string) {

}

function getUniqueRequestId(sesh: Server) {
  let requestId = crypto.randomUUID( )
  while(sesh.requests.has(requestId))
      requestId = crypto.randomUUID( )
  return requestId
}

function resolveRequest(sesh: Server, requestId: string, value  : any) {
  const request = sesh.requests.get(requestId)
  if(request && sesh.requests.delete(requestId))
    request.resolve(value)
}

function rejectRequest (sesh: Server, requestId: string, value ?: any) {
  const request = sesh.requests.get(requestId)
  if(request && sesh.requests.delete(requestId))
    request.reject(value)
}

function getListeners(sesh: Server, type: string): Set<Listener<any>> {
  let listeners = sesh.listeners.get(type)
  if(!listeners) sesh.listeners.set(
    type, listeners = new Set()
  ) 
  return listeners
}



export default Server;