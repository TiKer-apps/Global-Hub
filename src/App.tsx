import { HubCanvas } from '@/canvas/HubCanvas'
import { MobileHub } from '@/canvas/MobileHub'
import { useIsMobile } from '@/canvas/use-is-mobile'

function App() {
  const isMobile = useIsMobile()
  return isMobile ? <MobileHub /> : <HubCanvas />
}

export default App
