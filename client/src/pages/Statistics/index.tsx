import s from './index.module.scss'
import ShowChartIcon from '@mui/icons-material/ShowChart'
import BarChartIcon from '@mui/icons-material/BarChart'
import CloseIcon from '@mui/icons-material/Close'

import {TrendingUp} from 'lucide-react'
import {CartesianGrid, Line, LineChart, XAxis, YAxis} from 'recharts'

import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/ui/card'
import {
	ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from '@/ui/chart'
import Checkbox from '@/components/CheckBox'

import * as React from 'react'
import {addDays, format} from 'date-fns'
import {ru} from 'date-fns/locale'
import {Calendar as CalendarIcon} from 'lucide-react'
import {DateRange} from 'react-day-picker'
import {ScrollArea} from '@/ui/scroll-area'

import {Label} from '@/ui/label'
import {cn} from '@/lib/utils'
import {Button} from '@/ui/button'
import {Calendar} from '@/ui/calendar'
import {Switch} from '@/ui/switch'
import {Popover, PopoverContent, PopoverTrigger} from '@/ui/popover'
import {Badge} from '@/ui/badge'
import {Separator} from '@/ui/separator'
import {Upload} from '@mui/icons-material'
import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from '@/ui/table'

import Uploader from '@/components/Uploader'

const chartData = [
	{month: 'Январь', desktop: 186, mobile: 80},
	{month: 'Февраль', desktop: 305, mobile: 200},
	{month: 'Март', desktop: 237, mobile: 120},
	{month: 'Апрель', desktop: 73, mobile: 190},
	{month: 'Май', desktop: 209, mobile: 130},
	{month: 'Июнь', desktop: 214, mobile: 140},
]

const chartConfig = {
	desktop: {
		label: 'Desktop',
		color: 'hsl(var(--chart-1))',
	},
	mobile: {
		label: 'Mobile',
		color: 'hsl(var(--chart-2))',
	},
} satisfies ChartConfig

const Statistics = () => {
	const [date, setDate] = React.useState<DateRange | undefined>({
		from: new Date(2022, 0, 20),
		to: addDays(new Date(2022, 0, 20), 20),
	})

	const [items, setItems] = React.useState<
		{
			name: string
			isChecked: boolean
			amount: number
			percent: number
			color: string
		}[]
	>([
		{
			name: 'Предмет 1',
			isChecked: true,
			amount: 100,
			percent: 10,
			color: 'hsl(var(--chart-1))',
		},
		{
			name: 'Предмет 2',
			isChecked: true,
			amount: 100,
			percent: 10,
			color: 'hsl(var(--chart-2))',
		},
		{
			name: 'Предмет 3',
			isChecked: true,
			amount: 100,
			percent: 10,
			color: 'hsl(var(--chart-1))',
		},
		{
			name: 'Предмет 4',
			isChecked: true,
			amount: 100,
			percent: 10,
			color: 'hsl(var(--chart-2))',
		},
		{
			name: 'Предмет 5',
			isChecked: true,
			amount: 100,
			percent: 10,
			color: 'hsl(var(--chart-1))',
		},
		{
			name: 'Предмет 6',
			isChecked: true,
			amount: 100,
			percent: 10,
			color: 'hsl(var(--chart-2))',
		},
		{
			name: 'Предмет 7',
			isChecked: true,
			amount: 100,
			percent: 10,
			color: 'hsl(var(--chart-1))',
		},
	])

	return (
		<>
			<div className={s.wrapper}>
				{' '}
				{/* <div className="w-full flex flex-row float-right">
					<div className="">sas</div>
				</div> */}
				<Card className="h-[500px] w-full">
					<CardHeader>
						<CardTitle>Ученики-Финансы</CardTitle>
						<CardDescription>График</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-row">
						<div className="flex flex-col mr-2 w-auto">
							<div className={cn('grid gap-2', '')}>
								<Popover>
									<PopoverTrigger asChild>
										<Button
											id="date"
											variant={'outline'}
											size={'sm'}
											className={cn(
												'w-[230px] justify-start border border-[#000] text-left font-normal',
												!date && 'text-muted-foreground',
											)}>
											<CalendarIcon className="mr-2 h-4 w-4" />
											{date?.from ? (
												date.to ? (
													<>
														{format(date.from, 'LLL dd, y', {locale: ru})} -{' '}
														{format(date.to, 'LLL dd, y', {locale: ru})}
													</>
												) : (
													format(date.from, 'LLL dd, y', {locale: ru})
												)
											) : (
												<span>Выберите период</span>
											)}
										</Button>
									</PopoverTrigger>
									<PopoverContent className="w-auto p-0" align="start">
										<Calendar
											initialFocus
											mode="range"
											defaultMonth={date?.from}
											selected={date}
											onSelect={setDate}
											numberOfMonths={2}
											ISOWeek={true}
											locale={ru}
											formatters={{
												formatWeekdayName: (day) => (
													//if сб, вс - красный цвет. day - Date
													<p
														className={`${cn('text-sm', day.getDay() === 6 || day.getDay() === 0 ? 'text-red-500' : '')}`}>
														{format(day, 'eeeeee', {locale: ru})}
													</p>
												),
												formatDay: (day) => (
													<p
														className={`${cn('text-sm', day.getDay() === 6 || day.getDay() === 0 ? 'text-red-500' : '')}`}>
														{format(day, 'd', {locale: ru})}
													</p>
												),
											}}
										/>
									</PopoverContent>
								</Popover>
							</div>
							<Separator className="my-4 " />

							<ScrollArea className="h-72 rounded-md border flex flex-col ">
								<Table className="min-w-56 h-72">
									<TableHeader>
										<TableRow>
											<TableHead></TableHead>
											<TableHead>Рубли</TableHead>
											<TableHead>%</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{items.map((item) => (
											<TableRow key={item.id}>
												<TableCell>
													<div className="flex items-center space-x-2">
														<Checkbox size="16px" color={item.color} />
														<Label htmlFor="terms">{item.name}</Label>
													</div>
												</TableCell>
												<TableCell className="text-right">
													{item.amount}
												</TableCell>
												<TableCell className="text-right">
													{item.percent}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</ScrollArea>
						</div>
						<ChartContainer
							className="h-[300px] w-auto md:w-[1000px]"
							config={chartConfig}>
							<LineChart
								compact
								className="h-[300px] "
								accessibilityLayer
								data={chartData}
								margin={{
									left: 12,
									right: 12,
								}}>
								<CartesianGrid vertical={false} />
								<XAxis
									dataKey="month"
									tickLine={false}
									axisLine={true}
									tickMargin={8}
									tickFormatter={(value) => value.slice(0, 3)}
								/>
								<YAxis
									dataKey="desktop"
									name="Десктоп"
									axisLine={true}
									tickLine={true}
									tickMargin={8}
									tickFormatter={(value) => `${value} руб.`}
								/>
								<ChartTooltip
									cursor={false}
									content={<ChartTooltipContent />}
								/>
								<Line
									dataKey="desktop"
									type="monotone"
									stroke="var(--color-desktop)"
									strokeWidth={2}
									dot={false}
								/>
								<Line
									dataKey="mobile"
									type="monotone"
									stroke="var(--color-mobile)"
									strokeWidth={2}
									dot={false}
								/>
							</LineChart>
						</ChartContainer>
					</CardContent>
				</Card>
				<div className="w-[600px] h-[200px] flex justify-center items-center"></div>
				<Uploader />
			</div>
		</>
	)
}

export default Statistics
