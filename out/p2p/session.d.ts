import Message from "./message";
import Request from "./request";
import Listener from "./listener";
import Trystero from "trystero";
export interface Session {
    readonly secret: string;
    readonly id: string;
    readonly pw: string;
    readonly is: "client" | "server";
    readonly peerIds: Set<string>;
    readonly selfId: string;
    hostId?: string;
    readonly requests: Map<string, Request>;
    readonly listeners: Map<string, Set<Listener<any>>>;
    readonly _trysteroRoom: Trystero.Room;
    readonly _trysteroTx: Trystero.ActionSender<Message>;
    readonly _trysteroRx: Trystero.ActionReceiver<Message>;
}
export declare namespace Session {
    interface Server extends Session {
        is: "server";
    }
    interface Client extends Session {
        is: "client";
    }
    const __HELLO__ = "__hello__";
    const __WORLD__ = "__world__";
    const CLIENT_CONNECTED = "__client_connected__";
    const SERVER_CONNECTED = "__server_connected__";
    const CLIENT_DISCONNECTED = "__client_disconnected__";
    const SERVER_DISCONNECTED = "__server_disconnected__";
    function host(secret: string | [string, string], appId?: string): Server;
    function join(secret: string | [string, string], appId?: string): void;
    function on<T>(sesh: Session, kind: string, listener: Listener<T>): void;
    function off<T>(sesh: Session, kind: string, listener: Listener<T>): void;
    /** Construct and send a message. */
    function message(sesh: Session, kind: string, data: any, to: string, o?: {
        reqId?: string;
        resId?: string;
    }): void;
    /** Construct and send a request. Returns a promise which resolves upon a response.*/
    function request(sesh: Session, kind: string, data: any, to: string, o?: {
        reqId?: string;
        resId?: string;
    }): Promise<unknown>;
}
export default Session;
