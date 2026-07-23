// src/components/common/BannerCarousel.jsx

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import productService from "../../services/productService";

const BannerCarousel = () => {
  const [banners, setBanners] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    productService
      .getBanners("hero")
      .then(setBanners)
      .catch(() => setBanners([]));
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (banners.length === 0) return null;

  const banner = banners[activeIndex];

  const goPrev = () =>
    setActiveIndex((prev) => (prev - 1 + banners.length) % banners.length);
  const goNext = () => setActiveIndex((prev) => (prev + 1) % banners.length);

  const content = (
    <div className="relative w-full h-[280px] sm:h-[400px] lg:h-[400px] rounded-2xl overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.img
          key={banner._id}
          src={banner.image?.url}
          alt={banner.title}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </AnimatePresence>

      <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent flex items-center">
        <div className="px-6 ml-5 sm:px-10 max-w-md ">
          <motion.h2
            key={`title-${banner._id}`}
            initial={{ y: 10, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }}
            className="text-xl sm:text-3xl font-extrabold text-white mb-2"
          >
            {banner.title}
          </motion.h2>
          {banner.subtitle && (
            <p className="text-sm sm:text-base text-white/90">
              {banner.subtitle}
            </p>
          )}
        </div>
      </div>

      {banners.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.preventDefault();
              goPrev();
            }}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-sm"
          >
           
            <FiChevronLeft size={18} />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              goNext();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-sm"
          >
            <FiChevronRight size={18} />
          </button>
          
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveIndex(idx);
                }}
                className="w-2 h-2 rounded-full bg-transparent border-none"
              />
            ))}
          </div>
        </>
      )}
    </div>
  );

  // If the banner has a link, wrap in a Link; otherwise render as-is
  return banner.linkUrl ? <Link to={banner.linkUrl}>{content}</Link> : content;
};

export default BannerCarousel;
