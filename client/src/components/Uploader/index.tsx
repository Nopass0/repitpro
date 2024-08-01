import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from '@/ui/context-menu'
import {Button} from '@/ui/button'
import {CloudUpload, ClipboardPaste, File, Trash2} from 'lucide-react'

const Uploader = () => {
	return (
		<ContextMenu>
			<ContextMenuTrigger className="w-[300px] h-[56px] flex flex-row items-center duration-150 transition-colors hover:bg-[#e6f1e6] rounded-md cursor-pointer">
				<CloudUpload
					color="#fff"
					className="h-10 w-7 bg-primary p-2 rounded-md"
				/>{' '}
				<div className="flex flex-col mr-1">
					<p className="ml-2 font-medium">Загрузить файл</p>
					<p className="ml-2 font-normal text-xs text-primary">
						По нажатию на правую кнопку мыши можно вставить ссылку
					</p>
				</div>
			</ContextMenuTrigger>
			<div id="files-wrapper" className="flex flex-col w-[298px] min-h-[56px] ">
				<div
					id="file"
					className="w-full h-[40px] justify-between flex items-center hover:bg-[#eee] transition-all duration-200 hover:border-[0.5px] cursor-pointer   flex-row my-1 rounded-md bg-secondary border-dashed border broder-primary">
					<div className="flex flex-row">
						<File
							color="#1f1f1f"
							fill="#1f1f1f"
							size={20}
							className="text-primary ml-2 mr-2"
						/>
						<p className="text-sm truncate font-medium">filename.txt</p>
					</div>
					<div>
						<Button
							variant="ghost"
							size="icon"
							className="group hover:bg-[#e46b6b] transition-all duration-200">
							<Trash2
								size={20}
								className="text-[#1f1f1f] group-hover:text-[#ffffff] transition-all duration-200"
							/>
						</Button>
					</div>
				</div>
			</div>
			<ContextMenuContent className="w-52 ">
				<ContextMenuItem className="cursor-pointer" inset>
					<ClipboardPaste color="#1f1f1f" size={20} className="text-primary" />
					<p className="ml-2 font-normal">Вставить ссылку</p>
				</ContextMenuItem>
				<ContextMenuItem className="cursor-pointer" inset>
					<ClipboardPaste color="#1f1f1f" size={20} className=" text-primary" />

					<p className="ml-2 font-normal">Вставить файл</p>
				</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	)
}

export default Uploader
