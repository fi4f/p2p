export type Listener<T> = (
  self: Listener<T>,
  data:          T ,
  from:      string,
  respond ?: (type: string, data: any) => void,
  request ?: (type: string, data: any) => void,
) => void

export default Listener;