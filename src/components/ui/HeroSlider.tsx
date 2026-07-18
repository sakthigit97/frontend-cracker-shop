import { useEffect, useState } from "react";
import { useConfigStore } from "../../store/config.store";

export default function HeroSlider() {
  const [index, setIndex] = useState(0);

  const configImages = useConfigStore((s) => s.config?.sliderImages);
  const sliderImages = configImages ?? [];

  useEffect(() => {
    if (!sliderImages.length) return;

    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % sliderImages.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [sliderImages.length]);

  const prevSlide = () => {
    setIndex((prev) => (prev - 1 + sliderImages.length) % sliderImages.length);
  };

  const nextSlide = () => {
    setIndex((prev) => (prev + 1) % sliderImages.length);
  };

  if (!sliderImages.length) return null;

  return (
    <div
      className="
    relative
    w-full
    overflow-hidden
    rounded-xl
    mb-6

    h-[180px]
    sm:h-[220px]
    md:h-[260px]
    lg:h-[320px]
    xl:h-[360px]
  "
    >
      {sliderImages.map((slide, i) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-700 ${i === index ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
        >
          <img
            src={slide.imageUrl}
            alt={slide.title}
            className="w-full h-full object-fill"
          />
        </div>
      ))}

      {/* Previous */}
      <button
        onClick={prevSlide}
        className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-30
                   h-10 w-10 rounded-full bg-black/40 hover:bg-black/60
                   text-white items-center justify-center transition"
      >
        ❮
      </button>

      {/* Next */}
      <button
        onClick={nextSlide}
        className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-30
                   h-10 w-10 rounded-full bg-black/40 hover:bg-black/60
                   text-white items-center justify-center transition"
      >
        ❯
      </button>

      {/* Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-30">
        {sliderImages.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`rounded-full transition-all duration-300 ${i === index
              ? "w-8 h-2 bg-white"
              : "w-2 h-2 bg-white/50 hover:bg-white"
              }`}
          />
        ))}
      </div>
    </div>
  );
}