import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import seedActivities from "@/lib/seed-activities.json";
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
  const version = (await redis.get<string>("activities:version")) || "1";

  // Caching with Redis : create UNIQUE cache key and checking if we have cached data for this key.
  const cacheKey = `activities:v${version}:${page}:${limit}:${category}:${location}:${sort}`;
  const cached = await redis.get(cacheKey);

  if (cached) {
    return Response.json(cached);
  }

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
  await redis.set(cacheKey, response, { ex: 60 });

  return Response.json(response);
}


export async function POST(req: NextRequest) {
    const adminKey = req.headers.get("x-admin-key");
    if (adminKey !== process.env.ADMIN_SEED_KEY) {
        return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    await prisma.activity.deleteMany();

    await prisma.activity.createMany({
      data: seedActivities,
    });

    // Increment version on any write to invalidate all cached pages atomically
    await redis.incr("activities:version");

    return Response.json({ message: "database reset and seeded" });
}
