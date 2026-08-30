import { DurableObject } from "cloudflare:workers";

export class GameSession extends DurableObject<Env> {}

export default {};
