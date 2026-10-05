/** Storage bucket names (created by the initial migration) and path conventions. Safe for client code. */
export const PRODUCT_IMAGE_BUCKET = "product-images";
export const ENVIRONMENT_BUCKET = "environment-images";
export const VISUALIZATION_BUCKET = "visualizations";

/** Every stored design image has a small companion used in lists: `dir/name.jpg` → `dir/thumb-name.jpg`. */
export function thumbnailPath(path: string) {
  const slash = path.lastIndexOf("/");
  return `${path.slice(0, slash + 1)}thumb-${path.slice(slash + 1)}`;
}
