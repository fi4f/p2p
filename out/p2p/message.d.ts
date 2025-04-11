export interface Message<T> {
    from: string;
    to: string;
    type: string;
    data: T;
    reqId?: string;
    resId?: string;
}
export declare namespace Message {
    const ACTION = "__message__";
}
export default Message;
