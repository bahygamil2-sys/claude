import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../middleware/asyncHandler";
import * as restaurantsService from "../restaurants/restaurants.service";
import {
  createMenuCategorySchema,
  createMenuItemSchema,
  menuCategoryParamSchema,
  menuItemParamSchema,
  restaurantIdParamSchema,
  setAvailabilitySchema,
  updateMenuCategorySchema,
  updateMenuItemSchema,
} from "./menu.schema";
import * as menuController from "./menu.controller";

// Mounted at /restaurants/:id in restaurants.routes.ts (mergeParams so :id is visible here).
export const menuRouter = Router({ mergeParams: true });

const requireOwnership = asyncHandler(async (req, _res, next) => {
  await restaurantsService.getOwnedOrThrow(req.params.id, req.user!);
  next();
});

menuRouter.use(authenticate, validate({ params: restaurantIdParamSchema }), requireOwnership);

menuRouter.get("/menu-categories", menuController.listCategories);
menuRouter.post("/menu-categories", validate({ body: createMenuCategorySchema }), menuController.createCategory);
menuRouter.patch(
  "/menu-categories/:categoryId",
  validate({ params: menuCategoryParamSchema, body: updateMenuCategorySchema }),
  menuController.updateCategory
);
menuRouter.delete(
  "/menu-categories/:categoryId",
  validate({ params: menuCategoryParamSchema }),
  menuController.deleteCategory
);

menuRouter.post("/menu-items", validate({ body: createMenuItemSchema }), menuController.createItem);
menuRouter.patch(
  "/menu-items/:itemId",
  validate({ params: menuItemParamSchema, body: updateMenuItemSchema }),
  menuController.updateItem
);
menuRouter.delete("/menu-items/:itemId", validate({ params: menuItemParamSchema }), menuController.deleteItem);
menuRouter.patch(
  "/menu-items/:itemId/availability",
  validate({ params: menuItemParamSchema, body: setAvailabilitySchema }),
  menuController.setAvailability
);
