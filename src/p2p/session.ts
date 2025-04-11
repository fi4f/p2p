import Version  from "@fi4f/v"

import p2p      from "."
import Secret   from "./secret"
import Message  from "./message"
import Request  from "./request"
import Listener from "./listener"

import Trystero from "trystero"

export interface Session {
  readonly secret: string
  readonly id    : string
  readonly pw    : string
  readonly is    : "client" | "server"

  readonly peerIds   : Set<string>
  readonly selfId    :     string
           hostId   ?:     string
  readonly requests  : Map<string, Request>
  readonly listeners : Map<string, Set<Listener<any>>>

  readonly _trysteroRoom: Trystero.Room
  readonly _trysteroTx  : Trystero.ActionSender  <Message>
  readonly _trysteroRx  : Trystero.ActionReceiver<Message>
}

export namespace Session {

  export interface Server extends Session {
    is: "server"
  }

  export interface Client extends Session {
    is: "client"
  }

  export const __HELLO__ = "__hello__"
  export const __WORLD__ = "__world__"
  export const CLIENT_CONNECTED    = "__client_connected__"
  export const SERVER_CONNECTED    = "__server_connected__"
  export const CLIENT_DISCONNECTED = "__client_disconnected__"
  export const SERVER_DISCONNECTED = "__server_disconnected__"

  export function host(secret: string | [string, string], appId=Version.toString(p2p.VERSION)) {
    secret = Secret.mend(secret)
    const
      id = Secret.id(secret),
      pw = Secret.pw(secret);

    const 
      _trysteroRoom = Trystero.joinRoom({appId, password: pw}, id),
      [
        _trysteroTx,
        _trysteroRx,
      ] = _trysteroRoom.makeAction<Message>(Message.ACTION);

    const sesh: Server = {
      secret, id, pw, is: "server",

      peerIds  : new Set(),
      selfId   : Trystero.selfId,
      hostId   : Trystero.selfId,
      requests : new Map(),
      listeners: new Map(),

      _trysteroRoom,
      _trysteroTx  ,
      _trysteroRx  ,
    }

    // handle peer disconnections
    _trysteroRoom.onPeerLeave(leftId => {

      // reject outbound requests for the peer
      rejectRequestsFor(sesh, leftId)
      
      if (sesh.peerIds.delete(leftId)) {
        // notify all peers of the disconnection
        sesh.peerIds.forEach(peerId => {
          message(sesh, CLIENT_DISCONNECTED, leftId,      peerId)
        })
          message(sesh, CLIENT_DISCONNECTED, leftId, sesh.selfId)
      }
    })

    // handle peer connections
    _trysteroRoom.onPeerJoin (async newId => {
      // compute the __hello__ and __world__ hashes based on the peerId
      const __hello__ = await hash(  newId  )
      const __world__ = await hash(__hello__)
      try {
        // wait for peer to respond with the correct hash
        if (await request(sesh, __HELLO__, __hello__, newId) === __world__) {
          // notify all peers of the connection
          sesh.peerIds.forEach(peerId => {            
            message(sesh, CLIENT_CONNECTED, newId , peerId)
            message(sesh, CLIENT_CONNECTED, peerId, newId )
          })
          // add the peer to the list of peers
          sesh.peerIds.add(newId)

          message(sesh, CLIENT_CONNECTED, newId, sesh.selfId)
        }
      } catch(e) {
        // do nothing
      }
    })

    _trysteroRx((message, from) => onServerReceive(sesh, message, from))

    return sesh
  }

  export function join(secret: string | [string, string], appId=Version.toString(p2p.VERSION)) {
    secret = Secret.mend(secret)
    const
      id = Secret.id(secret),
      pw = Secret.pw(secret);

    const
      _trysteroRoom = Trystero.joinRoom({appId, password: pw}, id),
      [
        _trysteroTx,
        _trysteroRx,
      ] = _trysteroRoom.makeAction<Message>(Message.ACTION);

    const sesh: Client = {
      secret, id, pw, is: "client",

      peerIds  : new Set(),
      selfId   : Trystero.selfId,
      // hostId   : Trystero.selfId,
      requests : new Map(),
      listeners: new Map(),

      _trysteroRoom,
      _trysteroTx  ,
      _trysteroRx  ,
    }

    _trysteroRoom.onPeerLeave(peerId => {
      // reject outbound requests for the peer
      rejectRequestsFor(sesh, peerId)

      // notify all peers of the disconnection
      if (sesh.peerIds.delete(peerId) && sesh.hostId === peerId) {
        sesh.hostId = undefined
        message(sesh, SERVER_DISCONNECTED, peerId, sesh.selfId)
      }
    })

    on<string>(sesh, __HELLO__, async (hello, {from, respond}) => {
      if(sesh.hostId) return
      
      const __hello__ = await hash(sesh.selfId)
      const __world__ = await hash(  __hello__  )

      if(hello === __hello__) {
        sesh.hostId = from
        respond(__WORLD__, __world__)
        message(sesh, SERVER_CONNECTED, from, sesh.selfId)
      }
    })

    _trysteroRx((message, from) => onClientReceive(sesh, message, from))
  }

  export function on  <T>(sesh: Session, kind: string, listener: Listener<T>) {
    requireListeners(sesh, kind) .add   (listener)
  }

  export function off <T>(sesh: Session, kind: string, listener: Listener<T>) {
    requestListeners(sesh, kind)?.delete(listener)
  }

  /** Construct and send a message. */
  export function message(sesh: Session, kind: string, data: any, to: string, o ?: { reqId ?: string, resId ?: string }) {
    send(sesh, {...o, by: sesh.selfId, kind, data, to })
  }

  /** Construct and send a request. Returns a promise which resolves upon a response.*/
  export function request(sesh: Session, kind: string, data: any, to: string, o ?: { reqId ?: string, resId ?: string }) {
    const reqId = o?.reqId ?? unique(sesh.requests)
    return new Promise((res, rej) => {
      sesh.requests.set(reqId, { to, res, rej })
      message( sesh, kind, data, to, { reqId } )
    })
  }

  /***************
   * PRIVATE API *
   ***************/

  /** Send a message */
  function send(sesh: Session, message: Message) {
    if (sesh.is === "server") serverSend(sesh, message)
    else                      clientSend(sesh, message)
  }

  /** Send a message as a server. */
  function serverSend(sesh: Session, message: Message) {
    if(message.to === sesh.selfId) 
      onServerReceive (sesh, message, message.by)
    else
      sesh._trysteroTx(      message, message.to)
  }

  /** Send a message as a client. */
  function clientSend(sesh: Session, message: Message) {
    if(message.to === sesh.selfId) 
      onClientReceive(sesh, message, message.by)
    else
      // if client has registered a host peer, forward through them
      if (sesh.hostId) sesh._trysteroTx(message, sesh.hostId)
      else             sesh._trysteroTx(message, message.to )
  }

  /** Handle incoming messages as a server. */
  function onServerReceive(sesh: Session, message: Message, from: string) {
    // 
    if(
      message.kind === __WORLD__ || // accept __world__ messages from all       peers
      sesh.peerIds.has(   from   )  // accept   other   messages from validated peers
    ) onReceive(sesh, message, from)
  }

  /** Handle incoming messages as a client. */
  function onClientReceive(sesh: Session, message: Message, from: string) {
    if (      
      from === sesh.selfId || // always accept messages from the self
      from === sesh.hostId || // always accept messages from the host
      // only accept __hello__ messages when the host is undefined
      (!sesh.hostId && message.kind === __HELLO__)
    ) onReceive(sesh, message, from)
  }  

  /** Handle incoming messages */
  function onReceive(sesh: Session, message: Message, from: string) {
    // resolve pending requests with matching id
    if (message.resId) resolveRequest(sesh, message.resId, message.data)

    // invoke listeners of the specified kind
    requestListeners(sesh, message.kind)?.forEach(
      self => self(message.data, { ...message, self, from, 
        respond: responder(sesh, message),
        request: requester(sesh, message),
      })
    )
  }

  /** Construct a responder function for the specified message. */
  function responder(sesh: Session, message: Message) {
    return (kind: string, data: any) => {
      Session.message(sesh, kind, data, message.by, { resId: message.reqId })
    }
  }

  /** Construct a requester function for the specified message. */
  function requester(sesh: Session, message: Message) {
    return (kind: string, data: any) => {
      Session.request(sesh, kind, data, message.by, { resId: message.reqId })
    }
  }

  /** Generate a unique identifier, given a set of identifiers. */
  function unique(ids: Set<string> | Map<string, any>) {
    let id = crypto.randomUUID()
    while(ids.has(id))
        id = crypto.randomUUID()
    return id
  }

  /** Retrieve listeners of the specified kind, creating them if they don't exist. */
  function requireListeners(sesh: Session, kind: string) {
    let listeners = sesh.listeners.get(kind)
    if(!listeners) sesh.listeners.set(
      kind, listeners = new Set()
    ) 
    return listeners
  }

  /** Retrieve listeners of the specified kind, if they exist. */
  function requestListeners(sesh: Session, kind: string) {
    let listeners = sesh.listeners.get(kind)
    return listeners
  }

  /** Resolve the specified request with an optional value. */
  function resolveRequest(sesh: Session, reqId: string, a  : any) {
    const request  =  sesh.requests.get(reqId)
    if(request && sesh.requests.delete(reqId))
      request.res(a)
  }

  /** Reject the specified request with an optional value. */
  function rejectRequest (sesh: Session, reqId: string, a ?: any) {
    const request  =  sesh.requests.get(reqId)
    if(request && sesh.requests.delete(reqId))
      request.rej(a)
  }

  /** Reject all outbound requests for the specified peer. */
  function rejectRequestsFor(sesh: Session, peerId: string, a ?: any) {
    for(const [reqId, request] of sesh.requests)
      if(request.to === peerId)
        rejectRequest(sesh, reqId, a)
  }

  /** Quickly hash a value using the specified algorithm. */
  async function hash(what: any, how = "SHA-256") {
    const data = new TextEncoder().encode(String(what))
    const hash = await crypto.subtle.digest(how , data)
    return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("")
  }
}

export default Session;