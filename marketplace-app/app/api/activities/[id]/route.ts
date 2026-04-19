import { prisma } from "@/lib/prisma";

export async function GET(
    req: Request,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;

    const activity = await prisma.activity.findUnique({
        where: { id: Number(id) },
    });

    if (!activity) {
        return Response.json({ error: "Activity not found" }, { status: 404 });
    }

    return Response.json({
        ...activity,
        price: Number(activity.price),
    });
}