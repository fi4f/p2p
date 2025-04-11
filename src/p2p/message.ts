export interface Message {
  from   : string
  to     : string
  type   : string
  data   : any
  reqId ?: string
  resId ?: string
}

export namespace Message {
  export const ACTION = "__message__"
  export const __HELLO__ = "__hello__"
  export const __WORLD__ = "__world__"
}

export default Message;