# JRef (local-only)

JSON Reference (JRef) extends JSON with a reference type. References allow for
circular data to be serialized as JSON or for duplicated data to be serialized
more efficiently. References take the form of `{ "$ref": "#/path/to/target" }`
where the URL fragment is a JSON Pointer locating a position in the document.

JRef can be used to reference locations in external documents as well, but this
implementation only supports references local to the current document. See the
[JRef Specification](https://github.com/hyperjump-io/json-reference/blob/main/spec.md)
for more information on the full specification and
[@hyperjump/browser](https://github.com/hyperjump-io/browser) for a full
implementation supporting external references.

## Installation

This module is designed for node.js (ES Modules, TypeScript) and browsers. It
should work in Bun and Deno as well, but the test runner doesn't work in these
environments, so this package may be less stable in those environments.

```bash
npm install @OpenMCPTools/jref
```

## Usage

```typescript
import { serialize, deserialize } from "@OpenMCPTools/jref";

const example = { a: 1 };
const data = { foo: example, bar: example };

// Compress duplicate data
const serialized = serialize(data);
// { foo: { a: 1 }, bar: { "$ref": "#/foo" } }

const deserialized = deserialize(serialized);
// deserialized.foo === deserialized.bar

// Circular references
const nodeA = { name: "A" };
const nodeB = { name: "B", parent: nodeA };
nodeA.child = nodeB;

const circularSerialized = serialize(nodeA);
// {
//   name: "A",
//   child: {
//     name: "B",
//     parent: { "$ref": "#" }
//   }
// }
```

## API

- **toJRef**: (subject: Json) => Json

  Convert a JSON compatible value to JRef that can safely use `JSON.stringify`.

- **fromJref**: (subject: Json) => Json

  Resolve all references in a JRef value.

## Contributing

Contributions are welcome! Please create an issue to propose and discuss any
changes you'd like to make before implementing it. If it's an obvious bug with
an obvious solution or something simple like a fixing a typo, creating an issue
isn't required. You can just send a PR without creating an issue. Before
submitting any code, please remember to run all of the following scripts.

- npm test (Tests can also be run continuously using npm test -- --watch)
- npm run lint
- npm run type-check
