import { CEL } from "cel-builder";
import { describe, it, expect } from "vitest";

describe("CEL", () => {
	describe("CEL.raw", () => {
		it("should create a CELExpression from a raw string", () => {
			const expr = CEL.raw("foo == bar");
			expect(expr.toString()).toBe("foo == bar");
			expect(String(expr)).toBe("foo == bar");
		});
	});

	describe("CEL.builder", () => {
		describe("Comparison Operators", () => {
			const cases = [
				{ op: "isEqual", symbol: "==" },
				{ op: "isNotEqual", symbol: "!=" },
				{ op: "isLess", symbol: "<" },
				{ op: "isLessOrEqual", symbol: "<=" },
				{ op: "isGreater", symbol: ">" },
				{ op: "isGreaterOrEqual", symbol: ">=" },
			];

			it.each(cases)("should build a '$symbol' expression", ({ op, symbol }) => {
				const builder = (CEL.builder.a() as any)[op].a();
				const expr = builder.build(10, 20);
				expect(expr.toString()).toBe(`10 ${symbol} 20`);
			});
		});

		describe("Logical Operators", () => {
			it("should build an 'and' expression", () => {
				const builder = CEL.builder.a().isEqual.a().and.a().isEqual.a();
				const expr = builder.build(1, 1, 2, 2);
				expect(expr.toString()).toBe('1 == 1 && 2 == 2');
			});

			it("should build an 'or' expression", () => {
				const builder = CEL.builder.a().isGreater.a().or.a().isLess.a();
				const expr = builder.build(10, 5, 1, 0);
				expect(expr.toString()).toBe('10 > 5 || 1 < 0');
			});

			it("should build a chained logical expression", () => {
				const builder = CEL.builder.a().isEqual.a().and.a().isGreater.a().or.a().isNotEqual.a();
				const expr = builder.build("foo", "bar", 5, 3, true, false);
				expect(expr.toString()).toBe('"foo" == "bar" && 5 > 3 || true != false');
			});
		});

		describe("Data Types", () => {
			it("should correctly handle strings", () => {
				const expr = CEL.builder.a().isEqual.a().build("user", "admin");
				expect(expr.toString()).toBe('"user" == "admin"');
			});

			it("should correctly handle numbers", () => {
				const expr = CEL.builder.a().isEqual.a().build(123, 456);
				expect(expr.toString()).toBe('123 == 456');
			});

			it("should correctly handle booleans", () => {
				const expr = CEL.builder.a().isEqual.a().build(true, false);
				expect(expr.toString()).toBe('true == false');
			});

			it("should correctly handle null", () => {
				const expr = CEL.builder.a().isEqual.a().build(null, null);
				expect(expr.toString()).toBe('null == null');
			});
		});

		describe("Property and Statement Handling", () => {
			it("should build a statement with 'the'", () => {
				const builder = CEL.builder.the("player").isGreater.a();
				const expr = builder.build(100);
				expect(expr.toString()).toBe("player > 100");
			});

			it("should build a statement with chained properties using 's'", () => {
				const builder = CEL.builder.the("user").s("profile").s("age").isGreaterOrEqual.a();
				const expr = builder.build(18);
				expect(expr.toString()).toBe("user.profile.age >= 18");
			});

			it("should handle immediate values with 'the'", () => {
				const builder = CEL.builder.the("user.name").isEqual.a("John");
				const expr = builder.build();
				expect(expr.toString()).toBe('user.name == "John"');
			});

			it("should handle placeholder values with 'the'", () => {
				const builder = CEL.builder.the("user").s("name").isEqual.a();
				const expr = builder.build("Jane");
				expect(expr.toString()).toBe('user.name == "Jane"');
			});
		});

		describe("Error Handling", () => {
			it("should throw if build() is called with too few arguments", () => {
				const builder = CEL.builder.a().isEqual.a();
				//@ts-expect-error
				expect(() => builder.build("one_arg")).toThrow();
			});

			it("should ignore extra arguments passed to build()", () => {
				const builder = CEL.builder.a().isEqual.a();
				//@ts-expect-error
				const expr = builder.build("foo", "bar", "extra");
				expect(expr.toString()).toBe('"foo" == "bar"');
			});

			it("should throw if placeholder is assigned twice", () => {
				const builder = CEL.builder.a();
				const operand: any = builder;
				const placeholder = operand["#placeholders"]?.[0];
				if (placeholder) {
					placeholder.value = "foo";
					expect(() => { placeholder.value = "bar"; }).toThrow("Placeholder has already been assigned");
				}
			});

			it("should throw if placeholder is not assigned before toString", () => {
				const builder = CEL.builder.a();
				const operand: any = builder;
				const placeholder = operand["#placeholders"]?.[0];
				if (placeholder) {
					expect(() => placeholder.toString()).toThrow("Placeholder is not assigned");
				}
			});
		});
	});
});

