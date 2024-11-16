import { filter, sampleSize } from "lodash"

export type Secret = string | [string, string]

export namespace Secret {

  export function scrub(string: string, keep="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789") {
    return filter([...string.toUpperCase()], c => keep.includes(c)).join("")
  }

  export function rend(secret: Secret, clean=true) {
    let
      id = (typeof secret === "string" ? secret.split("?")[0] : secret[0]) ?? "",
      pw = (typeof secret === "string" ? secret.split("?")[1] : secret[1]) ?? "";
    if (clean) {
      id = scrub(id)
      pw = scrub(pw)
    }
    return [id, pw] as const
  }

  export function mend(secret: Secret, clean=true) {
    let
      id = (typeof secret === "string" ? secret.split("?")[0] : secret[0]) ?? "",
      pw = (typeof secret === "string" ? secret.split("?")[1] : secret[1]) ?? "";
    if (clean) {
      id = scrub(id)
      pw = scrub(pw)
    }
    return `${id}?${pw}`
  }

  export function id(secret: Secret, clean=true) {
    return rend(secret, clean)[0]
  }

  export function pw(secret: Secret, clean=true) {
    return rend(secret, clean)[1]
  }

  export function random(n=6, from="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789") {
    const
      id = sampleSize(from, n).join(""),
      pw = sampleSize(from, n).join("");
    return `${id}?${pw}`
  }
}

export default Secret