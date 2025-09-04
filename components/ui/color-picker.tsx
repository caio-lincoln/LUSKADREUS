"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Palette, Heart, Clock, Pipette } from "lucide-react"

interface ColorPickerProps {
  color: string
  onChange: (color: string) => void
  className?: string
  disabled?: boolean
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ color, onChange, className = "", disabled = false }) => {
  const [recentColors, setRecentColors] = React.useState<string[]>([
    "#000000",
    "#FFFFFF",
    "#FF0000",
    "#00FF00",
    "#0000FF",
  ])
  const [favoriteColors, setFavoriteColors] = React.useState<string[]>([
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEAA7",
  ])
  const [customColor, setCustomColor] = React.useState(color)
  const [isOpen, setIsOpen] = React.useState(false)

  // Sincronizar cor customizada com prop
  React.useEffect(() => {
    setCustomColor(color)
  }, [color])

  // Paletas de cores organizadas
  const colorPalettes = {
    basic: [
      "#000000",
      "#404040",
      "#808080",
      "#BFBFBF",
      "#FFFFFF",
      "#FF0000",
      "#FF8000",
      "#FFFF00",
      "#80FF00",
      "#00FF00",
      "#00FF80",
      "#00FFFF",
      "#0080FF",
      "#0000FF",
      "#8000FF",
      "#FF00FF",
      "#FF0080",
      "#800000",
      "#804000",
      "#808000",
    ],
    warm: [
      "#FF6B6B",
      "#FF8E53",
      "#FF6B9D",
      "#C44569",
      "#F8B500",
      "#FF7675",
      "#FDCB6E",
      "#E17055",
      "#D63031",
      "#A29BFE",
    ],
    cool: [
      "#74B9FF",
      "#0984E3",
      "#00B894",
      "#00CEC9",
      "#6C5CE7",
      "#A29BFE",
      "#FD79A8",
      "#FDCB6E",
      "#E17055",
      "#81ECEC",
    ],
    nature: ["#2D3436", "#636E72", "#B2BEC3", "#DDD", "#55A3FF", "#26DE81", "#FD79A8", "#FDCB6E", "#FF7675", "#74B9FF"],
  }

  const addToRecent = (newColor: string) => {
    setRecentColors((prev) => {
      const filtered = prev.filter((c) => c !== newColor)
      return [newColor, ...filtered].slice(0, 10)
    })
  }

  const toggleFavorite = (targetColor: string) => {
    setFavoriteColors((prev) => {
      if (prev.includes(targetColor)) {
        return prev.filter((c) => c !== targetColor)
      } else {
        return [...prev, targetColor].slice(0, 10)
      }
    })
  }

  const handleColorSelect = React.useCallback(
    (selectedColor: string) => {
      console.log("🎨 ColorPicker: Cor selecionada:", selectedColor)

      // Aplicar cor imediatamente
      onChange(selectedColor)
      setCustomColor(selectedColor)
      addToRecent(selectedColor)

      // Fechar popover após seleção
      setTimeout(() => setIsOpen(false), 100)
    },
    [onChange],
  )

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value
    console.log("🎨 ColorPicker: Cor customizada:", newColor)
    setCustomColor(newColor)
    handleColorSelect(newColor)
  }

  const handleHexInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hexValue = e.target.value
    if (/^#[0-9A-F]{6}$/i.test(hexValue)) {
      handleColorSelect(hexValue)
    }
    setCustomColor(hexValue)
  }

  const ColorGrid: React.FC<{ colors: string[]; showFavorites?: boolean }> = ({ colors, showFavorites = false }) => (
    <div className="grid grid-cols-5 gap-2">
      {colors.map((paletteColor) => (
        <div key={paletteColor} className="relative group">
          <button
            className={`w-8 h-8 rounded-lg border-2 transition-all duration-200 hover:scale-110 hover:shadow-lg ${
              color === paletteColor
                ? "border-blue-500 ring-2 ring-blue-200 scale-105 shadow-lg"
                : "border-gray-300 hover:border-gray-400"
            }`}
            style={{ backgroundColor: paletteColor }}
            onClick={() => handleColorSelect(paletteColor)}
            title={`${paletteColor} ${color === paletteColor ? "(Selecionada)" : ""}`}
            disabled={disabled}
          />
          {color === paletteColor && (
            <div className="absolute inset-0 rounded-lg border-2 border-blue-500 pointer-events-none">
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border border-white"></div>
            </div>
          )}
          {showFavorites && (
            <button
              className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border bg-white shadow-sm transition-colors ${
                favoriteColors.includes(paletteColor)
                  ? "text-red-500 hover:text-red-600"
                  : "text-gray-400 hover:text-red-400"
              }`}
              onClick={(e) => {
                e.stopPropagation()
                toggleFavorite(paletteColor)
              }}
              disabled={disabled}
            >
              <Heart className="w-2.5 h-2.5" fill={favoriteColors.includes(paletteColor) ? "currentColor" : "none"} />
            </button>
          )}
        </div>
      ))}
    </div>
  )

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`h-10 px-3 flex items-center gap-2 ${className}`}
          disabled={disabled}
        >
          <div
            className="w-5 h-5 rounded border-2 border-gray-300 shadow-sm transition-all duration-200 hover:scale-110"
            style={{ backgroundColor: color }}
          />
          <Palette className="w-4 h-4" />
          <Badge variant="secondary" className="text-xs font-mono">
            {color.toUpperCase()}
          </Badge>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0" align="start">
        <Tabs defaultValue="palettes" className="w-full">
          <TabsList className="grid w-full grid-cols-4 rounded-none border-b">
            <TabsTrigger value="palettes" className="text-xs">
              <Palette className="w-3 h-3 mr-1" />
              Paletas
            </TabsTrigger>
            <TabsTrigger value="recent" className="text-xs">
              <Clock className="w-3 h-3 mr-1" />
              Recentes
            </TabsTrigger>
            <TabsTrigger value="favorites" className="text-xs">
              <Heart className="w-3 h-3 mr-1" />
              Favoritas
            </TabsTrigger>
            <TabsTrigger value="custom" className="text-xs">
              <Pipette className="w-3 h-3 mr-1" />
              Custom
            </TabsTrigger>
          </TabsList>

          <TabsContent value="palettes" className="p-4 space-y-4">
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-medium text-gray-600 mb-2 block">Básicas</Label>
                <ColorGrid colors={colorPalettes.basic} showFavorites />
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-600 mb-2 block">Cores Quentes</Label>
                <ColorGrid colors={colorPalettes.warm} showFavorites />
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-600 mb-2 block">Cores Frias</Label>
                <ColorGrid colors={colorPalettes.cool} showFavorites />
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-600 mb-2 block">Natureza</Label>
                <ColorGrid colors={colorPalettes.nature} showFavorites />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="recent" className="p-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-600">Cores Recentes</Label>
              {recentColors.length > 0 ? (
                <ColorGrid colors={recentColors} />
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">Nenhuma cor recente</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="favorites" className="p-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-600">Cores Favoritas</Label>
              {favoriteColors.length > 0 ? (
                <ColorGrid colors={favoriteColors} />
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">Nenhuma cor favorita</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="custom" className="p-4 space-y-4">
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-medium text-gray-600 mb-2 block">Seletor Visual</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={customColor}
                    onChange={handleCustomColorChange}
                    disabled={disabled}
                    className="w-12 h-12 rounded-lg border-2 border-gray-300 cursor-pointer hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <div className="flex-1">
                    <div
                      className="w-full h-12 rounded-lg border-2 border-gray-300 transition-all duration-200"
                      style={{ backgroundColor: customColor }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">Preview</div>
                </div>
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-600 mb-2 block">Código Hexadecimal</Label>
                <Input
                  type="text"
                  value={customColor}
                  onChange={handleHexInput}
                  placeholder="#000000"
                  className="font-mono text-sm"
                  disabled={disabled}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <Label className="text-gray-600">R</Label>
                  <div className="bg-gray-100 p-1 rounded text-center">
                    {Number.parseInt(customColor.slice(1, 3), 16)}
                  </div>
                </div>
                <div>
                  <Label className="text-gray-600">G</Label>
                  <div className="bg-gray-100 p-1 rounded text-center">
                    {Number.parseInt(customColor.slice(3, 5), 16)}
                  </div>
                </div>
                <div>
                  <Label className="text-gray-600">B</Label>
                  <div className="bg-gray-100 p-1 rounded text-center">
                    {Number.parseInt(customColor.slice(5, 7), 16)}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  )
}
