import { Router } from "express";
import { adminAuthRouter } from "../modules/adminAuth/adminAuth.routes";
import { brandAuthRouter } from "../modules/brandAuth/brandAuth.routes";
import { brandsRouter } from "../modules/brands/brands.routes";
import { branchesRouter } from "../modules/branches/branches.routes";
import { brandUsersRouter } from "../modules/brandUsers/brandUsers.routes";
import { adminBrandsRouter } from "../modules/adminBrands/adminBrands.routes";
import { surveysRouter } from "../modules/surveys/surveys.routes";
import { publicSurveysRouter } from "../modules/public/publicSurveys.routes";

export const v1Router = Router();

v1Router.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "rai-api", time: new Date().toISOString() });
});

v1Router.use("/admin/auth", adminAuthRouter);
v1Router.use("/brand/auth", brandAuthRouter);
v1Router.use("/brand", brandsRouter);
v1Router.use("/branches", branchesRouter);
v1Router.use("/brand-users", brandUsersRouter);
v1Router.use("/admin/brands", adminBrandsRouter);
v1Router.use("/surveys", surveysRouter);
v1Router.use("/public", publicSurveysRouter);

// Added in later phases:
//   v1Router.use("/admin/reports", adminReportsRouter);
