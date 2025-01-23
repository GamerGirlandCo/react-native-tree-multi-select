/** shorthand type for  the setter returned by `useState` */

import { Dispatch, SetStateAction } from "react";

export type StateUpdater<T> = Dispatch<SetStateAction<T>>;
