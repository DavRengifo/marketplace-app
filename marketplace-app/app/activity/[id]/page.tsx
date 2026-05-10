import Link from "next/link";
import { notFound } from "next/navigation";
import { ActivityDetailActions } from "@/components/ActivityDetailActions";
import { prisma } from "@/lib/prisma";

type Activity = {
  id: number;
  title: string;
  description: string;
  price: number;
  location: string;
  category: string;
  imageUrl?: string | null;
  bookingCount: number;
  duration?: string | null;
  meetingPoint?: string | null;
  language?: string | null;
  included?: string | null;
  cancellation?: string | null;
  bestFor?: string | null;
};

async function getActivity(id: string): Promise<Activity | null> {
  const activity = await prisma.activity.findUnique({
    where: { id: Number(id) },
  });

  if (!activity) {
    return null;
  }

  return {
    ...activity,
    price: Number(activity.price),
  };
}

export default async function ActivityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const activity = await getActivity(id);

  if (!activity) {
    notFound();
  }
  const imageSrc = activity.imageUrl ?? "/activities/biarritz-surf-session.jpg";

    return (
        <main className="page-shell">
            <section className="activity-detail-page">
                <div className="activity-detail-header">
                    <Link href="/" className="btn-secondary">
                        &larr; Back to Activities   
                    </Link>

                    <div>
                        <p className="eyebrow">{activity.location}</p>
                        <h1 className="activity-detail-title">{activity.title}</h1>
                        <p className="activity-detail-subtitle">
                            {activity.category} • {activity.bookingCount} bookings
                        </p>
                    </div>
                </div>
                
                <div className="activity-detail-hero">
                    <div
                        className="activity-detail-visual"
                        style={{
                            backgroundImage: `linear-gradient(180deg, rgba(19,18,16, 0.08) 0%, rgba(19,18,16, 0.62) 100%), url(${imageSrc})`,
                        }}
                    >
                        <span className="activity-tag">{activity.location}</span>
                    </div>

                    <ActivityDetailActions
                        activityId={activity.id}
                        location={activity.location}
                        category={activity.category}
                        price={activity.price}
                        initialBookingCount={activity.bookingCount}
                    />
                </div>

                <div className="activity-detail-content">
                    <section className="detail-copy-card">
                        <p className="eyebrow">About</p>
                        <h2>What this experience feels like</h2>
                        <p>{activity.description}</p>
                        <p>
                            Expect a carefully paced experience with a strong sense of place,
                            clear host guidance, and enough flexibility to suit first-timers as
                            well as more experienced travelers.
                        </p>
                    </section>

                    <section className="detail-copy-card">
                        <p className="eyebrow">Practical information</p>
                        <h2>Before you book</h2>
                        <div className="practical-list">
                            <p><strong>Duration:</strong> {activity.duration ?? "Shared after booking"}</p>
                            <p><strong>Meeting point:</strong> {activity.meetingPoint ?? "Shared after booking"}</p>
                            <p><strong>Language:</strong> {activity.language ?? "To be confirmed"}</p>
                            <p><strong>Included:</strong> {activity.included ?? "See booking details"}</p>
                            <p><strong>Cancellation:</strong> {activity.cancellation ?? "Policy shared before payment"}</p>
                            <p><strong>Best for:</strong> {activity.bestFor ?? "Flexible travel profiles"}</p>
                        </div>
                    </section>
                </div>
            </section>
        </main>
    );
}
