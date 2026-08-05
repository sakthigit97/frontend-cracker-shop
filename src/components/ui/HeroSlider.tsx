import { useEffect, useState } from "react";
import { useConfigStore } from "../../store/config.store";

export default function HeroSlider() {
  const [index, setIndex] = useState(0);
  const sliderImages = useConfigStore(
    (state) => state.config?.sliderImages ?? []
  );

  useEffect(() => {
    if (sliderImages.length === 0) {
      setIndex(0);
      return;
    }

    if (index >= sliderImages.length) {
      setIndex(0);
    }
  }, [index, sliderImages.length]);

  /**
   * Auto slide every 4 seconds.
   */
  useEffect(() => {
    if (sliderImages.length <= 1) return;

    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % sliderImages.length);
    }, 4000);

    return () => window.clearInterval(timer);
  }, [sliderImages.length]);

  const prevSlide = () => {
    if (!sliderImages.length) return;

    setIndex((prev) => (prev - 1 + sliderImages.length) % sliderImages.length);
  };

  const nextSlide = () => {
    if (!sliderImages.length) return;

    setIndex((prev) => (prev + 1) % sliderImages.length);
  };

  if (!sliderImages.length) {
    return null;
  }

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
            alt={slide.title || "Banner"}
            className="w-full h-full object-fill"
          />
        </div>
      ))}

      <button
        onClick={prevSlide}
        className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-30
                   h-10 w-10 rounded-full bg-black/40 hover:bg-black/60
                   text-white items-center justify-center transition"
        aria-label="Previous Slide"
      >
        ❮
      </button>

      <button
        onClick={nextSlide}
        className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-30
                   h-10 w-10 rounded-full bg-black/40 hover:bg-black/60
                   text-white items-center justify-center transition"
        aria-label="Next Slide"
      >
        ❯
      </button>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-30">
        {sliderImages.map((slide, i) => (
          <button
            key={slide.id}
            onClick={() => setIndex(i)}
            aria-label={`Go to slide ${i + 1}`}
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