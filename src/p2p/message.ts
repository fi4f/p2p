export interface Message {
  by     : string // sent by peer
  to     : string // sent to peer
  kind   : string
  data   : any
  reqId ?: string
  resId ?: string
}

export namespace Message {
  export const ACTION = "__message__"
}

export default Message;