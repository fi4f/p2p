export interface Version {
  readonly moniker: string
  readonly major  : number
  readonly minor  : number
  readonly patch  : number
}

export function Version(o ?: {
  moniker ?: string
  major   ?: number
  minor   ?: number
  patch   ?: number
}): Version {
  return {
    moniker: o?.moniker ?? "0.0.0",
    major  : o?.major   ??       0,
    minor  : o?.minor   ??       0,
    patch  : o?.patch   ??       0
  }
}

export namespace Version {
  export function toString(a: Version) {
    return `${a.moniker} ${a.major}.${a.minor}.${a.patch}`;
  }
}

export default Version;