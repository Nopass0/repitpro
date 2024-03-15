import React from 'react'
import s from './index.module.scss'

interface ILine {
	className?: string
	children?: React.ReactNode
	style?: React.CSSProperties
	active?: boolean
	weekend?: boolean
}

const ScheduleDate: React.FC<ILine> = ({
	className,
	children,
	style,
	active,
	weekend,
}: ILine) => {
	return (
		<div
			style={
				style
					? {borderRadius: '10px', border: '1px solid #25991C', ...style}
					: {
							width: '34px',
							height: '34px',
							borderRadius: '10px',
							border: '1px solid #25991C',
							display: 'flex',
							justifyContent: 'center',	
							alignItems: 'center',
							...active && {
								background: '#25991C',
								color: '#fff',
							},
							...weekend && {
								border: "1px solid #DC5C5C",
								background: '#DC5C5C',
								color: '#fff',
							}
					  }
			}
			className={className}>
			{children}
		</div>
	)
}

export default ScheduleDate
