import DayCalendarPopUp from '../../components/DayCalendarPopUp'
import DayStudentPopUp from '../../components/DayStudentPopUp/index'
import GroupOnline from '../../assets/1.svg'
import Online from '../../assets/2.svg'
import HomeStudent from '../../assets/3.svg'
import Group from '../../assets/4.svg'
import Home from '../../assets/5.svg'
import Client from '../../assets/6.svg'
import DayCalendarLine from '../../components/DayCalendarLine'
import DayCalendarLineClient from '../../components/DayCalendarLineClient/index'
const Test = () => {
	return (
		<div>
			{/* <DayCalendarPopUp/> */}
			{/* <DayStudentPopUp
				icon={Home}
				name="Группа Бэтта 1 Математика"
				address="г. Москва, ул. Мясницкая, 4"
				date="4 марта 2024"
				time="Пн 10:00 - 12:00"
				isGroup
			/> */}
			<DayCalendarLineClient
				id="1"
				key={1}
				name="Группа Бэтта 1 Математика"
				item="Математика"
				price="100"
				studentId="cluy6blsd0008itfbuk3tz2jw"
				procent='20'
			/>
		</div>
	)
}

export default Test
