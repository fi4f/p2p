import Client  from "./client";
import Server  from "./server";
import Secret  from "./secret";
import Session from "./session";
import Version from "./version";

export namespace p2p {
  export const VERSION = Version({
    moniker: "@fi4f/p2p",
    major: 1,
    minor: 0,
    patch: 6
  })

  export function host(secret: Secret, appId=Session.APPLICATION_ID): Server {
    return Server(secret)
  }

  export function join(secret: Secret, appId=Session.APPLICATION_ID): Client {
    return Client(secret)
  }

  export async function hash(what: any, how = "SHA-256") {
    const data = new TextEncoder().encode(String(what))
    const hash = await crypto.subtle.digest(how , data)
    return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("")
  }

  export function uuid() {
    return crypto.randomUUID()
  }
}

export default p2p;