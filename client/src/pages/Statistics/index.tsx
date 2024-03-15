import {
	Chart as ChartJS,
	ArcElement,
	Tooltip,
	Legend,
	LineElement,
	CategoryScale,
	LinearScale,
	PointElement,
	scales,
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
	for (let i = 0; i < 200; i++) {
		//сделай плавный график волнистый (каждая точка должна отличаться от предыдущей максимальной разницей в 10)
		let a = Math.abs(Math.random() * Math.abs(Math.cos(i)))
		if (datasets[i - 1] - a < Math.E) {
			if (datasets[i - 1] - a > 0) {
				a = datasets[i - 1] - a * 0.1
			} else {
				a = datasets[i - 1] + datasets[i - 1] * 0.06
			}
		}
		datasets.push(a)
	}
	return datasets
}

const options = {
	responsive: true,
	maintainAspectRatio: false,

	//width and height

	aspectRatio: 2,

	plugins: {
		legend: {
			//off
			display: false,
		},
		title: {
			display: false,
		},
		tooltip: {
			enabled: false,
		},

		//плавнее

		scales: {
			x: {
				ticks: {
					display: false,
				},
				grid: {
					display: false,
				},
			},
			y: {
				ticks: {
					display: false,
				},
				grid: {
					display: false,
				},
			},
		},
	},
}

let data = {
	labels: getLabels(),
	datasets: [
		{
			label: 'Dataset 1',
			data: getDatasets(),
			fill: false,
			backgroundColor: '#FF0000',
			borderColor: '#FF0000',
		},
		{
			label: 'Dataset 2',
			data: getDatasets(),
			fill: false,
			backgroundColor: '#9747FF',
			borderColor: '#9747FF',
		},
		{
			label: 'Dataset 3',
			data: getDatasets(),
			fill: false,
			backgroundColor: '#0027FF',
			borderColor: '#0027FF',
		},
		{
			label: 'Dataset 4',
			data: getDatasets(),
			fill: false,
			backgroundColor: '#25991C',
			borderColor: '#25991C',
		},
		{
			label: 'Dataset 5',
			data: getDatasets(),
			fill: false,
			backgroundColor: '#C7CB00',
			borderColor: '#C7CB00',
		},
	],
}

const Statistics = ({}: IStatistics) => {
	return (
		<>
			{/* <div className={s.center}></div> */}
			<div className={s.wrapper}>
				<Line data={data} options={options} />
			</div>
		</>
	)
}

export default Statistics
