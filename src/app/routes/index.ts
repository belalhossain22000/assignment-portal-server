import express from "express";
import { userRoutes } from "../modules/User/user.route";
import { AuthRoutes } from "../modules/Auth/auth.routes";
import { ImageRoutes } from "../modules/Image/Image.routes";
import { assignmentRoutes } from "../modules/Assignment/Assignment.route";


const router = express.Router();

const moduleRoutes = [
  {
    path: "/users",
    route: userRoutes,
  },
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/images",
    route: ImageRoutes,
  },
  {
    path: "/assignments",
    route: assignmentRoutes,
  },

];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
