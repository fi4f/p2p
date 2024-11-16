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
    patch: 5
  })

  export function host(secret: Secret): Server {
    return Server(Session(secret))
  }

  export function join(secret: Secret): Client {
    return Client(Session(secret))
  }
}

export default p2p;