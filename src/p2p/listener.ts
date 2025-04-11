import Context from "./context";

export interface Listener<T>{
  (
    data   :         T ,
    context: Context<T>,
  ): void
}

export default Listener;