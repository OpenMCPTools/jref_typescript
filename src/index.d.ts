export type Json = string | number | boolean | null | { [property: string]: Json } | Json[];

export const toJref: (subject: Json) => Json;
export const fromJref: (subject: Json) => Json;
