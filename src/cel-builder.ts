"use strict";

import "../node/index.js";

//#region CEL
interface CELExpression {
	toString(): string;
	[Symbol.toPrimitive](): string;
}

interface CELExpressionConstructor {
	new(expression: string): CELExpression;
}

interface CELPlaceholder {
	get value(): any;
	set value(value: any);
	toString(): string;
}

interface CELPlaceholderConstructor {
	new(): CELPlaceholder;
}

interface CELArgument extends CELPlaceholder {
}

interface CELArgumentConstructor {
	new(): CELArgument;
}

interface CELBuilder<T extends any[]> {
	build(...args: T): CELExpression;
}

interface CELBuilderConstructor {
	new <T extends any[]>(literals: string[], placeholders: CELPlaceholder[]): CELBuilder<T>;
}

interface CELLeftInitializer<T extends any[]> {
	a<A = any>(): CELLeftOperand<[...T, A]>;
	a<A = any>(value: A): CELLeftOperand<[...T]>;
	the<A extends string>(): CELLeftStatement<[...T, A]>;
	the<A extends string>(name: A): CELLeftStatement<[...T]>;
}

interface CELLeftInitializerConstructor {
	new <T extends any[]>(literals: string[], placeholders: CELPlaceholder[]): CELLeftInitializer<T>;
}

interface CELLeftOperand<T extends any[]> {
	get isEqual(): CELRightInitializer<T>;
	get isNotEqual(): CELRightInitializer<T>;
	get isLess(): CELRightInitializer<T>;
	get isLessOrEqual(): CELRightInitializer<T>;
	get isGreater(): CELRightInitializer<T>;
	get isGreaterOrEqual(): CELRightInitializer<T>;
}

interface CELLeftOperandConstructor {
	new <T extends any[]>(literals: string[], placeholders: CELPlaceholder[]): CELLeftOperand<T>;
}

interface CELLeftStatement<T extends any[]> extends CELLeftOperand<T> {
	s<A extends string>(): CELLeftStatement<[...T, A]>;
	s<A extends string>(name: A): CELLeftStatement<[...T]>;
}

interface CELLeftStatementConstructor {
	new <T extends any[]>(literals: string[], placeholders: CELPlaceholder[]): CELLeftStatement<T>;
}

interface CELRightInitializer<T extends any[]> {
	a<A = any>(): CELRightOperand<[...T, A]>;
	a<A = any>(value: A): CELRightOperand<[...T]>;
	the<A extends string>(): CELRightStatement<[...T, A]>;
	the<A extends string>(name: A): CELRightStatement<[...T]>;
}

interface CELRightInitializerConstructor {
	new <T extends any[]>(literals: string[], placeholders: CELPlaceholder[]): CELRightInitializer<T>;
}

interface CELRightOperand<T extends any[]> extends CELBuilder<T> {
	get and(): CELLeftInitializer<T>;
	get or(): CELLeftInitializer<T>;
}

interface CELRightOperandConstructor {
	new <T extends any[]>(literals: string[], placeholders: CELPlaceholder[]): CELRightOperand<T>;
}

interface CELRightStatement<T extends any[]> extends CELRightOperand<T> {
	s<A extends string>(): CELRightStatement<[...T, A]>;
	s<A extends string>(name: A): CELRightStatement<[...T]>;
}

interface CELRightStatementConstructor {
	new <T extends any[]>(literals: string[], placeholders: CELPlaceholder[]): CELRightStatement<T>;
}

class CEL {
	//#region Expression
	static #Expression: CELExpressionConstructor = class Expression implements CELExpression {
		#expression: string;

		constructor(expression: string) {
			if (CEL.#lockExpression) throw new TypeError("Illegal constructor");
			this.#expression = expression;
		}

		toString(): string {
			return this.#expression;
		}

		[Symbol.toPrimitive](): string {
			return this.toString();
		}
	};
	static get Expression(): CELExpressionConstructor {
		return this.#Expression;
	}

	static #lockExpression: boolean = true;
	static #newExpression(expression: string): CELExpression {
		CEL.#lockExpression = false;
		const self = new CEL.Expression(expression);
		CEL.#lockExpression = true;
		return self;
	}
	//#endregion

	//#region Placeholder
	static #Placeholder: CELPlaceholderConstructor = class Placeholder implements CELPlaceholder {
		static #void: symbol = Symbol();

		#value: any = Placeholder.#void;
		get value(): any {
			return this.#value;
		}
		set value(value: any) {
			if (this.#value !== Placeholder.#void) throw new Error("Placeholder has already been assigned: cannot assign a new value.");
			this.#value = value;
		}

		constructor() {
			if (CEL.#lockPlaceholder) throw new TypeError("Illegal constructor");
		}

		toString(): string {
			if (this.#value === Placeholder.#void) throw new Error("Placeholder is not assigned: provide a value before converting to string");
			return String(this.#value);
		}
	};

	static #lockPlaceholder: boolean = true;
	static #newPlaceholder(): CELPlaceholder {
		CEL.#lockPlaceholder = false;
		const self = new CEL.#Placeholder();
		CEL.#lockPlaceholder = true;
		return self;
	}
	//#endregion
	//#region Argument
	static #Argument: CELArgumentConstructor = class Argument extends CEL.#Placeholder implements CELArgument {
		constructor() {
			super();
			if (CEL.#lockArgument) throw new TypeError("Illegal constructor");
		}

		toString(): string {
			super.toString();
			const value = this.value;
			if (typeof (value) === "string") return String.raw`"${value}"`;
			return String(value);
		}
	};

	static #lockArgument: boolean = true;
	static #newArgument(): CELArgument {
		CEL.#lockPlaceholder = false;
		CEL.#lockArgument = false;
		const self = new CEL.#Argument();
		CEL.#lockPlaceholder = true;
		CEL.#lockArgument = true;
		return self;
	}
	//#endregion

	//#region Builder
	static #Builder: CELBuilderConstructor = class Builder<T extends any[]> implements CELBuilder<T> {
		#literals: string[];
		#placeholders: CELPlaceholder[];
		constructor(literals: string[], placeholders: CELPlaceholder[]) {
			if (CEL.#lockBuilder) throw new TypeError("Illegal constructor");
			this.#literals = literals;
			this.#placeholders = placeholders;
		}
		build(...args: T): CELExpression {
			const literals = this.#literals;
			const placeholders = this.#placeholders;
			let index = 0;
			let expression = ReferenceError.suppress(literals[index]);
			while (true) {
				if (literals.length - 1 <= index) break;
				const placeholder = ReferenceError.suppress(placeholders[index], "A");
				placeholder.value = ReferenceError.suppress(args[index]); /** @todo Throw missed arg */;
				index++;
				expression += String(placeholder);
				expression += literals[index];
			}
			return CEL.#newExpression(expression);
		}
	};
	static get Builder(): CELBuilderConstructor {
		return this.#Builder;
	}

	static #lockBuilder: boolean = true;
	//#endregion

	//#region LeftInitializer
	static #LeftInitializer: CELLeftInitializerConstructor = class LeftInitializer<T extends any[]> implements CELLeftInitializer<T> {
		#literals: string[];
		#placeholders: CELPlaceholder[];
		constructor(literals: string[], placeholders: CELPlaceholder[]) {
			if (CEL.#lockLeftInitializer) throw new TypeError("Illegal constructor");
			this.#literals = literals;
			this.#placeholders = placeholders;
		}
		a<A = any>(): CELLeftOperand<[...T, A]>;
		a<A = any>(value: A): CELLeftOperand<[...T]>;
		a<A = any>(value: A = CEL.#placeholder as A): CELLeftOperand<[...T] | [...T, A]> {
			const literals = Array.from(this.#literals);
			const placeholders = Array.from(this.#placeholders);
			CEL.#concat(literals, placeholders, CEL.#newArgument(), value);
			return CEL.#newLeftOperand(literals, placeholders);
		}
		the<A extends string>(): CELLeftStatement<[...T, A]>;
		the<A extends string>(name: A): CELLeftStatement<[...T]>;
		the<A extends string>(name?: A): CELLeftStatement<[...T] | [...T, A]> {
			const literals = Array.from(this.#literals);
			const placeholders = Array.from(this.#placeholders);
			CEL.#concat(literals, placeholders, CEL.#newPlaceholder(), name ?? CEL.#placeholder);
			return CEL.#newLeftStatement(literals, placeholders);
		}
	};
	static get LeftInitializer(): CELLeftInitializerConstructor {
		return this.#LeftInitializer;
	}

	static #lockLeftInitializer: boolean = true;
	static #newLeftInitializer<T extends any[]>(literals: string[], placeholders: CELPlaceholder[]): CELLeftInitializer<T> {
		CEL.#lockLeftInitializer = false;
		const self = new CEL.LeftInitializer<T>(literals, placeholders);
		CEL.#lockLeftInitializer = true;
		return self;
	}
	//#endregion
	//#region LeftOperand
	static #LeftOperand: CELLeftOperandConstructor = class LeftOperand<T extends any[]> implements CELLeftOperand<T> {
		#literals: string[];
		#placeholders: CELPlaceholder[];
		constructor(literals: string[], placeholders: CELPlaceholder[]) {
			if (CEL.#lockLeftOperand) throw new TypeError("Illegal constructor");
			this.#literals = literals;
			this.#placeholders = placeholders;
		}
		get isEqual(): CELRightInitializer<T> {
			const literals = Array.from(this.#literals);
			const placeholders = Array.from(this.#placeholders);
			CEL.#concat(literals, placeholders, CEL.#newPlaceholder(), " == ");
			return CEL.#newRightInitializer(literals, placeholders);
		}
		get isNotEqual(): CELRightInitializer<T> {
			const literals = Array.from(this.#literals);
			const placeholders = Array.from(this.#placeholders);
			CEL.#concat(literals, placeholders, CEL.#newPlaceholder(), " != ");
			return CEL.#newRightInitializer(literals, placeholders);
		}
		get isLess(): CELRightInitializer<T> {
			const literals = Array.from(this.#literals);
			const placeholders = Array.from(this.#placeholders);
			CEL.#concat(literals, placeholders, CEL.#newPlaceholder(), " < ");
			return CEL.#newRightInitializer(literals, placeholders);
		}
		get isLessOrEqual(): CELRightInitializer<T> {
			const literals = Array.from(this.#literals);
			const placeholders = Array.from(this.#placeholders);
			CEL.#concat(literals, placeholders, CEL.#newPlaceholder(), " <= ");
			return CEL.#newRightInitializer(literals, placeholders);
		}
		get isGreater(): CELRightInitializer<T> {
			const literals = Array.from(this.#literals);
			const placeholders = Array.from(this.#placeholders);
			CEL.#concat(literals, placeholders, CEL.#newPlaceholder(), " > ");
			return CEL.#newRightInitializer(literals, placeholders);
		}
		get isGreaterOrEqual(): CELRightInitializer<T> {
			const literals = Array.from(this.#literals);
			const placeholders = Array.from(this.#placeholders);
			CEL.#concat(literals, placeholders, CEL.#newPlaceholder(), " >= ");
			return CEL.#newRightInitializer(literals, placeholders);
		}
	};
	static get LeftOperand(): CELLeftOperandConstructor {
		return this.#LeftOperand;
	}

	static #lockLeftOperand: boolean = true;
	static #newLeftOperand<T extends any[]>(literals: string[], placeholders: CELPlaceholder[]): CELLeftOperand<T> {
		CEL.#lockLeftOperand = false;
		const self = new CEL.LeftOperand<T>(literals, placeholders);
		CEL.#lockLeftOperand = true;
		return self;
	}
	//#endregion
	//#region LeftStatement
	static #LeftStatement: CELLeftStatementConstructor = class LeftStatement<T extends any[]> extends CEL.LeftOperand<T> implements CELLeftStatement<T> {
		#literals: string[];
		#placeholders: CELPlaceholder[];
		constructor(literals: string[], placeholders: CELPlaceholder[]) {
			super(literals, placeholders);
			if (CEL.#lockLeftStatement) throw new TypeError("Illegal constructor");
			this.#literals = literals;
			this.#placeholders = placeholders;
		}
		s<A extends string>(): CELLeftStatement<[...T, A]>;
		s<A extends string>(name: A): CELLeftStatement<[...T]>;
		s<A extends string>(name?: A): CELLeftStatement<[...T] | [...T, A]> {
			const literals = Array.from(this.#literals);
			const placeholders = Array.from(this.#placeholders);
			const value = Object.map(name, name => `.${name}`) ?? CEL.#placeholder;
			CEL.#concat(literals, placeholders, CEL.#newPlaceholder(), value);
			return CEL.#newLeftStatement(literals, placeholders);
		}
	};
	static get LeftStatement(): CELLeftStatementConstructor {
		return this.#LeftStatement;
	}

	static #lockLeftStatement: boolean = true;
	static #newLeftStatement<T extends any[]>(literals: string[], placeholders: CELPlaceholder[]): CELLeftStatement<T> {
		CEL.#lockLeftOperand = false;
		CEL.#lockLeftStatement = false;
		const self = new CEL.LeftStatement<T>(literals, placeholders);
		CEL.#lockLeftOperand = true;
		CEL.#lockLeftStatement = true;
		return self;
	}
	//#endregion
	//#region RightInitializer
	static #RightInitializer: CELRightInitializerConstructor = class RightInitializer<T extends any[]> implements CELRightInitializer<T> {
		#literals: string[];
		#placeholders: CELPlaceholder[];
		constructor(literals: string[], placeholders: CELPlaceholder[]) {
			if (CEL.#lockRightInitializer) throw new TypeError("Illegal constructor");
			this.#literals = literals;
			this.#placeholders = placeholders;
		}
		a<A = any>(): CELRightOperand<[...T, A]>;
		a<A = any>(value: A): CELRightOperand<[...T]>;
		a<A = any>(value: A = CEL.#placeholder as A): CELRightOperand<[...T] | [...T, A]> {
			const literals = Array.from(this.#literals);
			const placeholders = Array.from(this.#placeholders);
			CEL.#concat(literals, placeholders, CEL.#newArgument(), value);
			return CEL.#newRightOperand(literals, placeholders);
		}
		the<A extends string>(): CELRightStatement<[...T, A]>;
		the<A extends string>(name: A): CELRightStatement<[...T]>;
		the<A extends string>(name?: A): CELRightStatement<[...T] | [...T, A]> {
			const literals = Array.from(this.#literals);
			const placeholders = Array.from(this.#placeholders);
			CEL.#concat(literals, placeholders, CEL.#newPlaceholder(), name ?? CEL.#placeholder);
			return CEL.#newRightStatement(literals, placeholders);
		}
	};
	static get RightInitializer(): CELRightInitializerConstructor {
		return this.#RightInitializer;
	}

	static #lockRightInitializer: boolean = true;
	static #newRightInitializer<T extends any[]>(literals: string[], placeholders: CELPlaceholder[]): CELRightInitializer<T> {
		CEL.#lockRightInitializer = false;
		const self = new CEL.RightInitializer<T>(literals, placeholders);
		CEL.#lockRightInitializer = true;
		return self;
	}
	//#endregion
	//#region RightOperand
	static #RightOperand: CELRightOperandConstructor = class RightOperand<T extends any[]> extends CEL.Builder<T> implements CELRightOperand<T> {
		#literals: string[];
		#placeholders: CELPlaceholder[];
		constructor(literals: string[], placeholders: CELPlaceholder[]) {
			super(literals, placeholders);
			if (CEL.#lockRightOperand) throw new TypeError("Illegal constructor");
			this.#literals = literals;
			this.#placeholders = placeholders;
		}
		get and(): CELLeftInitializer<T> {
			const literals = Array.from(this.#literals);
			const placeholders = Array.from(this.#placeholders);
			CEL.#concat(literals, placeholders, CEL.#newPlaceholder(), " && ");
			return CEL.#newLeftInitializer(literals, placeholders);
		}
		get or(): CELLeftInitializer<T> {
			const literals = Array.from(this.#literals);
			const placeholders = Array.from(this.#placeholders);
			CEL.#concat(literals, placeholders, CEL.#newPlaceholder(), " || ");
			return CEL.#newLeftInitializer(literals, placeholders);
		}
	};
	static get RightOperand(): CELRightOperandConstructor {
		return this.#RightOperand;
	}

	static #lockRightOperand: boolean = true;
	static #newRightOperand<T extends any[]>(literals: string[], placeholders: CELPlaceholder[]): CELRightOperand<T> {
		CEL.#lockBuilder = false;
		CEL.#lockRightOperand = false;
		const self = new CEL.RightOperand<T>(literals, placeholders);
		CEL.#lockBuilder = true;
		CEL.#lockRightOperand = true;
		return self;
	}
	//#endregion
	//#region RightStatement
	static #RightStatement: CELRightStatementConstructor = class RightStatement<T extends any[]> extends CEL.RightOperand<T> implements CELRightStatement<T> {
		#literals: string[];
		#placeholders: CELPlaceholder[];
		constructor(literals: string[], placeholders: CELPlaceholder[]) {
			super(literals, placeholders);
			if (CEL.#lockRightStatement) throw new TypeError("Illegal constructor");
			this.#literals = literals;
			this.#placeholders = placeholders;
		}
		s<A extends string>(): CELRightStatement<[...T, A]>;
		s<A extends string>(name: A): CELRightStatement<[...T]>;
		s<A extends string>(name?: A): CELRightStatement<[...T] | [...T, A]> {
			const literals = Array.from(this.#literals);
			const placeholders = Array.from(this.#placeholders);
			const value = Object.map(name, name => `.${name}`) ?? CEL.#placeholder;
			CEL.#concat(literals, placeholders, CEL.#newPlaceholder(), value);
			return CEL.#newRightStatement(literals, placeholders);
		}
	};
	static get RightStatement(): CELRightStatementConstructor {
		return this.#RightStatement;
	}

	static #lockRightStatement: boolean = true;
	static #newRightStatement<T extends any[]>(literals: string[], placeholders: CELPlaceholder[]): CELRightStatement<T> {
		CEL.#lockBuilder = false;
		CEL.#lockRightOperand = false;
		CEL.#lockRightStatement = false;
		const self = new CEL.RightStatement<T>(literals, placeholders);
		CEL.#lockBuilder = true;
		CEL.#lockRightOperand = true;
		CEL.#lockRightStatement = true;
		return self;
	}
	//#endregion

	static #placeholder: symbol = Symbol();

	static #builder: CELLeftInitializer<[]> = CEL.#newLeftInitializer([String.empty], []);
	static get builder(): CELLeftInitializer<[]> {
		return this.#builder;
	}

	static #concat(literals: string[], placeholders: CELPlaceholder[], container: CELPlaceholder, value: any): void {
		if (value === CEL.#placeholder) {
			placeholders.push(container);
			literals.push(String.empty);
		} else {
			container.value = value;
			const literal = ReferenceError.suppress(literals.pop());
			literals.push(literal + String(container));
		}
	}

	/**
	 * @deprecated Unsafe function. Use {@linkcode CEL.builder} functions instead.
	 */
	static raw(expression: string): CELExpression {
		return CEL.#newExpression(expression);
	}
}
//#endregion

export { type CELExpression, type CELExpressionConstructor };

export { type CELBuilder, type CELBuilderConstructor };
export { type CELLeftInitializer, type CELLeftInitializerConstructor };
export { type CELLeftOperand, type CELLeftOperandConstructor };
export { type CELLeftStatement, type CELLeftStatementConstructor };
export { type CELRightInitializer, type CELRightInitializerConstructor };
export { type CELRightOperand, type CELRightOperandConstructor };
export { type CELRightStatement, type CELRightStatementConstructor };

export { CEL };
