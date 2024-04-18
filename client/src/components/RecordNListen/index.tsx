import React, {useEffect, useState} from 'react'
import s from './index.module.scss'
import microSVG from '../../assets/Microphone1.svg'
import Listen from '../../assets/Listen.svg'
interface IRecordNListen {
	className?: string
}

const RecordNListen: React.FC<IRecordNListen> = ({
	className,
}: IRecordNListen) => {
	const [isRecording, setIsRecording] = useState(false)
	const [audioChunks, setAudioChunks] = useState([])
	const [audioBlob, setAudioBlob] = useState(null)
	const [isPlaying, setIsPlaying] = useState(false)
	let mediaRecorder // Initialize mediaRecorder with a default value of null

	const startRecording = async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({audio: true})
			mediaRecorder = new MediaRecorder(stream) // Update mediaRecorder when startRecording is called

			mediaRecorder.addEventListener('dataavailable', (event) => {
				setAudioChunks((prev) => [...prev, event.data])
			})

			mediaRecorder.addEventListener('stop', () => {
				const audioBlob = new Blob(audioChunks, {
					type: 'audio/ogg; codecs=opus',
				})
				setAudioBlob(audioBlob)
				setAudioChunks([])
			})

			mediaRecorder.start()
			setIsRecording(true)
		} catch (error) {
			console.error('Error accessing microphone:', error)
		}
	}
	const stopRecording = () => {
		setIsRecording(false)
		if (mediaRecorder) {
			mediaRecorder.stop() // Now mediaRecorder should be defined
		}
	}
	const playAudio = () => {
		if (audioBlob) {
			const audioURL = URL.createObjectURL(audioBlob)
			const audio = new Audio(audioURL)
			audio.play()
			setIsPlaying(true)

			audio.addEventListener('ended', () => {
				setIsPlaying(false)
				URL.revokeObjectURL(audioURL)
			})
		}
	}
	const handleRecordButtonClick = () => {
		if (isRecording) {
			stopRecording()
		} else {
			startRecording()
		}
	}
	const handleListenButtonClick = () => {
		if (audioBlob) {
			playAudio()
		}
	}
	useEffect(() => {
		return () => {
			if (mediaRecorder) {
				mediaRecorder.stop()
			}
		}
	}, [mediaRecorder])
	return (
		<div className={`${s.RecordNListen} ${className}`}>
			<button
				className={`${s.Record} ${isRecording ? s.pulsating : ''}`}
				onClick={handleRecordButtonClick}>
				<p>Аудио</p>
				<img src={microSVG} alt={microSVG} />
			</button>
			<button
				className={`${s.Listen} ${isPlaying ? s.pulsating : ''}`}
				onClick={handleListenButtonClick}>
				<p>Прослушать</p>
				<img src={Listen} alt={Listen} />
			</button>
		</div>
	)
}

export default RecordNListen
