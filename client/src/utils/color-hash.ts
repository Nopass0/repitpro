// Simple hash function to generate consistent colors for subject names
export function hashStringToColor(str: string): string {
	let hash = 0
	for (let i = 0; i < str.length; i++) {
		hash = str.charCodeAt(i) + ((hash << 5) - hash)
	}

	// Generate HSL color with:
	// - High saturation (70%)
	// - Medium-high lightness (50%)
	// - Hue spread across color wheel
	const hue = Math.abs(hash % 360)
	return `hsl(${hue}, 70%, 50%)`
}
