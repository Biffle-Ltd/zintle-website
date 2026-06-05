import { useId } from "react";

const COIN_IMAGE_SRC = "/icons/zintle-coin.png";

type ZintleCoinIconProps = {
  className?: string;
  size?: number;
};

/** Slightly larger than adjacent coin amount text (`1em + 4px`). */
export const COIN_ICON_CLASS = "h-[calc(1em+4px)] w-[calc(1em+4px)] shrink-0";

/** Gold coin with “Z” mark (24×24 design asset). */
export function ZintleCoinIcon({ className, size }: ZintleCoinIconProps) {
  const safeId = useId().replace(/:/g, "");
  const patternId = `zintle-coin-pattern-${safeId}`;
  const imageId = `zintle-coin-image-${safeId}`;
  const filterId = `zintle-coin-filter-${safeId}`;

  const sizeProps =
    size != null ? { width: size, height: size } : ({} as const);

  return (
    <svg
      {...sizeProps}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <rect width="24" height="24" fill={`url(#${patternId})`} />
      <g filter={`url(#${filterId})`}>
        <path
          d="M11.3837 13.2385H15.0673L14.562 15H7.29865L12.3613 10.2207H8.67292L9.17824 8.45448H16.4416L11.3837 13.2385Z"
          fill="white"
        />
      </g>
      <defs>
        <pattern
          id={patternId}
          patternContentUnits="objectBoundingBox"
          width="1"
          height="1"
        >
          <use href={`#${imageId}`} transform="scale(0.01)" />
        </pattern>
        <filter
          id={filterId}
          x="7.29883"
          y="8.45459"
          width="9.14258"
          height="7.54541"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="1" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
          />
          <feBlend
            mode="normal"
            in2="BackgroundImageFix"
            result="effect1_dropShadow"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow"
            result="shape"
          />
        </filter>
        <image
          id={imageId}
          width="100"
          height="100"
          preserveAspectRatio="none"
          href={COIN_IMAGE_SRC}
        />
      </defs>
    </svg>
  );
}
