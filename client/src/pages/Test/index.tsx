import MiniCalendar from '../../components/MiniCalendar/index';
import DayGroupPopUp from '../../components/DayGroupPopUp/index';
import DayStudentPopUp from '../../components/DayStudentPopUp/index';
const Test = () => {
	return (
		<>
			{/* <DayCalendarPopUp/> */}
			{/* <DayStudentPopUp
				icon={Home}
				name="Группа Бэтта 1 Математика"
				address="г. Москва, ул. Мясницкая, 4"
				date="4 марта 2024"
				time="Пн 10:00 - 12:00"
				isGroup
			/> */}
			{/* <DayCalendarLineClient
				id="1"
				key={1}
				name="Группа Бэтта 1 Математика"
				item="Математика"
				price="100"
				studentId="cluy6blsd0008itfbuk3tz2jw"
				procent='20'
			/> */}
			{/* <DayClientPopUp
				date="4 марта 2024"
				item="Математика"
				name="Петров"
				totalPrice="100"
			/> */}
			{/* <MiniCalendar /> */}
			<DayGroupPopUp/>
			{/* <DayStudentPopUp/> */}
		</>
	)
}

export default Test
