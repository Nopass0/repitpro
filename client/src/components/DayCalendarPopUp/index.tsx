import React, {useState, useEffect, useCallback, useMemo, useRef} from 'react'
import {motion, AnimatePresence} from 'framer-motion'
import {format, addDays, subDays} from 'date-fns'
import {ru} from 'date-fns/locale'
import {
  ChevronLeft,
  ChevronRight,
  X,
  Plus,
  Copy,
  Trash2,
  Home,
  Users,
  Video,
  PlusIcon,
} from 'lucide-react'
import {useDispatch, useSelector} from 'react-redux'
import {Button} from '@/ui/button'
import {ScrollArea} from '@/ui/scroll-area'
import {Separator} from '@/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/select'
import {Input} from '@/ui/input'
import {Checkbox} from '@/ui/checkbox'
import {cn} from '@/lib/utils'

// Import icons
import icon1 from '@/assets/1.svg'
import icon2 from '@/assets/2.svg'
import icon3 from '@/assets/3.svg'
import icon4 from '@/assets/4.svg'
import icon5 from '@/assets/5.svg'
import icon6 from '@/assets/6.svg'

import socket from '@/socket'
import {ECurrentDayPopUp, EPagePopUpExit, ELeftMenuPage} from '@/types'
import TimeRangePicker from '@/ui/time-range-picker-day'
import DayStudentPopUp from '../DayStudentPopUp'

const LESSON_TYPES = {
  HOME: '1',
  HOME_STUDENT: '2',
  GROUP: '3',
  ONLINE: '4',
  GROUP_ONLINE: '5',
}

interface LessonRowProps {
  lesson: {
    id: string
    type: string
    startTime: { hour: number; minute: number }
    endTime: { hour: number; minute: number }
    studentName: string
    subject: string
    price: number
    isCompleted: boolean
    isCancelled: boolean
    isTest: boolean
    isAutoChecked?: boolean
    studentId?: string
    groupId?: string
  }
  isEditing: boolean
  onToggleComplete: (id: string) => void
  onCancel: (id: string) => void
  onCopy: (lesson: any) => void
  onUpdate: (id: string, updates: any) => void
  onRowClick: (lesson: any) => void
  onIconClick: (lesson: any) => void
  hiddenNum: boolean
  token: string
  calendarDay: string
  calendarMonth: string
  calendarYear: string
}

const LessonRow: React.FC<LessonRowProps> = ({
  lesson,
  isEditing,
  onToggleComplete,
  onCancel,
  onCopy,
  onUpdate,
  onRowClick,
  onIconClick,
  hiddenNum,
  token,
  calendarDay,
  calendarMonth,
  calendarYear,
}) => {
  const [studentSuggestions, setStudentSuggestions] = useState([]);
  const [subjectSuggestions, setSubjectSuggestions] = useState([]);
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [timePickerPosition, setTimePickerPosition] = useState({ x: 0, y: 0 });
  const [localPrice, setLocalPrice] = useState(lesson.price?.toString() || "0");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setLocalPrice(lesson.price?.toString() || "0");
  }, [lesson.price]);

  useEffect(() => {
    if (isEditing) {
      // Load student suggestions
      socket.emit('getStudentSuggestions', { token });
      socket.once('getStudentSuggestions', (response) => {
        if (response.students) {
          setStudentSuggestions(response.students);
        }
      });

      // Load subject suggestions
      socket.emit('getSubjectSuggestions', { token });
      socket.once('getSubjectSuggestions', (response) => {
        if (response.subjects) {
          setSubjectSuggestions(response.subjects);
        }
      });
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isEditing, token]);

  const handleIconClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isEditing) {
      onIconClick(lesson);
    }
  };

  const handleTimeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isEditing) {
      const rect = e.currentTarget.getBoundingClientRect();
      setTimePickerPosition({
        x: rect.left,
        y: rect.bottom + window.scrollY + 5,
      });
      setTimePickerOpen(true);
    }
  };

  const handleTimeRangeSelect = useCallback(
    (ranges: { startTime: string; endTime: string }[]) => {
      if (ranges.length > 0) {
        const [selectedRange] = ranges;
        const [startHours, startMinutes] = selectedRange.startTime.split(':').map(Number);
        const [endHours, endMinutes] = selectedRange.endTime.split(':').map(Number);

        onUpdate(lesson.id, {
          startTime: { hour: startHours, minute: startMinutes },
          endTime: { hour: endHours, minute: endMinutes },
          action: 'updateTime',
          day: calendarDay,
          month: calendarMonth,
          year: calendarYear,
        });
        setTimePickerOpen(false);
      }
    },
    [lesson.id, onUpdate, calendarDay, calendarMonth, calendarYear],
  );

  const handlePriceChange = (value: string) => {
    // Allow only numbers and decimal point
    const cleanPrice = value.replace(/[^\d.]/g, '');
    setLocalPrice(cleanPrice);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      onUpdate(lesson.id, {
        lessonsPrice: cleanPrice,
        action: 'updatePrice'
      });
    }, 300);
  };

  const handleStudentChange = (studentId: string) => {
    const student = studentSuggestions.find(s => s.id === studentId);
    if (student) {
      onUpdate(lesson.id, {
        studentId: student.id,
        studentName: student.nameStudent,
        action: 'updateStudent'
      });
    }
  };

  const handleSubjectChange = (subject: string) => {
    onUpdate(lesson.id, {
      itemName: subject,
      action: 'updateSubject'
    });
  };

  const handleCompletionChange = () => {
    if (!lesson.isAutoChecked && !lesson.isCancelled) {
      onUpdate(lesson.id, {
        isChecked: !Boolean(lesson.isPaid),
        action: 'updateCompletion'
      });

      socket.emit('updateStudentSchedule', {
        id: lesson.id,
        isChecked: !Boolean(lesson.isPaid),
        action: 'updateCompletion',
        token,
        day: calendarDay,
        month: calendarMonth,
        year: calendarYear
      });
    }
  };

  return (
    <div
      className={cn(
        'relative border-x border-t p-3 transition-all bg-white min-h-[60px]',
        lesson.isCancelled && 'bg-red-50/50',
        lesson.isTest && 'border-green-500',
      )}
      onClick={() => !isEditing && onRowClick(lesson)}>
      {lesson.isCancelled && (
        <div className="absolute -rotate-12 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded border border-red-500 bg-red-500/10 px-3 py-1 z-10">
          <p className="text-sm font-medium text-red-500">Отменено</p>
        </div>
      )}

      {lesson.isTest && (
        <div className="absolute -rotate-12 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded border border-green-500 bg-green-500/10 px-3 py-1 z-10">
          <p className="text-sm font-medium text-green-500">Пробное</p>
        </div>
      )}

      <div className="grid grid-cols-[50px_120px_1.2fr_1.2fr_100px_50px_100px] gap-0 items-center min-h-[50px]">
        {/* Icon */}
        <div
          className="border-r h-full flex items-center justify-center"
          onClick={handleIconClick}>
          {isEditing ? (
            <Select
              value={lesson.type}
              onValueChange={(value) => onUpdate(lesson.id, { type: value, action: 'updateType' })}>
              <SelectTrigger className="w-[40px] h-[40px]">
                <img
                  src={getIconForType(lesson.type)}
                  alt={lesson.type}
                  className="h-7 w-7"
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={LESSON_TYPES.HOME}>
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    <span>Дома</span>
                  </div>
                </SelectItem>
                <SelectItem value={LESSON_TYPES.HOME_STUDENT}>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>У ученика</span>
                  </div>
                </SelectItem>
                <SelectItem value={LESSON_TYPES.GROUP}>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>Группа</span>
                  </div>
                </SelectItem>
                <SelectItem value={LESSON_TYPES.ONLINE}>
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    <span>Онлайн</span>
                  </div>
                </SelectItem>
                <SelectItem value={LESSON_TYPES.GROUP_ONLINE}>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <Video className="h-4 w-4 ml-1" />
                    <span>Группа онлайн</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <img
              src={getIconForType(lesson.type)}
              alt={lesson.type}
              className="h-7 w-7"
            />
          )}
        </div>

        {/* Time */}
        <div className="border-r h-full flex items-center justify-center px-2">
          {isEditing ? (
            <div
              onClick={handleTimeClick}
              className="px-2 py-1.5 border rounded cursor-pointer hover:border-green-500 hover:bg-green-50/50 text-center w-full">
              <span className="text-base whitespace-nowrap">
                {formatTime(lesson.startTime)} - {formatTime(lesson.endTime)}
              </span>
            </div>
          ) : (
            <div className="text-base cursor-pointer text-center w-full whitespace-nowrap">
              {formatTime(lesson.startTime)} - {formatTime(lesson.endTime)}
            </div>
          )}
        </div>

        {/* Student Name */}
        <div className="border-r h-full flex items-center px-3">
          {isEditing ? (
            <Select
              value={lesson.studentId || ''}
              onValueChange={handleStudentChange}>
              <SelectTrigger>
                <SelectValue>{lesson.studentName}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {studentSuggestions.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.nameStudent}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="font-medium cursor-pointer truncate w-full text-base text-center">
              {lesson.studentName}

            </div>
          )}
        </div>

        {/* Subject */}
        <div className="border-r h-full flex items-center px-3">
          {isEditing ? (
            <Select
              value={lesson.subject}
              onValueChange={handleSubjectChange}>
              <SelectTrigger>
                <SelectValue>{lesson.subject}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {subjectSuggestions.map((subject) => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="text-gray-600 truncate w-full text-base text-center">
              {lesson.subject}
                { lesson.isPaid}
            </div>
          )}
        </div>

        {/* Price */}
        <div className="border-r h-full flex items-center justify-center px-3">
          {isEditing ? (
            <Input
              type="text"
              value={localPrice}
              onChange={(e) => handlePriceChange(e.target.value)}
              onBlur={() => {
                const formatted = parseFloat(localPrice).toFixed(2);
                if (!isNaN(formatted as any)) {
                  handlePriceChange(formatted);
                }
              }}
              className="h-9 text-base cursor-text w-full text-center"
              disabled={hiddenNum}
            />
          ) : (
            <div className="text-center w-full text-base">
              {!hiddenNum && <span>{lesson.price}₽</span>}
            </div>
          )}
        </div>

        {/* Checkbox */}
        <div className="border-r h-full  rounded-md flex items-center justify-center">
          <input
          type="checkbox"
            checked={Boolean(lesson.isPaid)}
            onClick={handleCompletionChange}
            disabled={lesson.isAutoChecked || lesson.isCancelled}
            className={cn(
              "h-5 w-5",
              lesson.isAutoChecked && "bg-white border-gray-100 opacity-100 cursor-not-allowed",

            )}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-1 h-full">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation()
              onCopy(lesson)
            }}
            className="h-10 w-10">
            <PlusIcon className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation()
              onCancel(lesson.id)
            }}
            className="text-red-500 hover:text-red-600 h-10 w-10">
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {timePickerOpen && (
        <TimeRangePicker
          singleRange={true}
          onTimeRangeSelect={handleTimeRangeSelect}
          onClose={() => setTimePickerOpen(false)}
          position={timePickerPosition}
          existingRanges={[
            {
              startTime: formatTime(lesson.startTime),
              endTime: formatTime(lesson.endTime),
            },
          ]}
        />
      )}
    </div>
  );
};

// Helper functions
const formatTime = (time: { hour: number; minute: number }) => {
  return `${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}`
}

const getIconForType = (type: string) => {
  switch (type) {
    case LESSON_TYPES.HOME:
      return icon1
    case LESSON_TYPES.HOME_STUDENT:
      return icon2
    case LESSON_TYPES.GROUP:
      return icon3
    case LESSON_TYPES.ONLINE:
      return icon4
    default:
      return icon5
  }
}

interface IDayCalendarPopUp {
  style?: React.CSSProperties
  onExit?: () => void
  iconClick?: () => void
  LineClick?: () => void
  className?: string
}

const ClientRow = ({ client, isEditing, onRowClick, hiddenNum }) => {
  return (
    <div
      className="border rounded-lg p-2 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
      onClick={() => !isEditing && onRowClick(client)}>
      <div className="flex items-center gap-4">
        <img src={icon6} alt="Client" className="h-10 w-10" />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium">{client.studentName}</h3>
            {!hiddenNum && <p className="font-medium">{client.workPrice}₽</p>}
          </div>
          <div className="text-sm text-gray-600">{client.itemName}</div>

          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm">Заказ принят</span>
                <Checkbox
                  checked={client.workStages[0].firstPaymentPayed}
                  disabled={isEditing}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">Оплачено</span>
                <Checkbox
                  checked={client.workStages[0].endPaymentPayed}
                  disabled={isEditing}
                />
              </div>
            </div>
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-100">
              <span className="text-sm font-medium">
                {Math.round((client.workPrice / client.totalWorkPrice) * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const DayCalendarPopUp: React.FC<IDayCalendarPopUp> = ({
  style,
  onExit,
  className,
}) => {
  const dispatch = useDispatch()
  const mountedRef = useRef(false)
  const retryCountRef = useRef(0)

  // State
  const [isVisible, setIsVisible] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [students, setStudents] = useState([])
  const [clients, setClients] = useState([])
  const [tempStudents, setTempStudents] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editingNewLesson, setEditingNewLesson] = useState(null)
  const [pagePopup, setPagePopup] = useState(EPagePopUpExit.None)
  const [currentDayPopUp, setCurrentDayPopUp] = useState(ECurrentDayPopUp.None)

  // Redux state
  const user = useSelector((state: any) => state.user)
  const token = user?.token
  const calendarNowPopupDay = useSelector(
    (state: any) => state.calendarNowPopupDay,
  )
  const calendarNowPopupMonth = useSelector(
    (state: any) => state.calendarNowPopupMonth,
  )
  const calendarNowPopupYear = useSelector(
    (state: any) => state.calendarNowPopupYear,
  )
  const hiddenNum = useSelector((state: any) => state.hiddenNum)
  const dayPopUpExit = useSelector((state: any) => state.dayPopUpExit)
  const currentOpenedStudent = useSelector(
    (state: any) => state.currentOpenedStudent,
  )

  // Statistics
  const statistics = useMemo(() => {
    const activeStudents = students.filter((student) => !student.isCancel)
    return {
      lessonsCount: activeStudents.length,
      lessonsTotal: activeStudents.reduce(
        (sum, student) => sum + Number(student.costOneLesson || 0),
        0,
      ),
      worksCount: clients?.length || 0,
      worksTotal:
        clients?.reduce(
          (sum, client) => sum + Number(client.workPrice || 0),
          0,
        ) || 0,
    }
  }, [students, clients])

  // Data fetching
  const fetchData = useCallback(() => {
    console.log('Fetching data...')
    setIsLoading(true)
    setError(null)

    const params = {
      day: calendarNowPopupDay,
      month: calendarNowPopupMonth,
      year: calendarNowPopupYear,
      token,
    }

    socket.emit('getStudentsByDate', params)
    socket.emit('getClientsByDate', params)
  }, [calendarNowPopupDay, calendarNowPopupMonth, calendarNowPopupYear, token])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  // Socket event handlers
  useEffect(() => {
    const handleStudentsData = (data) => {
      if (mountedRef.current) {
        // Normalize data before setting
        const normalizedData = data.map((student) => ({
          ...student,
          isCancel: Boolean(student.isCancel),
          costOneLesson: student.costOneLesson || '0',
          tryLessonCheck: Boolean(student.tryLessonCheck),
        }))
        setStudents(normalizedData)
        setIsLoading(false)
      }
    }

    const handleClientsData = (data) => {
      if (mountedRef.current) {
        setClients(data || [])
        setIsLoading(false)
      }
    }

    socket.on('getStudentsByDate', handleStudentsData)
    socket.on('getClientsByDate', handleClientsData)

    fetchData()

    return () => {
      socket.off('getStudentsByDate', handleStudentsData)
      socket.off('getClientsByDate', handleClientsData)
    }
  }, [calendarNowPopupDay, calendarNowPopupMonth, calendarNowPopupYear, token])

  // Navigation handlers
  const handleNavigateDay = (direction) => {
    const currentDate = new Date(
      calendarNowPopupYear,
      calendarNowPopupMonth - 1,
      calendarNowPopupDay,
    )
    const newDate =
      direction === 'next' ? addDays(currentDate, 1) : subDays(currentDate, 1)

    const newDay = String(newDate.getDate())
    const newMonth = String(newDate.getMonth() + 1).padStart(2, '0')
    const newYear = String(newDate.getFullYear())

    dispatch({
      type: 'SET_CALENDAR_NOW_POPUP',
      payload: { day: newDay, month: newMonth, year: newYear },
    })
    fetchData()
  }

  // Lesson handlers
  const handleLessonComplete = useCallback((lessonId) => {
    setStudents((prevStudents) => {
      return prevStudents.map((student) =>
        student.id === lessonId
          ? { ...student, tryLessonCheck: !student.tryLessonCheck }
          : student,
      )
    })
  }, [])

  const handleLessonCancel = useCallback(
    (lessonId) => {
      setPagePopup(EPagePopUpExit.Cancel)
      socket.emit('cancelLesson', { id: lessonId, token })

      setStudents((prevStudents) =>
        prevStudents.map((student) =>
          student.id === lessonId ? { ...student, isCancel: true } : student,
        ),
      )
    },
    [token],
  )

  const handleLessonCopy = useCallback(
    (lesson) => {
      socket.emit('createStudentSchedule', {
        token,
        day: calendarNowPopupDay,
        month: calendarNowPopupMonth,
        year: calendarNowPopupYear,
        studentId: lesson.studentId,
        itemName: lesson.itemName,
        lessonsPrice: lesson.costOneLesson,
        studentName: lesson.nameStudent,
        copyBy: lesson.id,
      })
    },
    [calendarNowPopupDay, calendarNowPopupMonth, calendarNowPopupYear, token],
  )

  const handleLessonUpdate = useCallback(
    (lessonId, updates) => {
      // Обновляем локальное состояние
      setStudents((prevStudents) =>
        prevStudents.map((student) => {
          if (student.id === lessonId) {
            const updatedStudent = { ...student }
            Object.assign(updatedStudent, updates)
            return updatedStudent
          }
          return student
        }),
      )

      // Отправляем обновления на сервер
      socket.emit('updateStudentSchedule', {
        id: lessonId,
        ...updates,
        day: calendarNowPopupDay,
        month: calendarNowPopupMonth,
        year: calendarNowPopupYear,
        token,
      })

      dispatch({ type: 'SET_UPDATE_CARD', payload: true })
    },
    [calendarNowPopupDay, calendarNowPopupMonth, calendarNowPopupYear, token],
  )

  // Row click handler to open DayStudentPopUp
  const handleRowClick = (lesson) => {
    if (!editMode) {
      setIsVisible(false)
      dispatch({
        type: 'SET_CURRENT_OPENED_STUDENT',
        payload: lesson.studentId,
      })

      dispatch({ type: 'SET_CURRENT_SCHEDULE_DAY', payload: lesson.id })
      setCurrentDayPopUp(ECurrentDayPopUp.Student)
    }
  }

  // Icon click handler to open student/group card
  const handleIconClick = (lesson) => {
    if (!editMode) {
      if (lesson.type === 'group') {
        socket.emit('getGroupById', { token, groupId: lesson.groupId })
        dispatch({ type: 'SET_CURRENT_OPENED_GROUP', payload: lesson.groupId })
        dispatch({ type: 'SET_LEFT_MENU_PAGE', payload: ELeftMenuPage.AddGroup })
      } else {
        socket.emit('getGroupByStudentId', { token, studentId: lesson.studentId })
        dispatch({
          type: 'SET_CURRENT_OPENED_STUDENT',
          payload: lesson.studentId,
        })
        dispatch({
          type: 'SET_LEFT_MENU_PAGE',
          payload: ELeftMenuPage.AddStudent,
        })
      }
    }
  }

  // Client handlers
  const handleOpenClientCard = (clientId) => {
    socket.emit('getClientById', { token, clientId })
    dispatch({ type: 'SET_CURRENT_OPENED_CLIENT', payload: clientId })
    dispatch({ type: 'SET_LEFT_MENU_PAGE', payload: ELeftMenuPage.AddClient })
  }

  // Save & Exit handlers
  const handleSave = async () => {
    const filledTempStudents = tempStudents.filter(
      (s) =>
        s.nameStudent &&
        s.itemName &&
        (s.startTime.hour !== 0 || s.startTime.minute !== 0),
    )

    try {
      const studentsToSave = [...students, ...filledTempStudents]
      await Promise.all(
        studentsToSave.map(
          (student) =>
            new Promise((resolve, reject) => {
              socket.emit('updateStudentSchedule', {
                id: student.id,
                day: calendarNowPopupDay,
                month: calendarNowPopupMonth,
                year: calendarNowPopupYear,
                lessonsPrice: student.costOneLesson || 0,
                studentName: student.nameStudent,
                itemName: student.itemName,
                typeLesson: student.typeLesson,
                startTime: student.startTime,
                endTime: student.endTime,
                isChecked: student.tryLessonCheck,
                isCancel: student.isCancel,
                token,
              })

              socket.once(`updateStudentSchedule_${student.id}`, (response) => {
                if (response.success) {
                  socket.emit('getAllStudentSchedules', {
                    studentId: currentOpenedStudent,
                    token: token,
                  })
                  resolve(response)
                } else reject(new Error('Failed to update student schedule'))
              })

              setTimeout(() => reject(new Error('Update timeout')), 5000)
            }),
        ),
      )

      setTempStudents([])
      setEditMode(false)
      dispatch({ type: 'SET_IS_EDIT_DAY_POPUP', payload: false })
      fetchData()
    } catch (error) {
      console.error('Error saving changes:', error)
    }
  }

  const handleClose = () => {
    if (editMode) {
      setPagePopup(EPagePopUpExit.Exit)
    } else {
      onExit?.()
    }
  }

  // Add new lesson
  const handleAddNewLesson = () => {
    const newLesson = {
      id: crypto.randomUUID(),
      type: LESSON_TYPES.HOME,
      startTime: { hour: 9, minute: 0 },
      endTime: { hour: 10, minute: 0 },
      studentName: '',
      subject: '',
      price: 0,
      isCompleted: false,
      isCancelled: false,
      isTest: false,
    }
    setEditingNewLesson(newLesson)
  }
  const totalGridLines = 8; // Можно настроить желаемое количество линий
   const emptyGridLines = Array(totalGridLines).fill(null);

  return (
    <AnimatePresence>
      <>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-[80px] left-[-400px]  -translate-x-1/2 -translate-y-1/2  w-[700px] bg-white rounded-xl shadow-2xl overflow-hidden"
            >
            {/* Header */}
            <div className="p-4 border-b bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleNavigateDay('prev')}
                    disabled={editMode}
                    className="h-9 w-9">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <h2 className="text-lg font-medium">
                                      {format(
                                        new Date(
                                          calendarNowPopupYear,
                                          calendarNowPopupMonth - 1,
                                          calendarNowPopupDay,
                                        ),
                                        'd MMMM yyyy',
                                        {locale: ru},
                                      )}
                                    </h2>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleNavigateDay('next')}
                                      disabled={editMode}
                                      className="h-9 w-9">
                                      <ChevronRight className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleClose}
                                    className="h-9 w-9">
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>

                              {/* Content */}
                              <div className="flex flex-col h-[500px]">
                                <ScrollArea className="flex-1 p-6">
                                  <div className="space-y-2">
                                    {isLoading ? (
                                      <div className="flex items-center justify-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                                      </div>
                                    ) : error ? (
                                      <div className="text-red-500 p-4">{error}</div>
                                    ) : (
                                      <>
                                        {/* Clients */}
                                        {clients?.map((client) => (
                                          <ClientRow
                                            key={client.id}
                                            client={client}
                                            isEditing={editMode}
                                            onRowClick={() => handleOpenClientCard(client.id)}
                                            hiddenNum={hiddenNum}
                                          />
                                        ))}

                                        {clients?.length > 0 && <Separator className="my-4" />}

                                        {/* Regular Lessons */}
                                        {students.map((lesson, index) => (
                                          <React.Fragment key={lesson.id}>
                                            <LessonRow
                                              lesson={{
                                                ...lesson,
                                                startTime: lesson.startTime,
                                                endTime: lesson.endTime,
                                                studentName: lesson.nameStudent,
                                                subject: lesson.itemName,
                                                price: lesson.costOneLesson,
                                                isCompleted: lesson.tryLessonCheck,
                                                isCancelled: lesson.isCancel,
                                                isTest: lesson.isTrial,
                                                isAutoChecked: lesson.isAutoChecked,
                                                studentId: lesson.studentId,
                                                groupId: lesson.groupId,
                                                type: lesson.type,
                                              }}
                                              isEditing={editMode}
                                              onToggleComplete={handleLessonComplete}
                                              onCancel={handleLessonCancel}
                                              onCopy={handleLessonCopy}
                                              onUpdate={handleLessonUpdate}
                                              onRowClick={handleRowClick}
                                              onIconClick={handleIconClick}
                                              hiddenNum={hiddenNum}
                                              token={token}
                                              calendarDay={calendarNowPopupDay}
                                              calendarMonth={calendarNowPopupMonth}
                                              calendarYear={calendarNowPopupYear}
                                            />
                                            {index < students.length - 1 && <Separator className="my-2" />}
                                          </React.Fragment>
                                        ))}

                                        {/* Grid Lines to always have at least 6 lines */}
                                        {students.length < 6 && !editingNewLesson ? (
                                          Array.from({ length: 6 - students.length }).map((_, index) => (
                                            <React.Fragment key={`grid-${index}`}>
                                              <Separator className="my-2" />
                                             <div className={`h-14 ${index === 0 ? 'mt-0' : 'mt-2'}`} />  {/* Spacing to match lesson row height with reduced top margin */}
                                            </React.Fragment>
                                          ))
                                        ) : null}

                                        {/* New Lesson Form */}
                                        {editingNewLesson && (
                                          <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}>
                                            <Separator className="my-2" />
                                            <LessonRow
                                              lesson={editingNewLesson}
                                              isEditing={true}
                                              onToggleComplete={() => {}}
                                              onCancel={() => setEditingNewLesson(null)}
                                              onCopy={() => {}}
                                              onUpdate={(_, updates) =>
                                                setEditingNewLesson((prev) => ({ ...prev, ...updates }))
                                              }
                                              onRowClick={() => {}}
                                              onIconClick={() => {}}
                                              hiddenNum={hiddenNum}
                                              token={token}
                                              calendarDay={calendarNowPopupDay}
                                              calendarMonth={calendarNowPopupMonth}
                                              calendarYear={calendarNowPopupYear}
                                            />
                                          </motion.div>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </ScrollArea>

                                {/* Footer */}
                                <div className="p-4 border-t bg-green-100">
                                  <div className="flex justify-between items-center">
                                    <div className="flex gap-3">
                                      <Button
                                        size="lg"
                                        variant={editMode ? 'outline' : 'default'}
                                        className="text-[15px]"
                                        onClick={() => (editMode ? handleSave() : setEditMode(true))}>
                                        {editMode ? 'Сохранить' : 'Редактировать'}
                                      </Button>
                                      {editMode && (
                                        <Button
                                          variant="ghost"
                                          size="lg"
                                          className="text-[15px]"
                                          onClick={() => {
                                            setEditMode(false)
                                            fetchData()
                                          }}>
                                          Отмена
                                        </Button>
                                      )}
                                      <Button
                                        size="lg"
                                        variant={editMode ? 'outline' : 'default'}
                                        className="text-[15px] flex items-center gap-1"
                                        onClick={handleAddNewLesson}>
                                        <Plus className="h-4 w-4" />
                                        Добавить занятие
                                      </Button>
                                    </div>

                                    <div className="text-[15px] space-y-1.5">
                                      <div className="flex justify-between gap-8">
                                        <span>
                                          Занятий: <b>{statistics.lessonsCount}</b>
                                        </span>
                                        {!hiddenNum && <b>{statistics.lessonsTotal}₽</b>}
                                      </div>
                                      <div className="flex justify-between gap-8">
                                        <span>
                                          Работ: <b>{statistics.worksCount}</b>
                                        </span>
                                        {!hiddenNum && <b>{statistics.worksTotal}₽</b>}
                                      </div>
                                      <Separator className="my-1.5" />
                                      <div className="flex justify-between gap-8 font-medium">
                                        <span>ИТОГО</span>
                                        {!hiddenNum && (
                                          <span>
                                            {statistics.lessonsTotal + statistics.worksTotal}₽
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}

                          {/* DayStudentPopUp */}
                          {currentDayPopUp === ECurrentDayPopUp.Student && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}>
                              <DayStudentPopUp
                                onExit={() => {
                                  setCurrentDayPopUp(ECurrentDayPopUp.None)
                                  setIsVisible(true)
                                }}
                              />
                            </motion.div>
                          )}

                          {/* Confirmation Dialogs */}
                          {pagePopup === EPagePopUpExit.Exit && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                              <motion.div
                                initial={{ scale: 0.95 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0.95 }}
                                className="bg-white rounded-lg p-6 w-[400px]">
                                <h3 className="text-lg font-medium mb-4">Сохранить изменения?</h3>
                                <div className="flex justify-end gap-3">
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setEditMode(false)
                                      setPagePopup(EPagePopUpExit.None)
                                      onExit?.()
                                    }}>
                                    Не сохранять
                                  </Button>
                                  <Button
                                    onClick={async () => {
                                      await handleSave()
                                      setPagePopup(EPagePopUpExit.None)
                                      onExit?.()
                                    }}>
                                    Сохранить
                                  </Button>
                                </div>
                              </motion.div>
                            </motion.div>
                          )}

                          {pagePopup === EPagePopUpExit.Cancel && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                              <motion.div
                                initial={{ scale: 0.95 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0.95 }}
                                className="bg-white rounded-lg p-6 w-[400px]">
                                <h3 className="text-lg font-medium mb-4">
                                  Вы действительно хотите отменить занятие?
                                </h3>
                                <div className="flex justify-end gap-3">
                                  <Button
                                    variant="outline"
                                    onClick={() => setPagePopup(EPagePopUpExit.None)}>
                                    Нет
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={() => {
                                      const lessonToCancel = students.find((s) => s.isCancel)
                                      if (lessonToCancel) {
                                        handleLessonCancel(lessonToCancel.id)
                                      }
                                      setPagePopup(EPagePopUpExit.None)
                                    }}>
                                    Да, отменить
                                  </Button>
                                </div>
                              </motion.div>
                            </motion.div>
                          )}
                        </>
                      </AnimatePresence>
                    )
                  }

                  export default DayCalendarPopUp
