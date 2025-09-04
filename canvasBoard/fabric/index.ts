// Exportações do módulo fabric
export { PaintBoard } from "./paintBoard"
export type { PaintBoardConfig } from "./paintBoard"

// Novos utilitários Fabric.js de alta qualidade
export {
  initHighQualityFabricCanvas,
  HighResolutionExporter,
  FabricMixins,
  applyMixins,
} from "./fabricUtils"
export type { HighQualityCanvasOptions } from "./fabricUtils"

// Pincéis customizados
export {
  ShadowBrush,
  SprayBrush,
  PatternBrush,
  CalligraphyBrush,
  BrushFactory,
} from "./customBrushes"

// Sistema de recorte de imagens
export { ImageCropManager, ImageUtils } from "./imageCrop"
export type { ImageCropOptions } from "./imageCrop"

// Outros utilitários do fabric.js
export * from "./tools"
export * from "./events"
export * from "./utils"
