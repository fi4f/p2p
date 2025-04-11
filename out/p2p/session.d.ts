import Message from "./message";
import Request from "./request";
import Listener from "./listener";
import Trystero from "trystero";
export interface Session {
    readonly secret: string;
    readonly id: string;
    readonly pw: string;
    readonly is: "client" | "server";
    readonly clientIds: Set<string>;
    readonly clientId: string;
    serverId?: string;
    readonly requests: Map<string, Request>;
    readonly listeners: Map<string, Set<Listener<any>>>;
    readonly _trysteroRoom: Trystero.Room;
    readonly _trysteroTx: Trystero.ActionSender<Message<any>>;
    readonly _trysteroRx: Trystero.ActionReceiver<Message<any>>;
}
export declare namespace Session {
    const APPLICATION_ID: string;
    const __HELLO__ = "__hello__";
    const __WORLD__ = "__world__";
    const CLIENT_CONNECTED = "__client_connected__";
    const SERVER_CONNECTED = "__server_connected__";
    const CLIENT_DISCONNECTED = "__client_disconnected__";
    const SERVER_DISCONNECTED = "__server_disconnected__";
    function host(secret: string | [string, string], appId?: string): Session;
    function join(secret: string | [string, string], appId?: string): void;
    function on<T>(sesh: Session, type: string, listener: Listener<T>): void;
    function off<T>(sesh: Session, type: string, listener: Listener<T>): void;
    function send(sesh: Session, message: Message): void;
    function message(sesh: Session, type: string, data: any, to: string, o?: {
        reqId?: string;
        resId?: string;
    }): void;
    function request(sesh: Session, type: string, data: any, to: string, o?: {
        reqId?: string;
        resId?: string;
    }): Promise<unknown>;
    function getUniqueRequestId(sesh: Session): `${string}-${string}-${string}-${string}-${string}`;
    function requireListeners(sesh: Session, type: string): Set<Listener<any>>;
    function requestListeners(sesh: Session, type: string): Set<Listener<any>> | undefined;
    function resolveRequest(sesh: Session, reqId: string, a: any): void;
    function rejectRequest(sesh: Session, reqId: string, a?: any): void;
    function rejectRequestsFor(sesh: Session, peerId: string, a?: any): void;
    function hash(what: any, how?: string): Promise<string>;
}
export default Session;
