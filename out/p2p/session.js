"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Session = void 0;
const v_1 = __importDefault(require("@fi4f/v"));
const _1 = __importDefault(require("."));
const secret_1 = __importDefault(require("./secret"));
const message_1 = __importDefault(require("./message"));
const trystero_1 = __importDefault(require("trystero"));
var Session;
(function (Session) {
    Session.__HELLO__ = "__hello__";
    Session.__WORLD__ = "__world__";
    Session.CLIENT_CONNECTED = "__client_connected__";
    Session.SERVER_CONNECTED = "__server_connected__";
    Session.CLIENT_DISCONNECTED = "__client_disconnected__";
    Session.SERVER_DISCONNECTED = "__server_disconnected__";
    function host(secret, appId = v_1.default.toString(_1.default.VERSION)) {
        secret = secret_1.default.mend(secret);
        const id = secret_1.default.id(secret), pw = secret_1.default.pw(secret);
        const _trysteroRoom = trystero_1.default.joinRoom({ appId, password: pw }, id), [_trysteroTx, _trysteroRx,] = _trysteroRoom.makeAction(message_1.default.ACTION);
        const sesh = {
            secret, id, pw, is: "server",
            peerIds: new Set(),
            selfId: trystero_1.default.selfId,
            hostId: trystero_1.default.selfId,
            requests: new Map(),
            listeners: new Map(),
            _trysteroRoom,
            _trysteroTx,
            _trysteroRx,
        };
        // handle peer disconnections
        _trysteroRoom.onPeerLeave(leftId => {
            // reject outbound requests for the peer
            rejectRequestsFor(sesh, leftId);
            if (sesh.peerIds.delete(leftId)) {
                // notify all peers of the disconnection
                sesh.peerIds.forEach(peerId => {
                    message(sesh, Session.CLIENT_DISCONNECTED, leftId, peerId);
                });
                message(sesh, Session.CLIENT_DISCONNECTED, leftId, sesh.selfId);
            }
        });
        // handle peer connections
        _trysteroRoom.onPeerJoin((newId) => __awaiter(this, void 0, void 0, function* () {
            // compute the __hello__ and __world__ hashes based on the peerId
            const __hello__ = yield hash(newId);
            const __world__ = yield hash(__hello__);
            try {
                // wait for peer to respond with the correct hash
                if ((yield request(sesh, Session.__HELLO__, __hello__, newId)) === __world__) {
                    // notify all peers of the connection
                    sesh.peerIds.forEach(peerId => {
                        message(sesh, Session.CLIENT_CONNECTED, newId, peerId);
                        message(sesh, Session.CLIENT_CONNECTED, peerId, newId);
                    });
                    // add the peer to the list of peers
                    sesh.peerIds.add(newId);
                    message(sesh, Session.CLIENT_CONNECTED, newId, sesh.selfId);
                }
            }
            catch (e) {
                // do nothing
            }
        }));
        _trysteroRx((message, from) => onServerReceive(sesh, message, from));
        return sesh;
    }
    Session.host = host;
    function join(secret, appId = v_1.default.toString(_1.default.VERSION)) {
        secret = secret_1.default.mend(secret);
        const id = secret_1.default.id(secret), pw = secret_1.default.pw(secret);
        const _trysteroRoom = trystero_1.default.joinRoom({ appId, password: pw }, id), [_trysteroTx, _trysteroRx,] = _trysteroRoom.makeAction(message_1.default.ACTION);
        const sesh = {
            secret, id, pw, is: "client",
            peerIds: new Set(),
            selfId: trystero_1.default.selfId,
            // hostId   : Trystero.selfId,
            requests: new Map(),
            listeners: new Map(),
            _trysteroRoom,
            _trysteroTx,
            _trysteroRx,
        };
        _trysteroRoom.onPeerLeave(peerId => {
            // reject outbound requests for the peer
            rejectRequestsFor(sesh, peerId);
            // notify all peers of the disconnection
            if (sesh.peerIds.delete(peerId) && sesh.hostId === peerId) {
                sesh.hostId = undefined;
                message(sesh, Session.SERVER_DISCONNECTED, peerId, sesh.selfId);
            }
        });
        on(sesh, Session.__HELLO__, (hello_1, _a) => __awaiter(this, [hello_1, _a], void 0, function* (hello, { from, respond }) {
            if (sesh.hostId)
                return;
            const __hello__ = yield hash(sesh.selfId);
            const __world__ = yield hash(__hello__);
            if (hello === __hello__) {
                sesh.hostId = from;
                respond(Session.__WORLD__, __world__);
                message(sesh, Session.SERVER_CONNECTED, from, sesh.selfId);
            }
        }));
        _trysteroRx((message, from) => onClientReceive(sesh, message, from));
    }
    Session.join = join;
    function on(sesh, kind, listener) {
        requireListeners(sesh, kind).add(listener);
    }
    Session.on = on;
    function off(sesh, kind, listener) {
        var _a;
        (_a = requestListeners(sesh, kind)) === null || _a === void 0 ? void 0 : _a.delete(listener);
    }
    Session.off = off;
    /** Construct and send a message. */
    function message(sesh, kind, data, to, o) {
        send(sesh, Object.assign(Object.assign({}, o), { by: sesh.selfId, kind, data, to }));
    }
    Session.message = message;
    /** Construct and send a request. Returns a promise which resolves upon a response.*/
    function request(sesh, kind, data, to, o) {
        var _a;
        const reqId = (_a = o === null || o === void 0 ? void 0 : o.reqId) !== null && _a !== void 0 ? _a : unique(sesh.requests);
        return new Promise((res, rej) => {
            sesh.requests.set(reqId, { to, res, rej });
            message(sesh, kind, data, to, { reqId });
        });
    }
    Session.request = request;
    /***************
     * PRIVATE API *
     ***************/
    /** Send a message */
    function send(sesh, message) {
        if (sesh.is === "server")
            serverSend(sesh, message);
        else
            clientSend(sesh, message);
    }
    /** Send a message as a server. */
    function serverSend(sesh, message) {
        if (message.to === sesh.selfId)
            onServerReceive(sesh, message, sesh.selfId);
        else
            sesh._trysteroTx(message, message.to);
    }
    /** Send a message as a client. */
    function clientSend(sesh, message) {
        if (message.to === sesh.selfId)
            onClientReceive(sesh, message, sesh.selfId);
        else 
        // if client has registered a host peer, forward through them
        if (sesh.hostId)
            sesh._trysteroTx(message, sesh.hostId);
        else
            sesh._trysteroTx(message, message.to);
    }
    /** Handle incoming messages as a server. */
    function onServerReceive(sesh, message, from) {
        // 
        if (message.kind === Session.__WORLD__ || // accept __world__ messages from all       peers
            sesh.peerIds.has(from) // accept   other   messages from validated peers
        )
            onReceive(sesh, message, from);
    }
    /** Handle incoming messages as a client. */
    function onClientReceive(sesh, message, from) {
        if (from === sesh.selfId || // always accept messages from the self
            from === sesh.hostId || // always accept messages from the host
            // only accept __hello__ messages when the host is undefined
            (!sesh.hostId && message.kind === Session.__HELLO__))
            onReceive(sesh, message, from);
    }
    /** Handle incoming messages */
    function onReceive(sesh, message, from) {
        var _a;
        // resolve pending requests with matching id
        if (message.resId)
            resolveRequest(sesh, message.resId, message.data);
        // invoke listeners of the specified kind
        (_a = requestListeners(sesh, message.kind)) === null || _a === void 0 ? void 0 : _a.forEach(self => self(message.data, Object.assign(Object.assign({}, message), { self, from, respond: responder(sesh, message), request: requester(sesh, message) })));
    }
    /** Construct a responder function for the specified message. */
    function responder(sesh, message) {
        return (kind, data) => {
            Session.message(sesh, kind, data, message.by, { resId: message.reqId });
        };
    }
    /** Construct a requester function for the specified message. */
    function requester(sesh, message) {
        return (kind, data) => {
            Session.request(sesh, kind, data, message.by, { resId: message.reqId });
        };
    }
    /** Generate a unique identifier, given a set of identifiers. */
    function unique(ids) {
        let id = crypto.randomUUID();
        while (ids.has(id))
            id = crypto.randomUUID();
        return id;
    }
    /** Retrieve listeners of the specified kind, creating them if they don't exist. */
    function requireListeners(sesh, kind) {
        let listeners = sesh.listeners.get(kind);
        if (!listeners)
            sesh.listeners.set(kind, listeners = new Set());
        return listeners;
    }
    /** Retrieve listeners of the specified kind, if they exist. */
    function requestListeners(sesh, kind) {
        let listeners = sesh.listeners.get(kind);
        return listeners;
    }
    /** Resolve the specified request with an optional value. */
    function resolveRequest(sesh, reqId, a) {
        const request = sesh.requests.get(reqId);
        if (request && sesh.requests.delete(reqId))
            request.res(a);
    }
    /** Reject the specified request with an optional value. */
    function rejectRequest(sesh, reqId, a) {
        const request = sesh.requests.get(reqId);
        if (request && sesh.requests.delete(reqId))
            request.rej(a);
    }
    /** Reject all outbound requests for the specified peer. */
    function rejectRequestsFor(sesh, peerId, a) {
        for (const [reqId, request] of sesh.requests)
            if (request.to === peerId)
                rejectRequest(sesh, reqId, a);
    }
    /** Quickly hash a value using the specified algorithm. */
    function hash(what_1) {
        return __awaiter(this, arguments, void 0, function* (what, how = "SHA-256") {
            const data = new TextEncoder().encode(String(what));
            const hash = yield crypto.subtle.digest(how, data);
            return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("");
        });
    }
})(Session || (exports.Session = Session = {}));
exports.default = Session;
