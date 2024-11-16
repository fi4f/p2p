import Session from "./session";

export interface Client {
  readonly sesh: Session
}

export function Client(sesh: Session): Client {
  return {
    sesh
  }
}

export namespace Client {
  export const CLIENT_CONNECTED    = "__client_connected__"
  export const SERVER_CONNECTED    = "__server_connected__"
  export const CLIENT_DISCONNECTED = "__client_disconnected__"
  export const SERVER_DISCONNECTED = "__server_disconnected__"
}

export default Client;