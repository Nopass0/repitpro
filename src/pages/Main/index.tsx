import Calendar from '../../components/Calendar'
import Cells from '../../mock/cells'
import s from './index.module.scss'

interface IMain {}

const Main = ({}: IMain) => {
	return (
		<>
			{/* <div className={s.center}></div> */}
			<Calendar className={s.center} cells={Cells} />
		</>
	)
}

export default Main
