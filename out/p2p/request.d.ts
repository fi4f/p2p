export interface Request {
    to: string;
    res: (a: any) => void;
    rej: (a?: any) => void;
}
export default Request;
