// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ComponentPropMap {}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface MixinPropMap {}

export type ComponentType = keyof ComponentPropMap;

export type MixinName = keyof MixinPropMap;

export interface ComponentHandler<
	T extends ComponentType = ComponentType,
	S extends State = State,
	M extends MixinName[] = MixinName[] | [],
> {
	render: (
		instance: StatefulComponentInstance<T, M, S>,
		helpers: ComponentHandlerHelpers,
	) => HTMLElement;
	setup?: (
		instance: StatefulComponentInstance<T, M, S>,
		helpers: ComponentHandlerHelpers,
	) => void;
	cleanup?: (
		instance: StatefulComponentInstance<T, M, S>,
		helpers: ComponentHandlerHelpers,
	) => void;
	initialState?: S;
	baseMixins?: M;
}

type StatefulComponentInstance<
	T extends ComponentType,
	M extends MixinName[] | [],
	S extends State,
> = ComponentInstance<T, M> & { state: S };

type MixinProps<M extends MixinName[]> = {
	[K in M[number]]: MixinPropMap[K];
};

export type Props<
	T extends ComponentType,
	M extends MixinName[],
> = ComponentPropMap[T] & (M extends [] ? unknown : MixinProps<M>);

export interface Component<T extends ComponentType, M extends MixinName[]> {
	type: T;
	props: Props<T, M>;
	mixins?: M;
}

export type State = Record<string | symbol, unknown>;

type HTMLElementStyle = {
	style:
		| (CSSStyleDeclaration & { [K in `--${string}`]: string })
		| CSSStyleDeclaration["cssText"];
};

export type ComponentHandlerHelpers = {
	el<T extends keyof HTMLElementTagNameMap>(
		tag: T,
		attr: DeepPartial<HTMLElementTagNameMap[T] & HTMLElementStyle>,
		...children: (HTMLElement | string)[]
	): HTMLElementTagNameMap[T];
	$(selector: string): HTMLElement[];
	formatDate(date: Date, template: string): string;
};

export interface ComponentInstance<
	T extends ComponentType = ComponentType,
	M extends MixinName[] = MixinName[] | [],
	S extends State = State,
> {
	readonly type: T;
	props: Props<T, M>;
	state: S;
	element: HTMLElement;
	childInstances: ComponentInstance[];
	parentInstance: ComponentInstance;
	reload: () => void;
	mixins?: M;
}

export interface Mixin<
	M extends MixinName = MixinName,
	T extends ComponentType = ComponentType,
	S extends State = State,
> {
	setup?: (
		instance: ComponentInstance<T, (MixinName | M)[], S>,
		helpers: ComponentHandlerHelpers,
	) => void;
	before?: (
		instance: ComponentInstance<T, (MixinName | M)[], S>,
		helpers: ComponentHandlerHelpers,
	) => void;
	after?: (
		instance: ComponentInstance<T, (MixinName | M)[], S>,
		helpers: ComponentHandlerHelpers,
	) => void;
	cleanup?: (
		instance: ComponentInstance<T, (MixinName | M)[], S>,
		helpers: ComponentHandlerHelpers,
	) => void;
	initialState?: S;
}

export type Parallelize<T extends object[]> = {
	[K in keyof T[number]]: T[number][K][];
};

export type DeepPartial<T> = T extends object
	? {
			[P in keyof T]?: DeepPartial<T[P]>;
		}
	: T;
