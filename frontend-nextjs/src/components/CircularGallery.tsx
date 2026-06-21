"use client";

import { useEffect, useRef } from "react";

interface GalleryItem {
  image: string;
  text: string;
}

interface Props {
  items: GalleryItem[];
  radius?: number;
  autoRotate?: boolean;
  onClickItem?: (index: number) => void;
}

export default function CircularGallery({
  items,
  radius = 650,
  autoRotate = true,
  onClickItem,
}: Props) {
  const galleryRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rotationRef = useRef(0);
  const visibleRef = useRef(true);

  useEffect(() => {
    if (!autoRotate) return;

    // Pause the RAF loop when the gallery is scrolled out of view
    const observer = new IntersectionObserver(
      ([entry]) => { visibleRef.current = entry.isIntersecting; },
      { threshold: 0.05 }
    );
    if (containerRef.current) observer.observe(containerRef.current);

    let frame: number;
    let last = performance.now();

    const animate = (now: number) => {
      frame = requestAnimationFrame(animate);
      if (!visibleRef.current) return; // skip draw when off-screen

      const delta = now - last;
      last = now;
      rotationRef.current += delta * 0.006;

      if (galleryRef.current) {
        galleryRef.current.style.transform =
          `translate(-50%, -50%) rotateY(${rotationRef.current}deg)`;
      }
    };

    frame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [autoRotate]);

  const step = 360 / items.length;

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden select-none"
      style={{ height: "750px", perspective: "2500px" }}
    >
      <div
        ref={galleryRef}
        className="absolute left-1/2 top-1/2"
        style={{
          transform: "translate(-50%, -50%) rotateY(0deg)",
          transformStyle: "preserve-3d",
          willChange: "transform",
        }}
      >
        {items.map((item, index) => {
          const angle = step * index;
          return (
            <div
              key={index}
              className="absolute left-0 top-0"
              style={{
                width: "300px",
                height: "430px",
                transform: `translate(-50%, -50%) rotateY(${angle}deg) translateZ(${radius}px)`,
                transformStyle: "preserve-3d",
                willChange: "transform",
                backfaceVisibility: "visible",
              }}
            >
              <div
                className="group relative h-full w-full overflow-hidden cursor-pointer rounded-[28px] shadow-2xl
                  transition-transform duration-300 ease-out hover:-translate-y-2 hover:scale-[1.03]"
                onClick={() => onClickItem?.(index)}
              >
                <img
                  src={item.image}
                  alt={item.text}
                  draggable={false}
                  decoding="async"
                  className="h-full w-full object-cover pointer-events-none transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <p className="text-lg font-semibold text-white drop-shadow-lg">{item.text}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pointer-events-none absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-[var(--background)] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-[var(--background)] to-transparent" />
    </div>
  );
}
