import { filter, sampleSize } from "lodash"

export type Secret = string | [string, string]

export namespace Secret {

  export function scrub(string: string, keep="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789") {
    return filter([...string.toUpperCase()], c => keep.includes(c)).join("")
  }

  export function rend(secret: Secret, scrub=true) {
    let id, pw;
    if (typeof secret === "string") {
      id = secret.split("?")[0] ?? ""
      pw = secret.split("?")[1] ?? ""
    } else {
      id = secret[0] ?? ""
      pw = secret[1] ?? ""
    }

    return scrub ? [
      Secret.scrub(id),
      Secret.scrub(pw)
    ] as const: [id, pw] as const
  }

  export function mend(secret: Secret, scrub=true) {
    let id, pw;
    if (typeof secret === "string") {
      id = secret.split("?")[0] ?? ""
      pw = secret.split("?")[1] ?? ""
    } else {
      id = secret[0] ?? ""
      pw = secret[1] ?? ""
    }

    return scrub ? [
      Secret.scrub(id),
      Secret.scrub(pw)
    ].join("?"): [id, pw].join("?")
  }

  export function id(secret: Secret, scrub=true) {
    return rend(secret, scrub)[0]
  }

  export function pw(secret: Secret, scrub=true) {
    return rend(secret, scrub)[1]
  }

  export function random(n=6, m=n, from="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789") {
    const
      id = sampleSize(from, n).join(""),
      pw = sampleSize(from, m).join("");
    return [id, pw].join("?")
  }
}

export default Secret