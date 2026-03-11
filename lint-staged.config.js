/** @type {import('lint-staged').Configuration} */
export default {
	"*.{ts,tsx,js,jsx,css}": ["biome check --write"],
	"*.{ts,tsx}": [() => "tsc --noEmit"],
};
