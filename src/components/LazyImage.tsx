import { useState, ImgHTMLAttributes } from 'react';
import { ImageOff } from 'lucide-react';

export default function LazyImage({ className = '', alt = '', ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className={`${className} flex items-center justify-center bg-black/10 dark:bg-white/5 text-[#8E8E93] overflow-hidden`}>
        <ImageOff size={24} className="opacity-50" />
      </div>
    );
  }

  return (
    <img
      {...props}
      alt={alt}
      loading="lazy"
      onLoad={(e) => {
        setIsLoaded(true);
        if (props.onLoad) props.onLoad(e);
      }}
      onError={(e) => {
        setHasError(true);
        if (props.onError) props.onError(e);
      }}
      className={`${className} ${
        isLoaded ? 'blur-0' : 'blur-lg scale-[1.05] opacity-50 bg-[#222]'
      }`}
      style={{
        transition: 'filter 0.7s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.7s cubic-bezier(0.4, 0, 0.2, 1), transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
        ...props.style
      }}
    />
  );
}
