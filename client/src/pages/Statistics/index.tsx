import {
	Chart as ChartJS,
	ArcElement,
	Tooltip,
	Legend,
	LineElement,
	CategoryScale,
	LinearScale,
	PointElement,
} from 'chart.js'
import {Line} from 'react-chartjs-2'
import s from './index.module.scss'
ChartJS.register(
	ArcElement,
	Tooltip,
	Legend,
	LineElement,
	CategoryScale,
	LinearScale,
	PointElement,
)

interface IStatistics {}

const getLabels = () => {
	let labels = []
	for (let i = 0; i < 200; i++) {
		labels.push(i)
	}
	return labels
}

const getDatasets = () => {
	let datasets = []
	for (let i = -200; i < 200; i++) {
		//сделай плавный график волнистый (каждая точка должна отличаться от предыдущей максимальной разницей в 10)
		datasets.push(
			Math.sin(i) * Math.cos(i) > 10 ? Math.cos(i) : Math.cos(i) / Math.sin(i),
		)
	}
	return datasets
}

let data = {
	labels: getLabels(),
	datasets: [
		{
			label: 'Dataset 1',
			data: getDatasets(),
			fill: false,
			backgroundColor: 'rgb(255, 99, 132)',
			borderColor: 'rgba(255, 99, 132, 0.2)',
		},
		{
			label: 'Dataset 2',
			data: getDatasets(),
			fill: false,
			backgroundColor: 'rgb(75, 192, 192)',
			borderColor: 'rgba(75, 192, 192, 0.2)',
		},
	],
}

const Statistics = ({}: IStatistics) => {
	return (
		<>
			{/* <div className={s.center}></div> */}
			<div className={s.wrapper}>
				<Line data={data} />
			</div>
		</>
	)
}

export default Statistics
