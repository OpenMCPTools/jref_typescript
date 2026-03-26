import * as JsonPointer from "@hyperjump/json-pointer";

/**
 * @import * as API from "./index.d.ts"
 */

/** @type API.toJref */
export const toJref = (subject) => serialize(subject);

/** @type (subject: API.Json, pointers?: Map<API.Json, string>, location?: string) => API.Json */
const serialize = (subject, pointers = new Map(), location = "") => {
  switch (typeof subject) {
    case "boolean":
    case "number":
    case "string":
      return subject;
    case "object": {
      if (subject === null) {
        return subject;
      } else if (Array.isArray(subject)) {
        pointers.set(subject, location);

        /** @type API.Json[] */
        const result = [];

        let index = 0;
        for (const value of subject) {
          if (pointers.has(value)) {
            result[index] = { $ref: "#" + encodeURI(/** @type string */ (pointers.get(value))) };
          } else {
            result[index] = serialize(value, pointers, JsonPointer.append(`${index}`, location));
          }
          index++;
        }
        return result;
      } else {
        pointers.set(subject, location);

        /** @type Record<string, API.Json> */
        const result = {};

        for (const key in subject) {
          if (pointers.has(subject[key])) {
            result[key] = { $ref: "#" + encodeURI(/** @type string */ (pointers.get(subject[key]))) };
          } else {
            result[key] = serialize(subject[key], pointers, JsonPointer.append(key, location));
          }
        }
        return result;
      }
    }
  }
};

/** @type API.fromJref */
export const fromJref = (subject) => deserialize(subject);

/** @type (subject: API.Json, root?: API.Json, location?: string) => API.Json */
const deserialize = (subject, root = subject, location = "") => {
  if (typeof subject === "object") {
    if (Array.isArray(subject)) {
      for (let index = 0; index < subject.length; index++) {
        subject[index] = deserialize(subject[index], root, JsonPointer.append(`${index}`, location));
      }
    } else if (typeof subject?.$ref === "string") {
      const [uri, fragment] = subject.$ref.split("#");

      if (uri !== "") {
        throw Error("Only local references are supported");
      }

      const pointer = decodeURI(fragment);
      const referencedValue = JsonPointer.get(pointer, root);
      if (referencedValue === undefined) {
        throw Error("Invalid reference");
      }

      return referencedValue;
    } else if (subject !== null) {
      for (const key in subject) {
        subject[key] = deserialize(subject[key], root, JsonPointer.append(key, location));
      }
    }
  }

  return subject;
};
