import Version  from "@fi4f/v"

import p2p      from "."
import Secret   from "./secret"
import Message  from "./message"
import Request  from "./request"
import Listener from "./listener"

import Trystero from "trystero"
import { reject } from "lodash"

export interface Session {
  readonly secret: string
  readonly id    : string
  readonly pw    : string
  readonly is    : "client" | "server"

  readonly clientIds   : Set<string>
  readonly clientId    :     string
  readonly serverId   ?:     string
  readonly requests  : Map<string, Request>
  readonly listeners : Map<string, Set<Listener<any>>>

  readonly _trysteroRoom: Trystero.Room
  readonly _trysteroTx  : Trystero.ActionSender  <Message>
  readonly _trysteroRx  : Trystero.ActionReceiver<Message>
}

export namespace Session {
  export const APPLICATION_ID = Version.toString(p2p.VERSION)

  export const __HELLO__ = "__hello__"
  export const __WORLD__ = "__world__"
  export const CLIENT_CONNECTED    = "__client_connected__"
  export const SERVER_CONNECTED    = "__server_connected__"
  export const CLIENT_DISCONNECTED = "__client_disconnected__"
  export const SERVER_DISCONNECTED = "__server_disconnected__"

  export function host(secret: string | [string, string], appId=APPLICATION_ID) {
    secret = Secret.mend(secret)
    const
      id = Secret.id(secret),
      pw = Secret.pw(secret),
      is = "server" as const;

    const 
      _trysteroRoom = Trystero.joinRoom({appId, password: pw}, id),
      [
        _trysteroTx,
        _trysteroRx,
      ] = _trysteroRoom.makeAction<Message>(Message.ACTION);

    const sesh: Session = {
      secret, id, pw, is,

      clientIds: new Set(),
      clientId : Trystero.selfId,
      serverId : Trystero.selfId,
      requests : new Map(),
      listeners: new Map(),

      _trysteroRoom,
      _trysteroTx  ,
      _trysteroRx  ,
    }

    _trysteroRoom.onPeerLeave(peerId => {
      rejectRequestsFor(sesh, peerId)
    })

    _trysteroRoom.onPeerJoin (peerId => {

    })

    _trysteroRx((message, from) => serverRx(sesh, message, from))
    

    return sesh
  }

  export function join(secret: string | [string, string], appId=APPLICATION_ID) {
    secret = Secret.mend(secret)
    const
      id = Secret.id(secret),
      pw = Secret.pw(secret),
      is = "client" as const;

    const
      _trysteroRoom = Trystero.joinRoom({appId, password: pw}, id),
      [
        _trysteroTx,
        _trysteroRx,
      ] = _trysteroRoom.makeAction<Message>(Message.ACTION);

    const sesh: Session = {
      secret, id, pw, is,

      clientIds: new Set(),
      clientId : Trystero.selfId,
      // serverId : Trystero.selfId,
      requests : new Map(),
      listeners: new Map(),

      _trysteroRoom,
      _trysteroTx  ,
      _trysteroRx  ,
    }

    _trysteroRx((message, from) => clientRx(sesh, message, from))
  }

  function serverRx(sesh: Session, message: Message, from: string) {
    // always accept messages sent to myself
    if (message.to === sesh.clientId) 
      rx(sesh, message, from)
    // only forward messages to and from validated peers
    else if (
      sesh.clientIds.has(message.from) &&
      sesh.clientIds.has(message.to  )
    ) send(sesh, {...message, from })
  }

  function clientRx(sesh: Session, message: Message, from: string) {
    if (      
      from === sesh.clientId || // always accept messages from the client
      from === sesh.serverId || // always accept messages from the server
      // only accept __hello__ messages when the server is undefined
      (!sesh.serverId && message.type === "__hello__")
    ) rx(sesh, message, from)
  }

  function rx(sesh: Session, message: Message, from: string) {
    requestListeners(sesh, message.type)?.forEach(
      self => {
        const respond = (type: string, data: any) => {
          Session.message(sesh, type, data, message.from, { resId: message.reqId })
        }
        const request = (type: string, data: any) => {
          Session.request(sesh, type, data, message.from, { resId: message.reqId })
        }
        self(message, { self, from, respond, request })
      }
    )
  }

  function serverTx(sesh: Session, message: Message) {
    sesh._trysteroTx(message, message.to)
  }

  function clientTx(sesh: Session, message: Message) {
    if (sesh.serverId) sesh._trysteroTx(message, sesh.serverId)
    else             sesh._trysteroTx(message, message.to )
  }

  export function send(sesh: Session, message: Message) {
    if (sesh.is === "server") serverTx(sesh, message)
    else                      clientTx(sesh, message)
  }

  export function message(sesh: Session, type: string, data: any, to: string, o ?: { reqId ?: string, resId ?: string }) {
    send(sesh, {...o, from: sesh.clientId, type, data, to })
  }

  export function request(sesh: Session, type: string, data: any, to: string, o ?: { reqId ?: string, resId ?: string }) {
    const reqId = o?.reqId ?? getUniqueRequestId(sesh)
    return new Promise((res, rej) => {
      sesh.requests.set(reqId, { to, res, rej })
      message( sesh, type, data, to, { reqId } )
    })
  }

  export function getUniqueRequestId(sesh: Session) {
    let reqId = crypto.randomUUID()
    while(sesh.requests.has(reqId))
        reqId = crypto.randomUUID()
    return reqId
  }

  export function requireListeners(sesh: Session, type: string) {
    let listeners = sesh.listeners.get(type)
    if(!listeners) sesh.listeners.set(
      type, listeners = new Set()
    ) 
    return listeners
  }

  export function requestListeners(sesh: Session, type: string) {
    let listeners = sesh.listeners.get(type)
    // if(!listeners) sesh.listeners.set(
    //   type, listeners = new Set()
    // ) 
    return listeners
  }

  export function resolveRequest(sesh: Session, reqId: string, a  : any) {
    const request  =  sesh.requests.get(reqId)
    if(request && sesh.requests.delete(reqId))
      request.res(a)
  }

  export function rejectRequest (sesh: Session, reqId: string, a ?: any) {
    const request  =  sesh.requests.get(reqId)
    if(request && sesh.requests.delete(reqId))
      request.rej(a)
  }

  export function rejectRequestsFor(sesh: Session, peerId: string, a ?: any) {
    for(const [reqId, request] of sesh.requests)
      if(request.to === peerId)
        rejectRequest(sesh, reqId, a)
  }

  export async function hash(what: any, how = "SHA-256") {
    const data = new TextEncoder().encode(String(what))
    const hash = await crypto.subtle.digest(how , data)
    return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("")
  }
}

export default Session;