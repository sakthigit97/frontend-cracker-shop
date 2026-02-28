import { useEffect, useState } from "react";
import { useConfigStore } from "../../store/config.store";

export default function HeroSlider() {
  const [index, setIndex] = useState(0);

  const configImages = useConfigStore(
    (s) => s.config?.sliderImages
  );
  const sliderImages = configImages ?? [];

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % sliderImages.length);
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className="
        relative 
        w-full 
        h-[180px] 
        sm:h-[260px] 
        md:h-[320px] 
        overflow-hidden 
        rounded-xl 
        mb-4
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
            className="w-full h-full object-cover"
          />

          <div className="absolute inset-0 bg-black/40 flex flex-col justify-center px-6">
            <h2 className="text-white text-xl sm:text-2xl md:text-3xl font-bold">
              {slide.title}
            </h2>
            <p className="text-white/90 text-sm sm:text-base mt-1">
              {slide.title}
            </p>
          </div>
        </div>
      ))}

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {sliderImages.map((_, i) => (
          <span
            key={i}
            className={`h-2 w-2 rounded-full ${i === index ? "bg-white" : "bg-white/50"
              }`}
          />
        ))}
      </div>
    </div>
  );
}
