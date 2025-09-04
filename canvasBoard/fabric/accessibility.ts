// Sistema de acessibilidade
export class AccessibilityManager {
  private canvas: HTMLCanvasElement
  private announcer: HTMLElement
  private keyboardShortcuts: Map<string, () => void> = new Map()

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.setupAccessibility()
    this.setupKeyboardNavigation()
  }

  private setupAccessibility() {
    // Configurar ARIA
    this.canvas.setAttribute("role", "img")
    this.canvas.setAttribute("aria-label", "Área de desenho interativa")
    this.canvas.setAttribute("tabindex", "0")

    // Criar elemento para anúncios de tela
    this.announcer = document.createElement("div")
    this.announcer.setAttribute("aria-live", "polite")
    this.announcer.setAttribute("aria-atomic", "true")
    this.announcer.style.position = "absolute"
    this.announcer.style.left = "-10000px"
    this.announcer.style.width = "1px"
    this.announcer.style.height = "1px"
    this.announcer.style.overflow = "hidden"
    document.body.appendChild(this.announcer)
  }

  private setupKeyboardNavigation() {
    this.canvas.addEventListener("keydown", this.handleKeyDown.bind(this))

    // Registrar atalhos padrão
    this.registerShortcut("ctrl+z", () => this.announce("Desfazer"))
    this.registerShortcut("ctrl+y", () => this.announce("Refazer"))
    this.registerShortcut("ctrl+shift+z", () => this.announce("Refazer"))
    this.registerShortcut("delete", () => this.announce("Excluir seleção"))
    this.registerShortcut("escape", () => this.announce("Cancelar operação"))
    this.registerShortcut("ctrl+a", () => this.announce("Selecionar tudo"))
    this.registerShortcut("ctrl+s", () => this.announce("Salvar"))
    this.registerShortcut("ctrl+o", () => this.announce("Abrir"))
    this.registerShortcut("ctrl+n", () => this.announce("Novo"))

    // Navegação por ferramentas
    this.registerShortcut("b", () => this.announce("Ferramenta: Pincel"))
    this.registerShortcut("e", () => this.announce("Ferramenta: Borracha"))
    this.registerShortcut("v", () => this.announce("Ferramenta: Seleção"))
    this.registerShortcut("t", () => this.announce("Ferramenta: Texto"))
    this.registerShortcut("r", () => this.announce("Ferramenta: Retângulo"))
    this.registerShortcut("c", () => this.announce("Ferramenta: Círculo"))

    // Zoom e navegação
    this.registerShortcut("ctrl+=", () => this.announce("Aumentar zoom"))
    this.registerShortcut("ctrl+-", () => this.announce("Diminuir zoom"))
    this.registerShortcut("ctrl+0", () => this.announce("Resetar zoom"))
    this.registerShortcut("space", () => this.announce("Modo panorâmica"))
  }

  private handleKeyDown(e: KeyboardEvent) {
    const key = this.getKeyString(e)
    const handler = this.keyboardShortcuts.get(key)

    if (handler) {
      e.preventDefault()
      handler()
    }
  }

  private getKeyString(e: KeyboardEvent): string {
    const parts: string[] = []

    if (e.ctrlKey) parts.push("ctrl")
    if (e.shiftKey) parts.push("shift")
    if (e.altKey) parts.push("alt")
    if (e.metaKey) parts.push("meta")

    parts.push(e.key.toLowerCase())

    return parts.join("+")
  }

  public registerShortcut(key: string, handler: () => void) {
    this.keyboardShortcuts.set(key, handler)
  }

  public announce(message: string) {
    this.announcer.textContent = message
    // Limpar após um tempo para permitir novos anúncios
    setTimeout(() => {
      this.announcer.textContent = ""
    }, 1000)
  }

  public updateCanvasDescription(description: string) {
    this.canvas.setAttribute("aria-label", description)
  }

  public announceToolChange(toolName: string) {
    this.announce(`Ferramenta alterada para: ${toolName}`)
  }

  public announceZoomChange(zoomLevel: number) {
    this.announce(`Zoom alterado para: ${Math.round(zoomLevel * 100)}%`)
  }

  public announceDrawingAction(action: string) {
    this.announce(action)
  }

  public dispose() {
    if (this.announcer && this.announcer.parentNode) {
      this.announcer.parentNode.removeChild(this.announcer)
    }
    this.keyboardShortcuts.clear()
  }
}
