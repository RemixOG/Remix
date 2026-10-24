import { Requests } from "./Requests";
import { Storage } from "./Storage";
import * as Arc from "arc-services";

const Arc_Configuration: Arc.Configuration = {
    ClientID: "rokzoyzmxxjqekqdqkipgkdueoybqjqo",
    stage: "dev",
}

const Arc_Instance = new Arc.Instance(Arc_Configuration);

export const Stellar = { Storage, Requests, Arc_Configuration, Arc_Instance }