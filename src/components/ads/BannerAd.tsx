export default function BannerAd({ className }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-center bg-neutral-800 min-h-[90px] text-xs text-gray-500 ${className ?? ''}`}
    >
      Ad
    </div>
  )
}
