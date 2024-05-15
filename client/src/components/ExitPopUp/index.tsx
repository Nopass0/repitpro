import s from './index.module.scss'
interface IExitPopUp {
	title?: string
	yes?: () => void
	no?: () => void
	style?: React.CSSProperties
	className?: string
}
const ExitPopUp = ({title, yes, no, style, className}: IExitPopUp) => {
	return (
		<div style={style} className={`${s.wrapper} ${className}`}>
			<h1>{title}</h1>
			<div className={s.btn}>
				<button onClick={no} className={s.No}>
					Нет
				</button>
				<button onClick={yes} className={s.Yes}>
					Да
				</button>
			</div>
		</div>
	)
}

export default ExitPopUp
