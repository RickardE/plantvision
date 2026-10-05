import type { Database } from "./database.types";

type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"];
export type Enums<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T];

export type AppRole = Enums<"app_role">;
export type ProductStatus = Enums<"product_status">;
export type CategoryKind = Enums<"category_kind">;
export type LightRequirement = Enums<"light_requirement">;
export type VisualizationStatus = Enums<"visualization_status">;
