import baseTypes from "./baseTypes.js";
import { diff } from "./diff.js";
import helpers from "./helpers.js";
import type {
	Component,
	ComponentHandler,
	ComponentHandlerHelpers,
	ComponentInstance,
	ComponentPropMap,
	ComponentType,
	Mixin,
	MixinName,
	Parallelize,
	Props,
	State,
} from "./types.js";

const isProxy = Symbol("isProxy");

export default class AxiomUI {
	public static helpers: ComponentHandlerHelpers = helpers;
	public static instances: ComponentInstance[] = [];
	private static handlers = { ...baseTypes } as Record<
		ComponentType,
		ComponentHandler
	>;
	private static renderStack = [] as ComponentInstance[];
	private static mixins = {} as Record<MixinName, Mixin>;
	private static freezeSymbol = Symbol("freezeProps");

	public static addType<
		T extends ComponentType,
		S extends State,
		M extends MixinName[],
	>(type: T, handler: ComponentHandler<T, S, M>): void {
		this.handlers[type] = handler;
	}

	public static addMixin<M extends MixinName, S extends State>(
		name: M,
		mixin: Mixin<M, ComponentType, S>,
	): void {
		this.mixins[name] = mixin as never; // `as never` to shut typescript up when no Mixins exist.
	}

	public static render<T extends ComponentType, M extends MixinName[] = []>(
		component: Component<T, M>,
	): ComponentInstance<T, M> {
		const componentInstance = {
			type: component.type,
			mixins: component.mixins || [],
			childInstances: [],
			element: null,
			parentInstance: null,
			props: {},
			state: {
				[this.freezeSymbol]: false,
			},
			reload: null,
		} as unknown as ComponentInstance;

		const parent = this.renderStack.at(-1);
		if (parent) {
			const identicalInstance = parent.childInstances.find(
				i =>
					i.type === component.type &&
					deepEqual(component.props, i.props) &&
					deepEqual(component.mixins || [], i.mixins),
			) as ComponentInstance<T, M>;

			if (identicalInstance) {
				const element = identicalInstance.element.cloneNode(true);

				identicalInstance.element.replaceWith(element);
				return identicalInstance;
			}

			componentInstance.parentInstance = parent;
			parent.childInstances.push(componentInstance);
		} else this.instances.push(componentInstance);

		const proxyHandler: ProxyHandler<ComponentPropMap[T]> = {
			set: (target, key, newValue) => {
				if (target[key] === newValue) return true;

				target[key] = newValue;

				// Use `componentInstance` instead of `target` because `target`
				// may be another object inside the props
				if (!componentInstance.state[this.freezeSymbol])
					this.updateDom(componentInstance);

				return true;
			},

			get: (target, key) => {
				if (key === isProxy) return true;

				const value = target[key];

				const isObject = typeof value === "object" && value !== null;
				const isPlain =
					Object.prototype.toString.call(value) ===
						"[object Object]" || Array.isArray(value);

				if (isObject && isPlain) {
					const proxy = new Proxy(value, proxyHandler);

					// Automatically inherit original prototype
					Object.setPrototypeOf(proxy, Reflect.getPrototypeOf(value));

					return proxy;
				}

				return target[key];
			},
		};

		componentInstance.props = new Proxy<Props<T, M>>(
			Object.keys(component.props).some(k =>
				component.props[k] ? component.props[k][isProxy] : false,
			)
				? deepUnproxyClone(component.props)
				: component.props,
			proxyHandler,
		);

		// componentInstance.props = new Proxy<Props<T, M>>(
		// 	component.props,
		// 	handler
		// );

		componentInstance.reload = () => this.updateDom(componentInstance);

		const handler = this.handlers[componentInstance.type];
		handler.setup?.(componentInstance, AxiomUI.helpers);

		if (handler.baseMixins)
			componentInstance.mixins.push(...(handler.baseMixins as []));

		this.getMixinMethods(componentInstance.mixins).setup.forEach(m =>
			m?.(componentInstance, helpers),
		);

		this.updateDom(componentInstance);

		return componentInstance as ComponentInstance<T, M>;
	}

	private static updateDom(componentInstance: ComponentInstance): void {
		this.renderStack.push(componentInstance);

		if (!this.handlers[componentInstance.type])
			throw new Error("Component renderer not implemented.");

		const { render, initialState } = this.handlers[componentInstance.type]!;

		// The existing state takes precedence over initial state
		componentInstance.state = {
			...initialState,
			...componentInstance.state,
			[this.freezeSymbol]: true,
		};

		const mixinMethods = this.getMixinMethods(componentInstance.mixins);
		mixinMethods.before.forEach(m => m?.(componentInstance, helpers));

		const newElement = render(componentInstance, AxiomUI.helpers);
		componentInstance.state[this.freezeSymbol] = false;

		const oldElement = componentInstance.element;
		componentInstance.element = newElement;

		mixinMethods.after.forEach(m => m?.(componentInstance, helpers));

		if (oldElement && oldElement.isConnected)
			componentInstance.element = diff(oldElement, newElement);

		const parentInstance = componentInstance.parentInstance;
		if (parentInstance && parentInstance.element == oldElement)
			parentInstance.element = componentInstance.element;

		this.renderStack.pop();
	}

	private static getMixinMethods<M extends MixinName[]>(
		mixinNames: M,
	): Parallelize<Mixin<M[number]>[]> {
		const mixins = mixinNames
			.map<Mixin>(m =>
				this.mixins[m] == undefined
					? (console.warn("Mixin not implemented: " + m), undefined)
					: this.mixins[m],
			)
			.filter(Boolean);

		return {
			setup: mixins.map(m => m.setup),
			before: mixins.map(m => m.before),
			after: mixins.map(m => m.after),
			cleanup: mixins.map(m => m.cleanup),
		};
	}
}

function deepEqual(x: unknown, y: unknown) {
	if (x === y) return true;
	if (x == null || y == null) return false;
	if (typeof x !== "object" || typeof y !== "object") return false;

	const xk = Object.keys(x);
	const yk = Object.keys(y);

	if (xk.length !== yk.length) return false;

	if (x instanceof HTMLElement || y instanceof HTMLElement) return false;

	for (const key in x) {
		const value1 = x[key];
		const value2 = y[key];

		if (!deepEqual(value1, value2)) {
			return false;
		}
	}
	return true;
}

function deepUnproxyClone<T>(value: T): T {
	if (typeof value !== "object" || value === null) return value;

	const clone = Object.create(value);

	if (value[isProxy]) {
		value = { ...value };
	}

	for (const key in value as object) {
		clone[key] = deepUnproxyClone(value[key]);
	}

	return clone;
}
