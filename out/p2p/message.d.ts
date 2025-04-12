export interface Message {
    by: string;
    to: string;
    kind: string;
    data: any;
    reqId?: string;
    resId?: string;
}
export declare namespace Message {
    const ACTION = "__message__";
}
export default Message;
