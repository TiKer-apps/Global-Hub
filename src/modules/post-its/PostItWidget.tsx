import { ModuleCard } from '@/components/module-card'

export function PostItWidget() {
  return (
    <ModuleCard className="w-64" title="Post-it" headerClassName="bg-yellow-400 text-black">
      <p className="text-sm text-muted-foreground">
        À implémenter — même principe que les notes + choix de police stylée.
      </p>
    </ModuleCard>
  )
}
