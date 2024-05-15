// import {defineConfig} from 'vite'
// import react from '@vitejs/plugin-react'
// import tsconfigPaths from 'vite-tsconfig-paths'

// export default defineConfig({
// 	plugins: [react(), tsconfigPaths()],
// })

import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
	plugins: [react()],
	server: {
		watch: {
			usePolling: true,
		},
		host: true, // чтобы сервер был доступен снаружи контейнера
		port: 80,
	},
})
