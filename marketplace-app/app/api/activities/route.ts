import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 10;

  const category = searchParams.get("category");
  const location = searchParams.get("location");
  const sort = searchParams.get("sort");

  const skip = (page - 1) * limit;

  // Get cache version of the data if exists
  const version = (await redis.get("activities:version")) || "1";

  // Caching with Redis : create UNIQUE cache key and checking if we have cached data for this key.
  const cacheKey = `activities:v${version}:${page}:${limit}:${category}:${location}:${sort}`;
  const cached = await redis.get(cacheKey);

  if (cached) {
    console.log("CACHE HIT");
    return Response.json(JSON.parse(cached));
    }

    console.log("CACHE MISS");

  // Filters
  type WhereClause = {
  category?: { in: string[] };
  location?: string;
};

    const where: WhereClause = {};
  
  if (category) {
    where.category = {
        in: category.split(","),
    };
    }

  if (location) {
    where.location = location;
  }

  // Sorting
  type OrderBy = {
    price?: "asc" | "desc";
    bookingCount?: "asc" | "desc";
    createdAt?: "asc" | "desc";
    };
    
    const orderBy: OrderBy = {};

  if (sort === "price_asc") {
    orderBy.price = "asc";
  } else if (sort === "price_desc") {
    orderBy.price = "desc";
  } else if (sort === "popular") {
    orderBy.bookingCount = "desc";
  } else {
    orderBy.createdAt = "desc"; // default
  }

  const activities = await prisma.activity.findMany({
    where,
    orderBy,
    skip,
    take: limit,
  });
    
  // mapping Decimal → number
  const formatted = activities.map((a) => ({
    ...a,
    price: Number(a.price),
  }));

  const response = {
    page,
    limit,
    results: formatted,
  };

  // Save cache for 60 seconds
  await redis.set(cacheKey, JSON.stringify(response), "EX", 60);

  return Response.json(response);
}


export async function POST() {
    await prisma.activity.createMany({
        data: [
            {
                title: "Surf lesson",
                description: "Learn surf",
                price: 50,
                location: "Biarritz",
                category: "sport",
            },
            {
                title: "City tour",
                description: "Visit Paris",
                price: 30,
                location: "Paris",
                category: "tour",
            },
            {
                title: "Boat trip",
                description: "Nice boat",
                price: 100,
                location: "Nice",
                category: "boat",
            },
            {
                title: "Yoga retreat",
                description: "Relax",
                price: 80,
                location: "Bali",
                category: "wellness",
            },
            {
                title: "City tour",
                description: "Visit London",
                price: 35,
                location: "London",
                category: "tour",
            },
            {
                title: "Boat trip",
                description: "Marseille boat",
                price: 75,
                location: "Marseille",
                category: "boat",
            },
            {
                title: "Cooking lesson",
                description: "Learn to cook french pastry",
                price: 65,
                location: "Paris",
                category: "cooking",
            },
        ],
    });

    // Invalidate cache by incrementing version
    await redis.incr("activities:version");
    
    return Response.json({ message: "seeded" });
}