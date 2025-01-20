import type React from 'react'
import {Loader} from 'lucide-react'
import {motion} from 'framer-motion'

const LoadingState: React.FC = () => (
	<div className="flex items-center justify-center h-screen">
		<motion.div
			initial={{opacity: 0, rotate: 0}}
			animate={{
				opacity: 1,
				rotate: 360,
				transition: {duration: 0.5, repeat: Infinity},
			}}
			exit={{opacity: 0}}
			className="flex items-center justify-center">
			<Loader className="h-12 w-12 text-gray-400" />
		</motion.div>
	</div>
)

export default LoadingState
