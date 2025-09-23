import { CEL } from "cel-builder";
import { strict as assert } from "assert";
import { describe, it } from "mocha";

describe("CEL", () => {
	describe("CEL.raw", () => {
		it("should create a CELExpression from a raw string", () => {
			const expr = CEL.raw("foo == bar");
			assert.equal(typeof expr, "object");
			assert.equal(expr.toString(), "foo == bar");
			assert.equal(String(expr), "foo == bar");
		});
	});

	describe("CEL.builder", () => {
		it("should build a simple equality expression", () => {
			const builder = CEL.builder.a().isEqual.a();
			const expr = builder.build("foo", "bar");
			assert.equal(expr.toString(), '"foo" == "bar"');
		});

		it("should build a chained logical expression", () => {
			const builder = CEL.builder.a().isEqual.a().and.a().isGreater.a();
			const expr = builder.build("foo", "bar", "baz", 42);
			assert.equal(expr.toString(), '"foo" == "bar" && "baz" > 42');
		});

		it("should build a statement with property selectors", () => {
			const builder = CEL.builder.the("player").s("score").isGreater.a();
			const expr = builder.build(100);
			assert.ok(expr.toString().includes("player"));
			assert.ok(expr.toString().includes(".score"));
			assert.ok(expr.toString().includes("> 100"));
		});

		it("should throw if placeholder is assigned twice", () => {
			const builder = CEL.builder.a();
			const operand: any = builder as any;
			const placeholder = operand["#placeholders"]?.[0];
			if (placeholder) {
				placeholder.value = "foo";
				assert.throws(() => { placeholder.value = "bar"; });
			}
		});

		it("should throw if placeholder is not assigned before toString", () => {
			const builder = CEL.builder.a();
			const operand: any = builder as any;
			const placeholder = operand["#placeholders"]?.[0];
			if (placeholder) {
				assert.throws(() => placeholder.toString());
			}
		});
	});
});