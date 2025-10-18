// import AdminJS from "adminjs";
// import AdminJSExpress from "@adminjs/express";
// import { Database, Resource } from "@adminjs/prisma";
// import { PrismaClient } from "@prisma/client";
//
//
// // Register the Prisma adapter BEFORE anything else
// AdminJS.registerAdapter({ Database, Resource });
//
// const prisma = new PrismaClient();
//
//
// const adminJs = new AdminJS({
//     rootPath: "/admin",
//     branding: {
//         companyName: "MetaSmartPort",
//         logo: false,
//         theme: { colors: { primary100: "#57c7ff" } },
//     },
//     resources: [
//         { resource: { model: prisma.user, client: prisma }, options: {} },
//         { resource: { model: prisma.smartAccount, client: prisma }, options: {} },
//         { resource: { model: prisma.portfolio, client: prisma }, options: {} },
//         { resource: { model: prisma.portfolioAllocation, client: prisma }, options: {} },
//         { resource: { model: prisma.token, client: prisma }, options: {} },
//         { resource: { model: prisma.rebalanceLog, client: prisma }, options: {} },
//         { resource: { model: prisma.contractConfig, client: prisma }, options: {} },
//         { resource: { model: prisma.delegation, client: prisma }, options: {} },
//     ],
// });
//
// const adminRouter = AdminJSExpress.buildRouter(adminJs);
//
// export { adminJs, adminRouter };
