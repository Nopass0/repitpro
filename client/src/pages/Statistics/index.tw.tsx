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

import * as React from 'react'
import {addDays, format} from 'date-fns'
import {ru} from 'date-fns/locale'
import {Calendar as CalendarIcon} from 'lucide-react'
import {DateRange} from 'react-day-picker'
import {ScrollArea} from '@/ui/scroll-area'
import {Checkbox} from '@/ui/checkbox'

import {cn} from '@/lib/utils'
import {Button} from '@/ui/button'
import {Calendar} from '@/ui/calendar'
import {Switch} from '@/ui/switch'
import {Popover, PopoverContent, PopoverTrigger} from '@/ui/popover'
import {Badge} from '@/ui/badge'
import {Separator} from '@/ui/separator'
import {Upload} from '@mui/icons-material'
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

	return (
		<>
			<div className={s.wrapper}>
				{' '}
				{/* <div className="w-full flex flex-row float-right">
					<div className="">sas</div>
				</div> */}
				<Card className="h-[500px]">
					<CardHeader>
						<CardTitle>Ученики-Финансы</CardTitle>
						<CardDescription>График</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-row">
						<div className="flex flex-col mr-2 w-[230px]">
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
							<Separator className="my-4" />
							<ScrollArea className="h-72 w-48 rounded-md border flex flex-wrap ">
								<Badge variant="secondary" className="px-2 py-1 cursor-pointer">
									Предмет 1
								</Badge>
								<Badge variant="secondary" className="px-2 py-1 cursor-pointer">
									Предмет 1
								</Badge>{' '}
								<Badge variant="secondary" className="px-2 py-1 cursor-pointer">
									Предмет 1
								</Badge>{' '}
								<Badge variant="secondary" className="px-2 py-1 cursor-pointer">
									Предмет 1
								</Badge>{' '}
								<Badge variant="secondary" className="px-2 py-1 cursor-pointer">
									Предмет 1
								</Badge>
								{/* <div className="flex items-center mx-4 space-x-2 mt-2 mb-2">
									<Switch id="airplane-mode" />
									<label
										htmlFor="terms"
										className="text-md font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
										Предмет 1
									</label>
								</div>
								<div className="flex items-center mx-4 space-x-2 mb-2">
									<Switch id="airplane-mode" />
									<label
										htmlFor="terms"
										className="text-md font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
										Предмет 2
									</label>
								</div> */}
							</ScrollArea>
						</div>
						<ChartContainer
							className="h-[400px] w-auto md:w-[1100px]"
							config={chartConfig}>
							<LineChart
								compact
								className="h-[300px]"
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
