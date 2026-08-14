import '@/i18n'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TaskPreview } from './TaskPreview'

describe('TaskPreview', () => {
  it('shows a placeholder when there is nothing to preview', () => {
    render(<TaskPreview content="" />)
    expect(screen.getByText('Rien à afficher pour l\'instant.')).toBeInTheDocument()
  })

  it('ignores blank lines', () => {
    render(<TaskPreview content={'\n   \n'} />)
    expect(screen.getByText('Rien à afficher pour l\'instant.')).toBeInTheDocument()
  })

  it('renders a plain line as simple text, without a checkbox', () => {
    const { container } = render(<TaskPreview content="Texte simple" />)
    expect(screen.getByText('Texte simple')).toBeInTheDocument()
    expect(container.querySelector('svg')).toBeNull()
  })

  it('renders a line starting with "-" as a checkable item, stripping the marker', () => {
    const { container } = render(<TaskPreview content="- envoyer l'invitation" />)
    expect(screen.getByText("envoyer l'invitation")).toBeInTheDocument()
    expect(container.querySelector('svg')).not.toBeNull()
  })

  it('renders multiple lines in order, mixing plain and checkable', () => {
    const { container } = render(<TaskPreview content={'Contexte\n- première tâche\n- deuxième tâche'} />)
    const lines = [...container.querySelectorAll('span.truncate')]
    expect(lines.map((l) => l.textContent)).toEqual(['Contexte', 'première tâche', 'deuxième tâche'])
  })
})
