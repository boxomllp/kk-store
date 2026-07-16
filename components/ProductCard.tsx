import Link from "next/link";
import type { Product } from "@/lib/types";

export default function ProductCard({ product }: { product: Product }) {
  const discount =
    product.compare_price && product.compare_price > product.price
      ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
      : 0;

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
        {product.images?.[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
            No image
          </div>
        )}
        {discount > 0 && (
          <span className="absolute top-2 left-2 bg-saleRed text-white text-xs font-bold px-2 py-1 rounded-full">
            SAVE {discount}%
          </span>
        )}
      </div>
      <div className="mt-2">
        <h3 className="text-sm font-medium line-clamp-2">{product.name}</h3>
        <div className="flex items-center gap-2 mt-1">
          <span className="font-bold text-navy">₹{product.price}</span>
          {product.compare_price && product.compare_price > product.price && (
            <span className="text-gray-500 line-through text-sm">₹{product.compare_price}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
