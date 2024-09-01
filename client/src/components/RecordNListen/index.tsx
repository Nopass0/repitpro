import React, {useEffect, useState} from 'react'
import s from './index.module.scss'
import microSVG from '../../assets/Microphone1.svg'
import Listen from '../../assets/Listen.svg'
import {Option, Select, SelectOption} from '@mui/base'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import Line from '../Line'
import socket from '../../socket'
import {useSelector} from 'react-redux'

interface IRecordNListen {
	className?: string
	typeCard: string
	alreadyRecorded?: {
		file: File
		name: string
		type: string
		size: number
	}[]
	callback?: (file: File, name: string, type: string, size: number) => void
}

const RecordNListen: React.FC<IRecordNListen> = ({
	className,
	alreadyRecorded = [],
	callback,
	typeCard,
}) => {
	const [isRecording, setIsRecording] = useState<boolean>(false)
	const [audioChunks, setAudioChunks] = useState([])
	const [audioBlob, setAudioBlob] = useState(null)
	const [isPlaying, setIsPlaying] = useState<boolean>(false)
	const [recordedAudios, setRecordedAudios] = useState(alreadyRecorded)
	const [showAudioList, setShowAudioList] = useState<boolean>(false)
	const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
	useEffect(() => {
		setRecordedAudios(alreadyRecorded)
	}, [alreadyRecorded])

	const user = useSelector((state: any) => state.user)
	const token = user.token

	const getFileLinkById = (id: string) => {
		// !TODO: Remake after deploy on server with domain
		const baseLinkToThisSite = window.location.origin

		return `${baseLinkToThisSite}/files/${id}`
	}

	const startRecording = async () => {
		try {
			if (mediaRecorder) {
				mediaRecorder.stream.getTracks().forEach((track) => track.stop())
				setMediaRecorder(null)
			}

			const stream = await navigator.mediaDevices.getUserMedia({audio: true})
			if (stream) {
				const newMediaRecorder = new MediaRecorder(stream)
				setMediaRecorder(newMediaRecorder)
				setAudioBlob(null) // Сбрасываем audioBlob перед началом новой записи
				newMediaRecorder.addEventListener('dataavailable', (event) => {
					setAudioChunks((prev) => [...prev, event.data])
				})
				newMediaRecorder.addEventListener('stop', () => {
					const audioBlob = new Blob(audioChunks, {
						type: 'audio/ogg; codecs=opus',
					})
					setAudioBlob(audioBlob)
					setAudioChunks([])
				})
				newMediaRecorder.start()
				setIsRecording(true)
				console.log('Recording started')
			} else {
				console.error('Не удалось получить доступ к микрофону')
			}
		} catch (error) {
			console.error('Ошибка доступа к микрофону:', error)
		}
	}

	const sendDelete = (id: string) => {
		socket.emit('deleteAudio', {
			token,
			id,
			type: typeCard,
		})
		setRecordedAudios((prev) =>
			prev.filter((audio) => {
				return audio.id !== id
			}),
		)
	}

	const stopRecording = () => {
		setIsRecording(false)
		if (mediaRecorder && mediaRecorder.state === 'recording') {
			console.log('stopping recording')
			mediaRecorder.stop()
			mediaRecorder.ondataavailable = (event) => {
				if (event.data && event.data.size > 0) {
					const audioBlob = new Blob([event.data], {type: 'audio/ogg'})
					const timestamp = new Date().toISOString().replace(/[-:\\.]/g, '')
					const now = new Date()
					const fileName = `${now.getFullYear()}-${`0${
						now.getMonth() + 1
					}`.slice(-2)}-${`0${now.getDate()}`.slice(
						-2,
					)}_${`0${now.getHours()}`.slice(-2)}-${`0${now.getMinutes()}`.slice(
						-2,
					)}-${`0${now.getSeconds()}`.slice(-2)}`
					const audioFile = new File([audioBlob], fileName, {type: 'audio/ogg'})
					const newAudio = {
						file: audioFile,
						name: fileName,
						size: audioBlob.size,
						type: 'audio/ogg',
					}
					setRecordedAudios((prevAudios) => [...prevAudios, newAudio])
					setAudioBlob(null)
					console.log('Recording stopped')
					if (callback) {
						callback(audioFile, newAudio.name, newAudio.type, newAudio.size)
					}
				}
			}
		}
	}

	const playAudio = (audioFile: File) => {
		const audioURL = URL.createObjectURL(audioFile)
		const audio = new Audio(audioURL)
		audio.play()
		setIsPlaying(true)
		audio.addEventListener('ended', () => {
			setIsPlaying(false)
			URL.revokeObjectURL(audioURL)
		})
	}

	const playRecordedAudio = (id: string) => {
		const audioURL = getFileLinkById(id)
		console.log('audioURL', audioURL)
		const audio = new Audio(audioURL)
		audio.play()
		setIsPlaying(true)
		audio.addEventListener('ended', () => {
			setIsPlaying(false)
			URL.revokeObjectURL(audioURL)
		})
	}

	const handleRecordButtonClick = () => {
		if (isRecording) {
			stopRecording()
		} else {
			startRecording()
		}
	}

	const handleListenButtonClick = () => {
		setShowAudioList(!showAudioList)
	}
	// const sendDelete = (id: string) => {
	// 	socket.emit('deleteAudio', {
	// 		token,
	// 		id,
	// 		type: typeCard,
	// 	})
	// }
	useEffect(() => {
		return () => {
			if (mediaRecorder) {
				mediaRecorder.stream.getTracks().forEach((track) => track.stop())
			}
		}
	}, [mediaRecorder])

	return (
		<div className={`${s.RecordNListen} ${className}`}>
			<button
				className={`${s.Record} ${isRecording ? s.pulsating : ''}`}
				onClick={handleRecordButtonClick}>
				<p>{isRecording ? 'Остановить' : 'Аудио'}</p>
				<img src={microSVG} alt={microSVG} />
			</button>
			{/* <button
				className={`${s.Listen} ${isPlaying ? s.pulsating : ''}`}
				onClick={handleListenButtonClick}>
				<p>Прослушать</p>
				<img src={Listen} alt={Listen} />
			</button> */}

			<Select
				className={s.Listen}
				multiple
				renderValue={(option: SelectOption<number> | null) => {
					if (option == null || option.value === null) {
						return (
							<>
								<div
									className={`${s.Listen__button} ${
										isPlaying ? s.pulsating : ''
									}`}>
									<p>Прослушать</p>
									<img src={Listen} alt={Listen} />
								</div>
							</>
						)
					}
					return (
						<>
							<div
								className={`${s.Listen__button} ${
									isPlaying ? s.pulsating : ''
								}`}>
								<p>Прослушать</p>
								<img src={Listen} alt={Listen} />
							</div>
						</>
					)
				}}>
				<Option className={s.Option} value={0}>
					<ul className={s.audioList}>
						{recordedAudios.map((audio, index) => (
							<div className={s.audioItemContainer}>
								<li className={s.audioItem} key={index}>
									<img src={Listen} alt={Listen} />
									{audio.path || audio.id ? (
										<span onClick={() => playRecordedAudio(audio.id)}>
											{audio.name}
										</span>
									) : (
										<span onClick={() => playAudio(audio.file)}>
											{audio.name}
										</span>
									)}
									<DeleteOutlineIcon onClick={() => sendDelete(audio.id)} />
								</li>
								{index !== recordedAudios.length - 1 && (
									<Line width="100%" className={s.Line} />
								)}
							</div>
						))}
					</ul>
				</Option>
			</Select>

			{/* // <div className={s.audioListContainer}>
				// 	<div className={s.audioList}>
				// 		<h2>Recorded Audios</h2>
				// 		<ul>
				// 			{recordedAudios.map((audio, index) => (
				// 				<li key={index}>
				// 					{audio.path || audio.id ? (
				// 						<span onClick={() => playRecordedAudio(audio.id)}>
				// 							{audio.name}
				// 						</span>
				// 					) : (
				// 						<span onClick={() => playAudio(audio.file)}>
				// 							{audio.name}
				// 						</span>
				// 					)}
				// 				</li>
				// 			))}
				// 		</ul>
				// 		<button onClick={() => setShowAudioList(false)}>Close</button>
				// 	</div>
				// </div> */}
		</div>
	)
}

export default RecordNListen
