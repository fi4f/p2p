export interface Request {
  peerId: string
  resolve : (a  : any) => void
  reject  : (a ?: any) => void
}

export default Request;