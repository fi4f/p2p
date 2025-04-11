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
    Session.APPLICATION_ID = v_1.default.toString(_1.default.VERSION);
    Session.__HELLO__ = "__hello__";
    Session.__WORLD__ = "__world__";
    Session.CLIENT_CONNECTED = "__client_connected__";
    Session.SERVER_CONNECTED = "__server_connected__";
    Session.CLIENT_DISCONNECTED = "__client_disconnected__";
    Session.SERVER_DISCONNECTED = "__server_disconnected__";
    function host(secret, appId = Session.APPLICATION_ID) {
        secret = secret_1.default.mend(secret);
        const id = secret_1.default.id(secret), pw = secret_1.default.pw(secret), is = "server";
        const _trysteroRoom = trystero_1.default.joinRoom({ appId, password: pw }, id), [_trysteroTx, _trysteroRx,] = _trysteroRoom.makeAction(message_1.default.ACTION);
        const sesh = {
            secret, id, pw, is,
            clientIds: new Set(),
            clientId: trystero_1.default.selfId,
            serverId: trystero_1.default.selfId,
            requests: new Map(),
            listeners: new Map(),
            _trysteroRoom,
            _trysteroTx,
            _trysteroRx,
        };
        _trysteroRoom.onPeerLeave(peerId => {
            rejectRequestsFor(sesh, peerId);
            if (sesh.clientIds.delete(peerId)) {
                sesh.clientIds.forEach(clientId => {
                    message(sesh, Session.CLIENT_DISCONNECTED, peerId, clientId);
                });
            }
        });
        _trysteroRoom.onPeerJoin((peerId) => __awaiter(this, void 0, void 0, function* () {
            const __hello__ = yield hash(peerId);
            const __world__ = yield hash(__hello__);
            try {
                if ((yield request(sesh, Session.__HELLO__, __hello__, peerId)) === __world__) {
                    sesh.clientIds.forEach(clientId => {
                        message(sesh, Session.CLIENT_CONNECTED, peerId, clientId);
                        message(sesh, Session.CLIENT_CONNECTED, clientId, peerId);
                    });
                    sesh.clientIds.add(peerId);
                }
            }
            catch (e) {
                // do nothing
            }
        }));
        _trysteroRx((message, from) => serverRx(sesh, message, from));
        return sesh;
    }
    Session.host = host;
    function join(secret, appId = Session.APPLICATION_ID) {
        secret = secret_1.default.mend(secret);
        const id = secret_1.default.id(secret), pw = secret_1.default.pw(secret), is = "client";
        const _trysteroRoom = trystero_1.default.joinRoom({ appId, password: pw }, id), [_trysteroTx, _trysteroRx,] = _trysteroRoom.makeAction(message_1.default.ACTION);
        const sesh = {
            secret, id, pw, is,
            clientIds: new Set(),
            clientId: trystero_1.default.selfId,
            // serverId : Trystero.selfId,
            requests: new Map(),
            listeners: new Map(),
            _trysteroRoom,
            _trysteroTx,
            _trysteroRx,
        };
        _trysteroRoom.onPeerLeave(peerId => {
            rejectRequestsFor(sesh, peerId);
        });
        on(sesh, Session.__HELLO__, (_a, _b) => __awaiter(this, [_a, _b], void 0, function* ({ data }, { from, respond }) {
            if (sesh.serverId)
                return;
            const __hello__ = yield hash(sesh.clientId);
            const __world__ = yield hash(__hello__);
            if (data === __hello__) {
                sesh.serverId = from;
                respond(Session.__WORLD__, __world__);
            }
        }));
        _trysteroRx((message, from) => clientRx(sesh, message, from));
    }
    Session.join = join;
    function on(sesh, type, listener) {
        requireListeners(sesh, type).add(listener);
    }
    Session.on = on;
    function off(sesh, type, listener) {
        var _a;
        (_a = requestListeners(sesh, type)) === null || _a === void 0 ? void 0 : _a.delete(listener);
    }
    Session.off = off;
    function serverRx(sesh, message, from) {
        // always accept messages sent to myself
        if (message.to === sesh.clientId)
            rx(sesh, message, from);
        // only forward messages to and from validated peers
        else if (sesh.clientIds.has(message.from) &&
            sesh.clientIds.has(message.to))
            send(sesh, Object.assign(Object.assign({}, message), { from }));
    }
    function clientRx(sesh, message, from) {
        if (from === sesh.clientId || // always accept messages from the client
            from === sesh.serverId || // always accept messages from the server
            // only accept __hello__ messages when the server is undefined
            (!sesh.serverId && message.type === "__hello__"))
            rx(sesh, message, from);
    }
    function rx(sesh, message, from) {
        var _a;
        if (message.resId)
            resolveRequest(sesh, message.resId, message.data);
        (_a = requestListeners(sesh, message.type)) === null || _a === void 0 ? void 0 : _a.forEach(self => {
            const respond = (type, data) => {
                Session.message(sesh, type, data, message.from, { resId: message.reqId });
            };
            const request = (type, data) => {
                Session.request(sesh, type, data, message.from, { resId: message.reqId });
            };
            self(message, { self, from, respond, request });
        });
    }
    function serverTx(sesh, message) {
        sesh._trysteroTx(message, message.to);
    }
    function clientTx(sesh, message) {
        if (sesh.serverId)
            sesh._trysteroTx(message, sesh.serverId);
        else
            sesh._trysteroTx(message, message.to);
    }
    function send(sesh, message) {
        if (sesh.is === "server")
            serverTx(sesh, message);
        else
            clientTx(sesh, message);
    }
    Session.send = send;
    function message(sesh, type, data, to, o) {
        send(sesh, Object.assign(Object.assign({}, o), { from: sesh.clientId, type, data, to }));
    }
    Session.message = message;
    function request(sesh, type, data, to, o) {
        var _a;
        const reqId = (_a = o === null || o === void 0 ? void 0 : o.reqId) !== null && _a !== void 0 ? _a : getUniqueRequestId(sesh);
        return new Promise((res, rej) => {
            sesh.requests.set(reqId, { to, res, rej });
            message(sesh, type, data, to, { reqId });
        });
    }
    Session.request = request;
    function getUniqueRequestId(sesh) {
        let reqId = crypto.randomUUID();
        while (sesh.requests.has(reqId))
            reqId = crypto.randomUUID();
        return reqId;
    }
    Session.getUniqueRequestId = getUniqueRequestId;
    function requireListeners(sesh, type) {
        let listeners = sesh.listeners.get(type);
        if (!listeners)
            sesh.listeners.set(type, listeners = new Set());
        return listeners;
    }
    Session.requireListeners = requireListeners;
    function requestListeners(sesh, type) {
        let listeners = sesh.listeners.get(type);
        // if(!listeners) sesh.listeners.set(
        //   type, listeners = new Set()
        // ) 
        return listeners;
    }
    Session.requestListeners = requestListeners;
    function resolveRequest(sesh, reqId, a) {
        const request = sesh.requests.get(reqId);
        if (request && sesh.requests.delete(reqId))
            request.res(a);
    }
    Session.resolveRequest = resolveRequest;
    function rejectRequest(sesh, reqId, a) {
        const request = sesh.requests.get(reqId);
        if (request && sesh.requests.delete(reqId))
            request.rej(a);
    }
    Session.rejectRequest = rejectRequest;
    function rejectRequestsFor(sesh, peerId, a) {
        for (const [reqId, request] of sesh.requests)
            if (request.to === peerId)
                rejectRequest(sesh, reqId, a);
    }
    Session.rejectRequestsFor = rejectRequestsFor;
    function hash(what_1) {
        return __awaiter(this, arguments, void 0, function* (what, how = "SHA-256") {
            const data = new TextEncoder().encode(String(what));
            const hash = yield crypto.subtle.digest(how, data);
            return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("");
        });
    }
    Session.hash = hash;
})(Session || (exports.Session = Session = {}));
exports.default = Session;
