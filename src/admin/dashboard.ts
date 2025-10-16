// admin/dashboard.js
import AdminJS from "adminjs";
import AdminJSExpress from "@adminjs/express";
import * as AdminJSPrisma from '@adminjs/prisma';
import { PrismaClient } from '@prisma/client';

// Register Prisma adapter
AdminJS.registerAdapter({
    Resource: AdminJSPrisma.Resource,
    Database: AdminJSPrisma.Database,
});

const prisma = new PrismaClient();

const adminJs = new AdminJS({
    rootPath: "/admin",
    branding: {
        companyName: "MetaSmartPort",
        logo: false,
        theme: {
            colors: {
                primary100: "#57c7ff",
                primary80: "#4ab3e6",
                primary60: "#3d9fcc",
                primary40: "#2f8bb3",
                primary20: "#227799",
                accent: "#ff6b6b",
                love: "#e74c3c",
                grey100: "#2c2c2c",
                grey80: "#3a3a3a",
                grey60: "#4a4a4a",
                grey40: "#6a6a6a",
                grey20: "#9a9a9a",
                filterBg: "#2c2c2c",
                bg: "#1e1e1e",
                hoverBg: "#2c2c2c",
                border: "#3a3a3a",
                defaultText: "#f8f8f2",
                success: "#4caf50",
                successBorder: "#66bb6a",
                error: "#f44336",
                errorBorder: "#e57373",
                warning: "#ff9800",
                warningBorder: "#ffb74d",
                info: "#2196f3",
                infoBorder: "#64b5f6",
            },
        },
    },
    resources: [
        {
            resource: { model: prisma.user, client: prisma },
            options: {
                navigation: {
                    name: 'User Management',
                    icon: 'User',
                },
                properties: {
                    id: {
                        isVisible: { list: true, filter: true, show: true, edit: false },
                    },
                    password: {
                        isVisible: { list: false, filter: false, show: false, edit: true },
                        type: 'password',
                    },
                    createdAt: {
                        isVisible: { list: true, filter: true, show: true, edit: false },
                    },
                    updatedAt: {
                        isVisible: { list: false, filter: false, show: true, edit: false },
                    },
                },
                actions: {
                    new: {
                        isAccessible: true, // Your JWT middleware already ensures only admins reach here
                    },
                    delete: {
                        isAccessible: true,
                    },
                },
            },
        },
        {
            resource: { model: prisma.smartAccount, client: prisma },
            options: {
                navigation: {
                    name: 'Blockchain',
                    icon: 'Wallet',
                },
                properties: {
                    id: {
                        isVisible: { list: true, filter: true, show: true, edit: false },
                    },
                    createdAt: {
                        isVisible: { list: true, filter: true, show: true, edit: false },
                    },
                },
            },
        },
        {
            resource: { model: prisma.portfolio, client: prisma },
            options: {
                navigation: {
                    name: 'Portfolio Management',
                    icon: 'PieChart',
                },
                properties: {
                    id: {
                        isVisible: { list: true, filter: true, show: true, edit: false },
                    },
                },
            },
        },
        {
            resource: { model: prisma.portfolioAllocation, client: prisma },
            options: {
                navigation: {
                    name: 'Portfolio Management',
                    icon: 'Layers',
                },
            },
        },
        {
            resource: { model: prisma.token, client: prisma },
            options: {
                navigation: {
                    name: 'Assets',
                    icon: 'Coins',
                },
                properties: {
                    id: {
                        isVisible: { list: true, filter: true, show: true, edit: false },
                    },
                },
            },
        },
        {
            resource: { model: prisma.rebalanceLog, client: prisma },
            options: {
                navigation: {
                    name: 'Operations',
                    icon: 'Activity',
                },
                actions: {
                    new: {
                        isAccessible: false,
                    },
                    edit: {
                        isAccessible: false,
                    },
                    delete: {
                        isAccessible: true, // Your JWT middleware handles admin check
                    },
                },
            },
        },
        {
            resource: { model: prisma.contractConfig, client: prisma },
            options: {
                navigation: {
                    name: 'Configuration',
                    icon: 'Settings',
                },
                actions: {
                    delete: {
                        isAccessible: false,
                    },
                },
            },
        },
        {
            resource: { model: prisma.delegation, client: prisma },
            options: {
                navigation: {
                    name: 'Blockchain',
                    icon: 'Key',
                },
            },
        },
    ],
});

// Build the router with **no internal authentication**
// Your custom auth middleware will handle authentication
const adminRouter = AdminJSExpress.buildRouter(adminJs);

export { adminJs, adminRouter };