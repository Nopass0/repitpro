export enum ArrowType {
	up = 'up',
	down = 'down',
	left = 'left',
	right = 'right',
}

interface IArrow {
	direction?: ArrowType
	className?: string
	style?: string
}

const Arrow = ({direction = ArrowType.down, className, style}: IArrow) => {
	let rotateDeg = 0

	switch (direction) {
		case ArrowType.up:
			rotateDeg = 180
			break
		case ArrowType.left:
			rotateDeg = 90
			break
		case ArrowType.right:
			rotateDeg = -90
			break
		case ArrowType.down:
			rotateDeg = 0
			break
		default:
			rotateDeg = 0
			break
	}

	return (
		<svg
			style={style}
			className={className}
			width="12"
			height="8"
			viewBox="0 0 12 8"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			style={{transform: `rotate(${rotateDeg}deg)`}}>
			<path d="M0 1.4L1.4 0L6 4.6L10.6 0L12 1.4L6 7.4L0 1.4Z" fill="black" />
		</svg>
	)
}

export default Arrow
