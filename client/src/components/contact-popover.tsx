import type React from 'react'
import {Phone, Mail} from 'lucide-react'

interface ContactPopoverProps {
	phoneNumber: string
	email: string
}

export const ContactPopover: React.FC<ContactPopoverProps> = ({
	phoneNumber,
	email,
}) => {
	return (
		<div className="flex items-center space-x-2">
			<button className="p-1 rounded-full bg-gray-100 hover:bg-gray-200">
				<Phone className="w-4 h-4 text-gray-600" />
			</button>
			<button className="p-1 rounded-full bg-gray-100 hover:bg-gray-200">
				<Mail className="w-4 h-4 text-gray-600" />
			</button>
		</div>
	)
}
