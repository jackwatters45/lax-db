import { Resource } from "sst";
import { Example } from "@lax-db/core/example";

console.log(`${Example.hello()} Linked to ${Resource.MyBucket.name}.`);
