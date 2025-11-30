import type { ComponentHandler } from "./types.js";

declare module "./types.js" {
	export interface ComponentPropMap {
		raw: {
			html: HTMLElement;
		};
	}
}

export default {
	raw: {
		render: ({ props }) => props.html,
	} as ComponentHandler<"raw">,
};
