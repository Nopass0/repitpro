import React, {useEffect, useState, useCallback} from 'react'
import {useNavigate} from 'react-router-dom'
import {useSelector} from 'react-redux'
import {
	Checkbox,
	FormControl,
	InputLabel,
	MenuItem,
	Select,
	styled,
} from '@mui/material'
import ShowChartIcon from '@mui/icons-material/ShowChart'
import BarChartIcon from '@mui/icons-material/BarChart'
import CloseIcon from '@mui/icons-material/Close'
import socket from '../../socket'
import GraphicBlock from '../../components/GraphicBlock'
import Line from '../../components/Line'
import CheckBox from '../../components/CheckBox'
import Arrow from '../../assets/arrow'
import s from './index.module.scss'
import MiniCalendar from '@/components/MiniCalendar'

const StyledPickersLayout = styled('span')({
	'.MuiDateCalendar-root': {
		color: '#25991c',
		borderRadius: 2,
		borderWidth: 1,
		borderColor: '#25991c',
		border: '1px solid',
	},
	'.MuiPickersDay-today': {
		border: '1px solid #25991c',
	},
	'.Mui-selected': {
		color: '#fff',
		backgroundColor: '#25991c !important',
	},
	'.Mui-selected:focus': {
		color: '#fff',
		backgroundColor: '#25991c',
	},
	'.MuiButtonBase-root:focus': {
		color: '#fff',
		backgroundColor: '#25991c',
	},
	'.MuiPickersYear-yearButton .Mui-selected:focus': {
		color: '#fff',
		backgroundColor: '#25991c',
	},
})

const options = {
	responsive: true,
	maintainAspectRatio: false,
	aspectRatio: 2,
	plugins: {
		legend: {display: false},
		title: {display: false},
		tooltip: {enabled: true},
		scales: {
			x: {ticks: {display: false}, grid: {display: false}},
			y: {ticks: {display: false}, grid: {display: false}},
		},
	},
	scales: {
		x: {stacked: true},
		y: {stacked: true},
	},
}

const optionsBar = {
	responsive: true,
	maintainAspectRatio: false,
	aspectRatio: 2,
	plugins: {
		legend: {display: false},
		title: {display: false, text: 'Chart.js Bar Chart - Stacked'},
	},
	scales: {
		x: {stacked: true},
		y: {stacked: true},
	},
}

const Statistics = () => {
	const navigate = useNavigate()
	const user = useSelector((state) => state.user)
	const [chooseGraphic, setChooseGraphic] = useState(0)
	const [subjects, setSubjects] = useState([])
	const [sortColumn, setSortColumn] = useState('name')
	const [sortDirection, setSortDirection] = useState(null)

	// Tables CONST
	const [cliTableDateState, setCliTableDateState] = useState<boolean>(0)
	const [cliTableDateStart, setCliTableDateStart] = useState(
		new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
	)
	const [cliTableDateEnd, setCliTableDateEnd] = useState(new Date())

	const [studTableDateState, setStudTableDateState] = useState<boolean>(0)
	const [studTableDateStart, setStudTableDateStart] = useState(
		new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
	)
	const [studTableDateEnd, setStudTableDateEnd] = useState(new Date())

	const [studFinSubjects, setStudFinSubjects] = useState([])
	const [studFinDate, setStudFinDate] = useState(0)
	const [studFinDateStart, setStudFinDateStart] = useState(
		new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
	)
	const [studFinDateEnd, setStudFinDateEnd] = useState(new Date())

	const [studAmSubjects, setStudAmSubjects] = useState([])
	const [studAmDate, setStudAmDate] = useState(0)
	const [studAmDateStart, setStudAmDateStart] = useState(
		new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
	)
	const [studAmDateEnd, setStudAmDateEnd] = useState(new Date())

	const [studLesSubjects, setStudLesSubjects] = useState([])
	const [studLesDate, setStudLesDate] = useState(0)
	const [studLesDateStart, setStudLesDateStart] = useState(
		new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
	)
	const [studLesDateEnd, setStudLesDateEnd] = useState(new Date())

	const [cliFinSubjects, setCliFinSubjects] = useState([])
	const [cliFinDate, setCliFinDate] = useState(0)
	const [cliFinDateStart, setCliFinDateStart] = useState(
		new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
	)
	const [cliFinDateEnd, setCliFinDateEnd] = useState(new Date())

	const [cliAmSubjects, setCliAmSubjects] = useState([])
	const [cliAmDate, setCliAmDate] = useState(0)
	const [cliAmDateStart, setCliAmDateStart] = useState(
		new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
	)
	const [cliAmDateEnd, setCliAmDateEnd] = useState(new Date())

	const [cliWorkSubjects, setCliWorkSubjects] = useState([])
	const [cliWorkDate, setCliWorkDate] = useState(0)
	const [cliWorkDateStart, setCliWorkDateStart] = useState(
		new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
	)
	const [cliWorkDateEnd, setCliWorkDateEnd] = useState(new Date())

	const [studRelatSubjects, setStudRelatSubjects] = useState([])
	const [studRelatDate, setStudRelatDate] = useState(0)
	const [studRelatDateStart, setStudRelatDateStart] = useState(
		new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
	)
	const [studRelatDateEnd, setStudRelatDateEnd] = useState(new Date())

	const [financeData, setFinanceData] = useState({labels: [], datasets: []})
	const [studentCountData, setStudentCountData] = useState({
		labels: [],
		datasets: [],
	})
	const [studentCountItemsData, setStudentCountItemsData] = useState({
		labels: [],
		datasets: [],
	})
	const [clientsFinanceData, setClientsFinanceData] = useState({
		labels: [],
		datasets: [],
	})
	const [clientsCountData, setClientsCountData] = useState({
		labels: [],
		datasets: [],
	})
	const [clientsWorksData, setClientsWorksData] = useState({
		labels: [],
		datasets: [],
	})
	const [clientsNstudentsCompareData, setClientsNstudentsCompareData] =
		useState({labels: [], datasets: []})

	const [studentsData, setStudentsData] = useState([])
	const [clientData, setClientData] = useState([])

	// Tables Change's

	const cliTableOnChangeDate = () => {}

	const columnTranslations = {
		name: 'Имя',
		lessons: 'Занятия',
		avgCost: 'Средняя стоимость',
		cancel: 'Отменено',
		income: 'Доход',
		consumption: 'Расход',
		duty: 'Долг',
		total: 'Итого',
	}

	useEffect(() => {
		console.log(
			`\n-----------------Статистика загружена---------------\n${JSON.stringify(studentsData, null, 2)}\n----------------\n`,
		)
	}, [columnTranslations])

	// В начале файла Statistics.tsx добавим новые состояния
const [showStudents, setShowStudents] = useState(true);
const [showClients, setShowClients] = useState(true);

// Обновим функцию renderComparisonCheckboxes
const renderComparisonCheckboxes = (data) => {
  // Создаем стейты внутри функции компонента Statistics, НЕ внутри renderComparisonCheckboxes
  // const [showStudents, setShowStudents] = useState(true);
  // const [showClients, setShowClients] = useState(true);

  // Функция подсчета общего количества для определенного типа (студенты/клиенты)
  const calculateTotal = (label) => {
    const dataset = data.datasets.find((ds) => ds.label === label);
    if (!dataset) return 0;

    // Суммируем все значения в наборе данных, заменяя undefined и null на 0
    return dataset.data.reduce((sum, val) => sum + (val || 0), 0);
  };

  // Получаем общие суммы для каждого типа
  const clientsTotal = calculateTotal('Заказчики');
  const studentsTotal = calculateTotal('Ученики');
  const grandTotal = clientsTotal + studentsTotal;

  // Функция расчета процентного соотношения
  const getPercentage = (value) => {
    if (grandTotal === 0) return '0.0';
    return ((value / grandTotal) * 100).toFixed(1);
  };

  // Обработчик изменения чекбокса студентов
  const handleStudentsChange = (e) => {
    const newShowStudents = e.target.checked;
    setShowStudents(newShowStudents);

    // Переизлучаем событие с обновленными параметрами
    socket.emit('getStudentClientComparisonData', {
      token: user.token,
      startDate: studRelatDateStart,
      endDate: studRelatDateEnd,
      showStudents: newShowStudents,
      showClients,
    });
  };

  // Обработчик изменения чекбокса клиентов
  const handleClientsChange = (e) => {
    const newShowClients = e.target.checked;
    setShowClients(newShowClients);

    // Переизлучаем событие с обновленными параметрами
    socket.emit('getStudentClientComparisonData', {
      token: user.token,
      startDate: studRelatDateStart,
      endDate: studRelatDateEnd,
      showStudents,
      showClients: newShowClients,
    });
  };

  // Получаем цвета из датасетов
  const getDatasetColor = (label) => {
    const dataset = data.datasets.find((ds) => ds.label === label);
    return dataset?.backgroundColor || '#25991c';
  };

  // Формируем структуру компонента
  return (
    <div className={s.subjectCheckboxes}>
      {/* Заголовок таблицы */}
      <div className={s.subjectHeader}>
        <p></p>
        <p>Кол-во</p>
        <p>%</p>
      </div>

      {/* Блок с клиентами */}
      <div className={s.subjectOne}>
        <label>
          <Checkbox
            style={{
              color: getDatasetColor('Заказчики'),
            }}
            checked={showClients}
            onChange={handleClientsChange}
          />
          Заказчики
        </label>
        <div className={s.subjectCounts}>
          <p>{clientsTotal}</p>
        </div>
        <div className={s.subjectCounts}>
          <p>{getPercentage(clientsTotal)}%</p>
        </div>
      </div>

      {/* Блок со студентами */}
      <div className={s.subjectOne}>
        <label>
          <Checkbox
            style={{
              color: getDatasetColor('Ученики'),
            }}
            checked={showStudents}
            onChange={handleStudentsChange}
          />
          Ученики
        </label>
        <div className={s.subjectCounts}>
          <p>{studentsTotal}</p>
        </div>
        <div className={s.subjectCounts}>
          <p>{getPercentage(studentsTotal)}%</p>
        </div>
      </div>

      {/* Итоговая строка */}
      <div className={s.subjectCheckboxesAll}>
        <p>Всего:</p>
        <p>{grandTotal}</p>
      </div>
    </div>
  );
};

	const getSubjectIds = useCallback(
		(selectedSubjects) => {
			return selectedSubjects.length === 0
				? subjects.map((subject) => subject.id)
				: selectedSubjects.map((subject) => subject.id)
		},
		[subjects],
	)

	const handleSort = useCallback(
		(column) => {
			setSortColumn(column)
			setSortDirection((prevDirection) =>
				sortColumn === column
					? prevDirection === 'asc'
						? 'desc'
						: 'asc'
					: 'asc',
			)
		},
		[sortColumn],
	)

	const sortData = useCallback((data, column, direction) => {
		return [...data].sort((a, b) => {
			if (column === 'name') {
				return direction === 'asc'
					? a[column].localeCompare(b[column])
					: b[column].localeCompare(a[column])
			}
			return direction === 'asc' ? a[column] - b[column] : b[column] - a[column]
		})
	}, [])

	const updateDateRange = useCallback((dateState, setDateStart, setDateEnd) => {
		const currentDate = new Date()
		switch (dateState) {
			case 0:
				setDateStart(new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000))
				setDateEnd(currentDate)
				break
			case 1:
				setDateStart(
					new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
				)
				setDateEnd(currentDate)
				break
			case 2:
				setDateStart(new Date(currentDate.getFullYear(), 0, 1))
				setDateEnd(currentDate)
				break
			case 3:
				setDateStart(new Date(2000, 0, 1))
				setDateEnd(currentDate)
				break
			default:
				break
		}
	}, [])

	useEffect(() => {
		socket.emit('getAllItemsIdsAndNames', user.token)
		socket.on('getAllItemsIdsAndNames', (data) => {
			console.log(
				'\n---------------ids--------------\n',
				data,
				'\n-------------------------\n',
			)
			setSubjects(data)
			setStudFinSubjects(data)
			setStudAmSubjects(data)
			setStudLesSubjects(data)
			setCliFinSubjects(data)
			setCliAmSubjects(data)
			setCliWorkSubjects(data)
			setStudRelatSubjects(data)
		})

		return () => {
			socket.off('getAllItemsIdsAndNames')
		}
	}, [user.token])

	useEffect(() => {
		const emitDataRequests = () => {
			socket.emit('getStudentFinanceData', {
				token: user.token,
				subjectIds: getSubjectIds(studFinSubjects),
				startDate: studFinDateStart,
				endDate: studFinDateEnd,
			})
			socket.emit('getStudentCountData', {
				token: user.token,
				subjectIds: getSubjectIds(studAmSubjects),
				startDate: studAmDateStart,
				endDate: studAmDateEnd,
			})
			socket.emit('getStudentLessonsData', {
				token: user.token,
				subjectIds: getSubjectIds(studLesSubjects),
				startDate: studLesDateStart,
				endDate: studLesDateEnd,
			})
			socket.emit('getClientFinanceData', {
				token: user.token,
				subjectIds: getSubjectIds(cliFinSubjects),
				startDate: cliFinDateStart,
				endDate: cliFinDateEnd,
			})
			socket.emit('getClientCountData', {
				token: user.token,
				subjectIds: getSubjectIds(cliAmSubjects),
				startDate: cliAmDateStart,
				endDate: cliAmDateEnd,
			})
			socket.emit('getClientWorksData', {
				token: user.token,
				subjectIds: getSubjectIds(cliWorkSubjects),
				startDate: cliWorkDateStart,
				endDate: cliWorkDateEnd,
			})
			socket.emit('getStudentClientComparisonData', {
				token: user.token,
				subjectIds: getSubjectIds(studRelatSubjects),
				startDate: studRelatDateStart,
				endDate: studRelatDateEnd,
			})
			socket.emit('getTableData', {
				token: user.token,
				dateRange: {start: studFinDateStart, end: studFinDateEnd},
			})
			socket.emit('getClientTableData', {
				token: user.token,
				dateRange: {start: cliAmDateStart, end: cliAmDateEnd},
			})
		}

		emitDataRequests()

		socket.on('getStudentFinanceData', setFinanceData)
		socket.on('getStudentCountData', setStudentCountData)
		socket.on('getStudentLessonsData', setStudentCountItemsData)
		socket.on('getClientFinanceData', setClientsFinanceData)
		socket.on('getClientCountData', setClientsCountData)
		socket.on('getClientWorksData', setClientsWorksData)
		socket.on('getStudentClientComparisonData', setClientsNstudentsCompareData)
		socket.on('getTableData', setStudentsData)
		socket.on('getClientTableData', setClientData)

		return () => {
			socket.off('getStudentFinanceData')
			socket.off('getStudentCountData')
			socket.off('getStudentLessonsData')
			socket.off('getClientFinanceData')
			socket.off('getClientCountData')
			socket.off('getClientWorksData')
			socket.off('getStudentClientComparisonData')
			socket.off('getTableData')
			socket.off('getClientTableData')
		}
	}, [
		user.token,
		getSubjectIds,
		studFinSubjects,
		studFinDateStart,
		studFinDateEnd,
		studAmSubjects,
		studAmDateStart,
		studAmDateEnd,
		studLesSubjects,
		studLesDateStart,
		studLesDateEnd,
		cliFinSubjects,
		cliFinDateStart,
		cliFinDateEnd,
		cliAmSubjects,
		cliAmDateStart,
		cliAmDateEnd,
		cliWorkSubjects,
		cliWorkDateStart,
		cliWorkDateEnd,
		studRelatSubjects,
		studRelatDateStart,
		studRelatDateEnd,
	])

	// const renderSubjectCheckboxes = (
	// 	selectedSubjects,
	// 	setSelectedSubjects,
	// 	data,
	// ) => {
	// 	// Создаем объект с уникальными названиями предметов
	// 	const uniqueSubjects = subjects.reduce((acc, subject) => {
	// 		if (!acc[subject.itemName]) {
	// 			acc[subject.itemName] = subject
	// 		}
	// 		return acc
	// 	}, {})

	// 	const handleCheckboxChange = (subjectName, isChecked) => {
	// 		if (isChecked) {
	// 			// Добавляем все предметы с данным названием
	// 			const subjectsToAdd = subjects.filter((s) => s.itemName === subjectName)
	// 			setSelectedSubjects((prev) => [...prev, ...subjectsToAdd])
	// 		} else {
	// 			// Удаляем все предметы с данным названием
	// 			setSelectedSubjects((prev) =>
	// 				prev.filter((s) => s.itemName !== subjectName),
	// 			)
	// 		}
	// 	}

	// 	return (
	// 		<div className={s.subjectCheckboxes}>
	// 			<div className={s.subjectHeader}>
	// 				<p></p>
	// 				<p>Кол-во</p>
	// 				<p>%</p>
	// 			</div>
	// 			{Object.values(uniqueSubjects).map((subject) => {
	// 				const dataset = data.datasets.find(
	// 					(ds) => ds.label === subject.itemName,
	// 				)
	// 				const color = dataset?.backgroundColor || '#25991c'
	// 				const isChecked = selectedSubjects.some(
	// 					(s) => s.itemName === subject.itemName,
	// 				)

	// 				return (
	// 					<>
	// 						<div className={s.subjectOne}>
	// 							<label key={subject.itemName}>
	// 								<Checkbox
	// 									style={{color}}
	// 									checked={isChecked}
	// 									onChange={(e) =>
	// 										handleCheckboxChange(subject.itemName, e.target.checked)
	// 									}
	// 								/>
	// 								{subject.itemName}
	// 							</label>
	// 							<div className={s.subjectCounts}>
	// 								<p>1</p>
	// 							</div>
	// 							<div className={s.subjectCounts}>
	// 								{' '}
	// 								{/* Добавлен контейнер для выравнивания */}
	// 								<p>1</p>
	// 							</div>
	// 						</div>
	// 					</>
	// 				)
	// 			})}
	// 			<div className={s.subjectCheckboxesAll}>
	// 				<p>Всего:</p>
	// 				<p></p>
	// 			</div>
	// 		</div>
	// 	)
	// }

	const renderSubjectCheckboxes = (
		selectedSubjects,
		setSelectedSubjects,
		data,
	) => {
		// Создаем объект с уникальными названиями предметов
		const uniqueSubjects = subjects.reduce((acc, subject) => {
			if (!acc[subject.itemName]) {
				acc[subject.itemName] = subject
			}
			return acc
		}, {})

		const handleCheckboxChange = (subjectName, isChecked) => {
			if (isChecked) {
				// Добавляем все предметы с данным названием
				const subjectsToAdd = subjects.filter((s) => s.itemName === subjectName)
				setSelectedSubjects((prev) => [...prev, ...subjectsToAdd])
			} else {
				// Удаляем все предметы с данным названием
				setSelectedSubjects((prev) =>
					prev.filter((s) => s.itemName !== subjectName),
				)
			}
		}

		// Calculating totals for all datasets
		const calculatedSubjects = Object.values(uniqueSubjects).map((subject) => {
			const dataset = data.datasets.find((ds) => ds.label === subject.itemName)
			const subjectTotal = dataset
				? dataset.data.reduce((sum, val) => sum + (val || 0), 0)
				: 0
			return {
				subject,
				total: subjectTotal,
			}
		})

		const grandTotal = calculatedSubjects.reduce(
			(sum, {total}) => sum + total,
			0,
		)

		return (
			<div className={s.subjectCheckboxes}>
				<div className={s.subjectHeader}>
					<p></p>
					<p>Кол-во</p>
					<p>%</p>
				</div>
				{calculatedSubjects.map(({subject, total}) => {
					const dataset = data.datasets.find(
						(ds) => ds.label === subject.itemName,
					)
					const color = dataset?.backgroundColor || '#25991c'
					const isChecked = selectedSubjects.some(
						(s) => s.itemName === subject.itemName,
					)
					const percentage =
						grandTotal > 0 ? ((total / grandTotal) * 100).toFixed(1) : '0.0'

					return (
						<div key={subject.itemName} className={s.subjectOne}>
							<label>
								<Checkbox
									style={{color}}
									checked={isChecked}
									onChange={(e) =>
										handleCheckboxChange(subject.itemName, e.target.checked)
									}
								/>
								{subject.itemName}
							</label>
							<div className={s.subjectCounts}>
								<p>{total}</p>
							</div>
							<div className={s.subjectCounts}>
								<p>{percentage}%</p>
							</div>
						</div>
					)
				})}
				<div className={s.subjectCheckboxesAll}>
					<p>Всего:</p>
					<p>{grandTotal}</p>
				</div>
			</div>
		)
	}

	const padTable = (data, columns, rows = 10) => {
		const paddedData = [...data]
		while (paddedData.length < rows) {
			paddedData.push(columns.reduce((acc, col) => ({...acc, [col]: ''}), {}))
		}
		return paddedData
	}

	useEffect(() => {
		// Устанавливаем сортировку по умолчанию для первого столбца
		handleSort('name')
	}, [])

	return (
		<div className={s.wrapper}>
			<div className={s.Header}>
				<button onClick={() => setChooseGraphic(0)}>
					<ShowChartIcon
						className={`${chooseGraphic === 0 && s.activeIcon} ${s.Icon}`}
					/>
				</button>
				<button onClick={() => setChooseGraphic(1)}>
					<BarChartIcon
						className={`${chooseGraphic === 1 && s.activeIcon} ${s.Icon}`}
					/>
				</button>
				<button onClick={() => navigate('../')}>
					<CloseIcon className={s.CloseIcon} />
				</button>
			</div>
			<div className={s.MainBlock}>
				<GraphicBlock
					StyledPickersLayout={StyledPickersLayout}
					ItemState={studFinSubjects}
					OnChangeItem={(e) => setStudFinSubjects(e.target.value)}
					DateState={studFinDate}
					OnChangeDate={(e) => {
						setStudFinDate(e.target.value)
						updateDateRange(
							e.target.value,
							setStudFinDateStart,
							setStudFinDateEnd,
						)
					}}
					DateStartState={studFinDateStart}
					OnChangeDateStart={setStudFinDateStart}
					DateEndState={studFinDateEnd}
					OnChangeDateEnd={setStudFinDateEnd}
					chooseGraphic={chooseGraphic}
					data={financeData}
					options={options}
					yScaleName="Рубли"
					optionsBar={optionsBar}
					title="Ученики-Финансы"
					renderCheckboxes={() =>
						renderSubjectCheckboxes(
							studFinSubjects,
							setStudFinSubjects,
							financeData,
						)
					}
				/>
				<Line width="100%" className={s.Line} />

				<GraphicBlock
					StyledPickersLayout={StyledPickersLayout}
					ItemState={studAmSubjects}
					OnChangeItem={(e) => setStudAmSubjects(e.target.value)}
					DateState={studAmDate}
					OnChangeDate={(e) => {
						setStudAmDate(e.target.value)
						updateDateRange(
							e.target.value,
							setStudAmDateStart,
							setStudAmDateEnd,
						)
					}}
					DateStartState={studAmDateStart}
					OnChangeDateStart={setStudAmDateStart}
					DateEndState={studAmDateEnd}
					OnChangeDateEnd={setStudAmDateEnd}
					chooseGraphic={chooseGraphic}
					data={studentCountData}
					options={options}
					optionsBar={optionsBar}
					title="Ученики-Количество"
					renderCheckboxes={() =>
						renderSubjectCheckboxes(
							studFinSubjects,
							setStudFinSubjects,
							financeData,
						)
					}
				/>
				<Line width="100%" className={s.Line} />

				<GraphicBlock
					StyledPickersLayout={StyledPickersLayout}
					ItemState={studLesSubjects}
					OnChangeItem={(e) => setStudLesSubjects(e.target.value)}
					DateState={studLesDate}
					OnChangeDate={(e) => {
						setStudLesDate(e.target.value)
						updateDateRange(
							e.target.value,
							setStudLesDateStart,
							setStudLesDateEnd,
						)
					}}
					DateStartState={studLesDateStart}
					OnChangeDateStart={setStudLesDateStart}
					DateEndState={studLesDateEnd}
					OnChangeDateEnd={setStudLesDateEnd}
					chooseGraphic={chooseGraphic}
					data={studentCountItemsData}
					options={options}
					optionsBar={optionsBar}
					title="Ученики-Занятия"
					renderCheckboxes={() =>
						renderSubjectCheckboxes(
							studLesSubjects,
							setStudLesSubjects,
							studentCountItemsData,
						)
					}
				/>
				<Line width="100%" className={s.Line} />

				{/* Students Table */}
				<div className={s.GraphicBlock}>
					<div className={s.MenuForGraphic}>
						<p className={s.TitleTable}>Ученики сводная таблица</p>
						<FormControl variant="standard" className={s.formControl}>
							<InputLabel id="date-select-label">Выберите период</InputLabel>
							<Select
								labelId="date-select-label"
								className={s.muiSelect}
								value={studTableDateState}
								onChange={(e) => {
									setStudTableDateState(e.target.value)
									updateDateRange(
										e.target.value,
										setStudTableDateStart,
										setStudTableDateEnd,
									)
								}}
								defaultValue={0}>
								<MenuItem value={0}>За последние 30 дней</MenuItem>
								<MenuItem value={1}>С начала месяца</MenuItem>
								<MenuItem value={2}>С начала года</MenuItem>
								<MenuItem value={3}>За всё время</MenuItem>
							</Select>
						</FormControl>
						<Line width="260px" />
						<div className={s.Dates}>
							<div className={s.DatePicker}>
								<MiniCalendar
									value={studTableDateStart}
									onChange={setStudTableDateStart}
									calendarId={'cliTable-left'}
								/>
							</div>
							<Line width="20px" className={s.LineDate} />
							<div className={s.DatePicker}>
								<MiniCalendar
									value={studTableDateEnd}
									onChange={setStudTableDateEnd}
									calendarId={`cliTable-right`}
								/>
							</div>
						</div>
					</div>
					<div className={s.TableWrap}>
						<table className={s.Table}>
							<thead className={s.Thead}>
								<tr className={s.Tr}>
									{Object.keys(columnTranslations).map((column) => (
										<th
											key={column}
											onClick={() => handleSort(column)}
											className={s.Th}>
											{columnTranslations[column]}:{' '}
											{sortColumn === column && (
												<Arrow
													direction={sortDirection === 'asc' ? 'up' : 'down'}
												/>
											)}
										</th>
									))}
								</tr>
							</thead>
							<tbody className={s.Tbody}>
								{padTable(
									sortData(studentsData, sortColumn, sortDirection),
									Object.keys(columnTranslations),
								).map((item, index) => (
									<tr key={index} className={s.Tr}>
										{Object.keys(columnTranslations).map((column) => (
											<td key={column} className={s.Td}>
												<p>{item[column]}</p>
											</td>
										))}
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
				<Line width="100%" className={s.Line} />

				<GraphicBlock
					StyledPickersLayout={StyledPickersLayout}
					ItemState={cliFinSubjects}
					OnChangeItem={(e) => setCliFinSubjects(e.target.value)}
					DateState={cliFinDate}
					OnChangeDate={(e) => {
						setCliFinDate(e.target.value)
						updateDateRange(
							e.target.value,
							setCliFinDateStart,
							setCliFinDateEnd,
						)
					}}
					DateStartState={cliFinDateStart}
					OnChangeDateStart={setCliFinDateStart}
					DateEndState={cliFinDateEnd}
					OnChangeDateEnd={setCliFinDateEnd}
					chooseGraphic={chooseGraphic}
					data={clientsFinanceData}
					options={options}
					optionsBar={optionsBar}
					title="Заказчики-Финансы"
					isClient
					renderCheckboxes={() =>
						renderSubjectCheckboxes(
							studLesSubjects,
							setStudLesSubjects,
							studentCountItemsData,
						)
					}
				/>
				<Line width="100%" className={s.Line} />

				<GraphicBlock
					StyledPickersLayout={StyledPickersLayout}
					ItemState={cliAmSubjects}
					OnChangeItem={(e) => setCliAmSubjects(e.target.value)}
					DateState={cliAmDate}
					OnChangeDate={(e) => {
						setCliAmDate(e.target.value)
						updateDateRange(e.target.value, setCliAmDateStart, setCliAmDateEnd)
					}}
					DateStartState={cliAmDateStart}
					OnChangeDateStart={setCliAmDateStart}
					DateEndState={cliAmDateEnd}
					OnChangeDateEnd={setCliAmDateEnd}
					chooseGraphic={chooseGraphic}
					data={clientsCountData}
					options={options}
					optionsBar={optionsBar}
					title="Заказчики-Количество"
					isClient
					renderCheckboxes={() =>
						renderSubjectCheckboxes(
							studLesSubjects,
							setStudLesSubjects,
							studentCountItemsData,
						)
					}
				/>
				<Line width="100%" className={s.Line} />

				<GraphicBlock
					StyledPickersLayout={StyledPickersLayout}
					ItemState={cliWorkSubjects}
					OnChangeItem={(e) => setCliWorkSubjects(e.target.value)}
					DateState={cliWorkDate}
					OnChangeDate={(e) => {
						setCliWorkDate(e.target.value)
						updateDateRange(
							e.target.value,
							setCliWorkDateStart,
							setCliWorkDateEnd,
						)
					}}
					DateStartState={cliWorkDateStart}
					OnChangeDateStart={setCliWorkDateStart}
					DateEndState={cliWorkDateEnd}
					OnChangeDateEnd={setCliWorkDateEnd}
					chooseGraphic={chooseGraphic}
					data={clientsWorksData}
					options={options}
					optionsBar={optionsBar}
					title="Заказчики-Работы"
					isClient
					renderCheckboxes={() =>
						renderSubjectCheckboxes(
							studLesSubjects,
							setStudLesSubjects,
							studentCountItemsData,
						)
					}
				/>
				<Line width="100%" className={s.Line} />

				{/* Clients Table */}
				<div className={s.GraphicBlock}>
					<div className={s.MenuForGraphic}>
						<p className={s.TitleTable}>Заказчики сводная таблица</p>
						<FormControl variant="standard" className={s.formControl}>
							<InputLabel id="date-select-label">Выберите период</InputLabel>
							<Select
								labelId="date-select-label"
								className={s.muiSelect}
								value={cliTableDateState}
								onChange={(e) => {
									setCliTableDateState(e.target.value)
									updateDateRange(
										e.target.value,
										setCliTableDateStart,
										setCliTableDateEnd,
									)
								}}
								defaultValue={0}>
								<MenuItem value={0}>За последние 30 дней</MenuItem>
								<MenuItem value={1}>С начала месяца</MenuItem>
								<MenuItem value={2}>С начала года</MenuItem>
								<MenuItem value={3}>За всё время</MenuItem>
							</Select>
						</FormControl>
						<Line width="260px" />
						<div className={s.Dates}>
							<div className={s.DatePicker}>
								<MiniCalendar
									value={cliTableDateStart}
									onChange={setCliTableDateStart}
									calendarId={'cliTable-left'}
								/>
							</div>
							<Line width="20px" className={s.LineDate} />
							<div className={s.DatePicker}>
								<MiniCalendar
									value={cliTableDateEnd}
									onChange={setCliTableDateEnd}
									calendarId={`cliTable-right`}
								/>
							</div>
						</div>
					</div>
					<div className={s.TableWrap}>
						<table className={s.Table}>
							<thead className={s.Thead}>
								<tr className={s.Tr}>
									{Object.keys(columnTranslations).map((column) => (
										<th
											key={column}
											onClick={() => handleSort(column)}
											className={s.Th}>
											{columnTranslations[column]}:{' '}
											{sortColumn === column && (
												<Arrow
													direction={sortDirection === 'asc' ? 'up' : 'down'}
												/>
											)}
										</th>
									))}
								</tr>
							</thead>
							<tbody className={s.Tbody}>
								{padTable(
									sortData(clientData, sortColumn, sortDirection),
									Object.keys(columnTranslations),
									10,
								).map((item, index) => (
									<tr key={index} className={s.Tr}>
										{Object.keys(columnTranslations).map((column) => (
											<td key={column} className={s.Td}>
												<p>{item[column]}</p>
											</td>
										))}
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
				<Line width="100%" className={s.Line} />

				<GraphicBlock
					StyledPickersLayout={StyledPickersLayout}
					ItemState={studRelatSubjects}
					OnChangeItem={(e) => setStudRelatSubjects(e.target.value)}
					DateState={studRelatDate}
					OnChangeDate={(e) => {
						setStudRelatDate(e.target.value)
						updateDateRange(
							e.target.value,
							setStudRelatDateStart,
							setStudRelatDateEnd,
						)
					}}
					DateStartState={studRelatDateStart}
					OnChangeDateStart={setStudRelatDateStart}
					DateEndState={studRelatDateEnd}
					OnChangeDateEnd={setStudRelatDateEnd}
					chooseGraphic={chooseGraphic}
					data={clientsNstudentsCompareData}
					options={options}
					optionsBar={optionsBar}
					title="Ученики - Заказчики сравнительный график"
					isClient
					renderCheckboxes={() =>
						renderComparisonCheckboxes(clientsNstudentsCompareData)
					}
				/>
			</div>
		</div>
	)
}

export default Statistics
