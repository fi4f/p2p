export interface Message {
  type   : string
  data   : any
  requestId  ?: string
  responseId ?: string
}

export namespace Message {
  export const ACTION = "__message__"
  export const __HELLO__ = "__hello__"
  export const __WORLD__ = "__world__"
}

export default Message;