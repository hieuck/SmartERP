import { PictureOutlined } from "@ant-design/icons";
import type { ReactElement } from "react";
import { useEffect, useState } from "react";

type ProductVisualSize = "sm" | "md" | "lg";

type ProductVisualProps = {
  imageUrl?: string | null;
  name: string;
  size?: ProductVisualSize;
};

export function ProductVisual({
  imageUrl,
  name,
  size = "md",
}: ProductVisualProps): ReactElement {
  const [hasImageError, setHasImageError] = useState(false);

  useEffect(() => {
    setHasImageError(false);
  }, [imageUrl]);

  const normalizedImageUrl = imageUrl?.trim() ?? "";
  const showImage = normalizedImageUrl.length > 0 && !hasImageError;

  return (
    <div
      className={`product-visual product-visual--${size}${showImage ? " has-image" : ""}`}
      data-testid="product-visual"
    >
      {showImage ? (
        <img
          alt={name}
          loading="lazy"
          src={normalizedImageUrl}
          onError={() => setHasImageError(true)}
        />
      ) : (
        <div className="product-visual-fallback" aria-label={name}>
          <PictureOutlined />
        </div>
      )}
    </div>
  );
}
