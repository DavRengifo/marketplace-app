import { prisma } from "@/lib/prisma";

export async function GET() {
    const locations = await prisma.activity.findMany({
        select: {
            location: true,
        },
        distinct: ["location"],
    });

    const categories = await prisma.activity.findMany({
        select: {
            category: true,
        },
        distinct: ["category"],
    });

    return Response.json({
        locations: locations.map((l) => l.location),
        categories: categories.map((c) => c.category),
    });
}
