import Listener from "./listener";

export interface Context<T> {
  self: Listener<T>,
  from:      string,
  respond ?: (type: string, data: any) => void,
  request ?: (type: string, data: any) => void,
}

export default Context;