import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../middleware/asyncHandler";
import { validate } from "../../middleware/validate";
import * as reviewsService from "./reviews.service";

// Mounted at /restaurants/:id/reviews (mergeParams so :id is visible here).
export const reviewsRouter = Router({ mergeParams: true });

const queryStringSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).optional().default(20),
});

reviewsRouter.get(
  "/",
  validate({ query: queryStringSchema }),
  asyncHandler(async (req, res) => {
    const { page, pageSize } = req.query as unknown as z.infer<typeof queryStringSchema>;
    const result = await reviewsService.listByRestaurant(req.params.id, page, pageSize);
    res.status(200).json(result);
  })
);
