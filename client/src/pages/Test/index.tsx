import TimePicker from '../../components/Timer'
import CalendarPopUp from '../../components/CalendarPopUp/index';

const Test = () => {
	return (
		<div>
			<TimePicker
				title="Test"
				onTimeChange={() => {
					return true
				}}
			/>
			<CalendarPopUp/>
		</div>
	)
}

export default Test
