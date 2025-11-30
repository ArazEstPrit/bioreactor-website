import type { ComponentHandlerHelpers } from "./types.js";

const el: ComponentHandlerHelpers["el"] = (tag, attr, ...children) => {
	const element = document.createElement(tag);
	Object.assign(element, attr);

	if (attr.style) {
		for (const [key, value] of Object.entries(attr.style)) {
			element.style.setProperty(key, value as string);
		}
	}

	element.append(...children.filter(Boolean));
	return element;
};

const $: ComponentHandlerHelpers["$"] = selector => {
	return Array.from(document.querySelectorAll(selector)) as HTMLElement[];
};

const formatDate: ComponentHandlerHelpers["formatDate"] = (date, template) => {
	const format = (options: Intl.DateTimeFormatOptions) =>
		date.toLocaleString("en", {
			...options,
			hour12: false,
		});

	const pluralRules = new Intl.PluralRules(undefined, {
		type: "ordinal",
	});
	const formatOrdinals = (n: number) =>
		n +
		{
			one: "st",
			two: "nd",
			few: "rd",
			other: "th",
		}[pluralRules.select(n)];

	const values = {
		MMMM: format({ month: "long" }),
		MMM: format({ month: "short" }),
		MM: format({ month: "2-digit" }),
		M: format({ month: "numeric" }),
		DD: format({ day: "2-digit" }),
		Do: formatOrdinals(date.getDate()),
		D: format({ day: "numeric" }),
		dddd: format({ weekday: "long" }),
		ddd: format({ weekday: "short" }),
		do: formatOrdinals(date.getDay()),
		d: date.getDay(),
		YYYY: format({ year: "numeric" }),
		YY: format({ year: "2-digit" }),
		HH: format({ hour: "2-digit" }),
		H: format({ hour: "numeric" }),
		// The LocaleString thing doesn't work with 2-digit minutes for some reason.
		mm: String(date.getMinutes()).padStart(2, "0"),
		m: format({ minute: "numeric" }),
		ss: format({ second: "2-digit" }),
		s: format({ second: "numeric" }),
	};
	const keys = Object.keys(values).sort((a, b) => b.length - a.length);

	return replaceRecursive(template);

	function replaceRecursive(txt: string) {
		if (txt.length == 0) return "";

		for (const key of keys) {
			if (txt.startsWith(key))
				return values[key] + replaceRecursive(txt.slice(key.length));
		}

		if (txt[0] == "[") {
			const endIndex = txt.indexOf("]");

			return (
				txt.slice(0, endIndex) + replaceRecursive(txt.slice(endIndex))
			);
		}

		return txt[0] + replaceRecursive(txt.slice(1));
	}
};

export default {
	el,
	$,
	formatDate,
};
