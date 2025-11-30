export function diff(
	oldElement: HTMLElement,
	newElement: HTMLElement
): HTMLElement {
	if (oldElement.tagName !== newElement.tagName) {
		const clonedNewElement = newElement.cloneNode(true) as HTMLElement;
		oldElement.replaceWith(clonedNewElement);
		return clonedNewElement;
	}

	mergeAttributes(oldElement, newElement);
	mergeProperties(oldElement, newElement);
	reconcileChildren(oldElement, newElement);

	return oldElement;
}

function mergeAttributes(oldElement: HTMLElement, newElement: HTMLElement) {
	const oldAttrs = Array.from(oldElement.attributes);
	const newAttrs = Array.from(newElement.attributes);

	for (const attr of oldAttrs) {
		if (!newElement.hasAttribute(attr.name)) {
			console.log(newElement.attributes);
			oldElement.removeAttribute(attr.name);
		}
	}

	for (const attr of newAttrs) {
		const currentValue = oldElement.getAttribute(attr.name);
		if (currentValue !== attr.value) {
			oldElement.setAttribute(attr.name, attr.value);
		}
	}
}

function mergeProperties(oldElement: HTMLElement, newElement: HTMLElement) {
	for (const prop in newElement) {
		if (prop in oldElement && prop.startsWith("on")) {
			oldElement[prop] = newElement[prop];
		}
	}
}

function reconcileChildren(oldElement: HTMLElement, newElement: HTMLElement) {
	const oldChildren = Array.from(oldElement.childNodes);
	const newChildren = Array.from(newElement.childNodes);
	const maxLength = Math.max(oldChildren.length, newChildren.length);

	for (let i = 0; i < maxLength; i++) {
		const oldChild = oldChildren[i];
		const newChild = newChildren[i];

		if (oldChild && newChild) {
			if (
				oldChild.nodeType === Node.ELEMENT_NODE &&
				newChild.nodeType === Node.ELEMENT_NODE
			) {
				diff(oldChild as HTMLElement, newChild as HTMLElement);
			} else if (
				oldChild.nodeType === Node.TEXT_NODE &&
				newChild.nodeType === Node.TEXT_NODE
			) {
				if (oldChild.textContent !== newChild.textContent) {
					oldChild.textContent = newChild.textContent;
				}
			} else {
				oldChild.replaceWith(newChild);
			}
		} else if (newChild) {
			oldElement.appendChild(newChild);
		} else if (oldChild) {
			oldChild.remove();
		}
	}
}
