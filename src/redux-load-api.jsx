export function onload(fn) {
	return Component => {Component.onload = fn;	return Component;};
}

export function load(components, params) {
	return Promise.all(components
		.filter(component => component.onload)
		.map(component => component.onload(params))
		.filter(result => result instanceof Promise));
}
