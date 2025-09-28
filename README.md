## CEL Builder

[![NPM Version](https://img.shields.io/npm/v/cel-builder.svg)](https://www.npmjs.com/package/cel-builder)

A type-safe, fluent-interface builder for creating [CEL](https://cel-spec.dev/) expressions in TypeScript and JavaScript.

## Usage

The most straightforward way to use the builder is to define your entire expression and build it immediately. The fluent API guides you through creating a readable and maintainable statement.

```ts
import { CEL, CELExpression } from "cel-builder";

const { builder } = CEL;

// Define and build the expression in one chain
const expression: CELExpression = builder
	.the("user").s("age").isGreaterOrEqual.a(18)
	.and.the("user").s("gender").isEqual.a("female")
	.build();

const celString = expression.toString();

console.log(celString);
// Output: user.age >= 18 && user.gender == "female"
```

For high-performance scenarios, you can define the structure of an expression once and reuse it many times with different data. This "assembly" can be created by defining placeholders with types (`.a<number>()`) instead of immediate values.

This is incredibly efficient as the builder logic runs only once.

```ts
import { CEL, CELExpression } from "cel-builder";

const { builder } = CEL;

// Create a reusable "assembly" with typed placeholders
const assembly = builder
	.the().s("age").isGreaterOrEqual.a<number>()
	.and.the().s("gender").isEqual.a<string>();

// Use the pre-built assembly in a function that might be called thousands of times
function isEligible(target: string, age: number, gender: string): string {
	// .build() is now extremely fast as it only fills in the blanks
	const expression = assembly.build(target, age, target, gender);
	return expression.toString();
}

console.log(isEligible("user", 25, "female"));
// Output: user.age >= 25 && user.gender == "female"

console.log(isEligible("applicant", 30, "male"));
// Output: applicant.age >= 30 && applicant.gender == "male"
```

Assemblies are immutable and can be extended to create more complex logic without modifying the original. This allows you to build a library of base expressions that can be combined as needed.

```ts
import { CEL, CELExpression } from "cel-builder";

const { builder } = CEL;

// 1. Create a base assembly
const isAdult = builder
	.the("user").s("age").isGreaterOrEqual.a(18);

const string1 = isAdult.build().toString();
console.log(string1);
// Output: user.age >= 18

// 2. Extend the base assembly to create a more specific one
const isAdultFemale = isAdult
	.and.the("user").s("gender").isEqual.a("female");

const string2 = isAdultFemale.build().toString();
console.log(string2);
// Output: user.age >= 18 && user.gender == "female"
```
