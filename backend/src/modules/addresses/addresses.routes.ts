import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { validate } from "../../middleware/validate";
import { addressIdParamSchema, createAddressSchema, updateAddressSchema } from "./addresses.schema";
import * as addressesController from "./addresses.controller";

export const addressesRouter = Router();

addressesRouter.use(authenticate);

addressesRouter.get("/", addressesController.list);
addressesRouter.post("/", validate({ body: createAddressSchema }), addressesController.create);
addressesRouter.patch("/:id", validate({ params: addressIdParamSchema, body: updateAddressSchema }), addressesController.update);
addressesRouter.delete("/:id", validate({ params: addressIdParamSchema }), addressesController.remove);
addressesRouter.patch("/:id/default", validate({ params: addressIdParamSchema }), addressesController.setDefault);
