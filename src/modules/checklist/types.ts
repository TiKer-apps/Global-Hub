// Modèle partagé par les modules "tâches" et "todo-list" : même comportement,
// composants et styles distincts.

export interface ChecklistLine {
  id: string
  text: string
  isItem: boolean // ligne commençant par '-'
  done: boolean // item : barré / ligne non-item : grisée + coche
}

export interface ChecklistWidgetData {
  id: string
  lines: ChecklistLine[]
}
