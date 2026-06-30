import Image from "next/image";

type BrandLogoProps = {
  size?: number;
  className?: string;
  priority?: boolean;
};

export default function BrandLogo({ size = 52, className = "", priority = false }: BrandLogoProps) {
  return (
    <Image
      src="/images/tikkaxpress-logo.png"
      alt="TikkaXpress Indian Kitchen"
      width={size}
      height={size}
      priority={priority}
      className={`shrink-0 rounded-full shadow-glow ring-2 ring-tandoori/15 ${className}`}
    />
  );
}
