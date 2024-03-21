import TimePicker from '../../components/Timer'

const Test = () => {
	return (
		<div>
			<TimePicker
				title="Test"
				onTimeChange={() => {
					return true
				}}
			/>
		</div>
	)
}

export default Test
