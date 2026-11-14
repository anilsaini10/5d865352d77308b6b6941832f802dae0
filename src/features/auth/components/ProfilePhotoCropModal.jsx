import { useCallback, useState } from 'react'
import Cropper from 'react-easy-crop'
import { ImagePlus, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react'
import { Modal, Button } from '../../../components/ui.jsx'

function createImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

function getRadianAngle(deg) {
  return (deg * Math.PI) / 180
}

async function getCroppedImg(imageSrc, pixelCrop, rotation = 0) {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  const rad = getRadianAngle(rotation)
  const sin = Math.abs(Math.sin(rad))
  const cos = Math.abs(Math.cos(rad))
  const bW = image.width * cos + image.height * sin
  const bH = image.width * sin + image.height * cos

  canvas.width = bW
  canvas.height = bH

  ctx.translate(bW / 2, bH / 2)
  ctx.rotate(rad)
  ctx.translate(-image.width / 2, -image.height / 2)
  ctx.drawImage(image, 0, 0)

  const data = ctx.getImageData(pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height)
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height
  ctx.putImageData(data, 0, 0)

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.92)
  })
}

export default function ProfilePhotoCropModal({ open, onClose, imageSrc, onSave, onReUpload }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [saving, setSaving] = useState(false)

  const onCropComplete = useCallback((_area, areaPixels) => {
    setCroppedAreaPixels(areaPixels)
  }, [])

  const handleSave = async () => {
    if (!croppedAreaPixels) return
    setSaving(true)
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels, rotation)
      const file = new File([blob], 'profile.jpg', { type: 'image/jpeg' })
      await onSave(file)
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setRotation(0)
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Profile Photo" subtitle="Crop and adjust your photo">
      <div className="space-y-5">
        {/* Cropper area */}
        <div className="relative w-full aspect-square max-h-[360px] rounded-xl overflow-hidden bg-ink/5">
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          )}
        </div>

        {/* Zoom & rotate controls */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <ZoomOut size={16} className="text-ink/40 shrink-0" />
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 h-1.5 accent-board rounded-full appearance-none bg-line cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-board [&::-webkit-slider-thumb]:shadow-sm"
            />
            <ZoomIn size={16} className="text-ink/40 shrink-0" />
          </div>

          <div className="flex items-center gap-3">
            <RotateCcw size={16} className="text-ink/40 shrink-0" />
            <input
              type="range"
              min={0}
              max={360}
              step={1}
              value={rotation}
              onChange={(e) => setRotation(Number(e.target.value))}
              className="flex-1 h-1.5 accent-board rounded-full appearance-none bg-line cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-board [&::-webkit-slider-thumb]:shadow-sm"
            />
            <span className="text-xs text-ink/50 w-10 text-right shrink-0">{rotation}°</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 pt-1">
          <Button variant="ghost" onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            icon={ImagePlus}
            onClick={() => {
              handleClose()
              onReUpload()
            }}
            disabled={saving}
          >
            Re-upload
          </Button>
          <div className="flex-1" />
          <Button variant="primary" onClick={handleSave} loading={saving}>
            Save Photo
          </Button>
        </div>
      </div>
    </Modal>
  )
}
