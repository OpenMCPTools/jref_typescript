import { describe, test, expect } from "vitest";
import { toJref, fromJref } from "./index.js";

describe("serialize", () => {
  test("serialization of null", () => {
    expect(toJref(null)).to.equal(null);
  });

  test("serialization of true", () => {
    expect(toJref(true)).to.equal(true);
  });

  test("serialization of false", () => {
    expect(toJref(false)).to.equal(false);
  });

  test("serialization of numbers", () => {
    expect(toJref(1.23)).to.equal(1.23);
  });

  test("serialization of strings", () => {
    expect(toJref("hello world")).to.equal("hello world");
  });

  test("serialization of arrays", () => {
    expect(toJref([1, 2, 3])).to.eql([1, 2, 3]);
  });

  test("serialization of objects", () => {
    expect(toJref({ a: 1, b: "c" })).to.eql({ a: 1, b: "c" });
  });

  test("serialization of nested structures without references", () => {
    expect(toJref({ list: [1, 2], val: 3 })).to.eql({ list: [1, 2], val: 3 });
  });

  test("that multiple references to the same object use JSON pointers", () => {
    const inner = { key: "value" };
    const outer = { first: inner, second: inner };

    expect(toJref(outer)).to.eql({
      first: { key: "value" },
      second: { $ref: "#/first" }
    });
  });

  test("serialization of circular object graphs", () => {
    /**
     * @typedef {{
     *   name: string;
     *   parent?: Subject;
     *   child?: Subject;
     * }} Subject
     */

    /** @type Subject */
    const nodeA = { name: "A" };
    /** @type Subject */
    const nodeB = { name: "B", parent: nodeA };
    nodeA.child = nodeB;

    expect(toJref(nodeA)).to.eql({
      name: "A",
      child: {
        name: "B",
        parent: { $ref: "#" }
      }
    });
  });

  test("references within arrays", () => {
    const item = { id: 1 };
    const data = [item, item];

    expect(toJref(data)).to.eql([
      { id: 1 },
      { $ref: "#/0" }
    ]);
  });

  test("JSON pointer escaping works for keys with ~ and /", () => {
    const fooTarget = { val: 1 };
    const barTarget = { val: 2 };
    const data = {
      "a/b": fooTarget,
      "foo": fooTarget,
      "c~d": barTarget,
      "bar": barTarget
    };

    expect(toJref(data)).to.eql({
      ["a/b"]: { val: 1 },
      foo: { $ref: "#/a~1b" },
      ["c~d"]: { val: 2 },
      bar: { $ref: "#/c~0d" }
    });
  });
});

describe("deserialize", () => {
  test("deserialization of null", () => {
    expect(fromJref(null)).to.equal(null);
  });

  test("deserialization of true", () => {
    expect(fromJref(true)).to.equal(true);
  });

  test("deserialization of false", () => {
    expect(fromJref(false)).to.equal(false);
  });

  test("deserialization of numbers", () => {
    expect(fromJref(1.23)).to.equal(1.23);
  });

  test("deserialization of strings", () => {
    expect(fromJref("hello world")).to.equal("hello world");
  });

  test("deserialization of arrays", () => {
    expect(fromJref([1, 2, 3])).to.eql([1, 2, 3]);
  });

  test("deserialization of objects", () => {
    expect(fromJref({ a: 1, b: "c" })).to.eql({ a: 1, b: "c" });
  });

  test("deserialization of nested structures without references", () => {
    expect(fromJref({ list: [1, 2], val: 3 })).to.eql({ list: [1, 2], val: 3 });
  });

  test("resolving JSON pointers during deserialization", () => {
    const data = {
      shared: { x: 10 },
      other: { $ref: "#/shared" }
    };
    const result = /** @type {typeof data} */ (fromJref(data));
    expect(result.other).to.equal(result.shared); // Exact same instance
  });

  test("complex nested references", () => {
    const data = {
      users: [
        { name: "Alice", id: 1 },
        { name: "Bob", id: 2 }
      ],
      admin: { $ref: "#/users/0" }
    };
    const result = /** @type {typeof data} */ (fromJref(data));
    expect(result.admin).to.equal(result.users[0]);
  });

  test("deserialization of circular references", () => {
    const data = {
      child: {
        parent: { $ref: "#" }
      }
    };
    const result = /** @type {typeof data} */ (fromJref(data));
    expect(result.child.parent).to.equal(result);
  });

  test("invalid references throw an error", () => {
    const data = {
      a: 1,
      b: { $ref: "#/nonexistent" }
    };
    expect(() => fromJref(data)).toThrow("Invalid reference");
  });

  test("deserialization with escaped pointer segments", () => {
    const data = {
      "a/b": { val: 42 },
      "ref": { $ref: "#/a~1b" }
    };

    const result = /** @type {typeof data} */ (fromJref(data));
    expect(result.ref).to.equal(result["a/b"]);
  });
});
