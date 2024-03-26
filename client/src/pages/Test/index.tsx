import TimePicker from '../../components/Timer'
import CalendarPopUp from '../../components/CalendarPopUp/index';
import NowLevel from '../../components/NowLevel/index';
import PhoneInput from '../../components/InputPhoneNumber/index';

const Test = () => {
	return (
		<div>
			{/* <TimePicker
				title="Test"
				onTimeChange={() => {
					return true
				}}
			/>
			<CalendarPopUp/> */}
			<NowLevel amountInputs={5}/>
			<PhoneInput/>
		</div>
	)
}

export default Test
