import Message from "./message";
import Context from "./context";
export interface Listener<T> {
    (message: Message<T>, context: Context<T>): void;
}
export default Listener;
