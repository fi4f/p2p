import p2p from ".";
import Session from "./session";
import Version from "./version";

export interface Client extends Session {
  readonly is: "client"
}

export function Client(secret: Secret, appId=Session.APPLICATION_ID): Client {

}

export namespace Client {
  export const CLIENT_CONNECTED    = "__client_connected__"
  export const SERVER_CONNECTED    = "__server_connected__"
  export const CLIENT_DISCONNECTED = "__client_disconnected__"
  export const SERVER_DISCONNECTED = "__server_disconnected__"
}

export default Client;