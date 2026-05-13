import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

export async function GET() {
    const version = (await redis.get<string>("activities:version")) || "1";
    const cacheKey = `filters:version:${version}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
        return Response.json(cached);
    }

    const [locations, categories] = await Promise.all ([
        prisma.activity.findMany({
            select: { location: true },
            distinct: ["location"],
        }),
        prisma.activity.findMany({
            select: { category: true },
            distinct: ["category"],
        })
    ]);

    const response = {
        locations: locations.map((l) => l.location),
        categories: categories.map((c) => c.category),
    };

    await redis.set(cacheKey, response, { ex: 60 * 60 });

    return Response.json(response);
}
