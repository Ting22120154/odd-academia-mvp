import { jsonError, jsonOk } from "@/lib/api/response";
import { listPaperRoutes } from "@/modules/papers/paper-route.service";

/** GET /api/papers/routes — map mock route ids (`1`, `2`, …) to Neon paper UUIDs */
export async function GET() {
  try {
    const routes = await listPaperRoutes();
    return jsonOk({ routes });
  } catch {
    return jsonError("Failed to load paper routes", 500);
  }
}
