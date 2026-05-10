import Image from "next/image";
import Link from "next/link";

type Activity = {
  id: number;
  title: string;
  description: string;
  price: number;
  location: string;
  category: string;
  imageUrl?: string | null;
  bookingCount: number;
};

type ActivityCardProps = {
  activity: Activity;
  isFavorite: boolean;
  onToggleFavorite: () => void;
};

export function ActivityCard({
  activity,
  isFavorite,
  onToggleFavorite,
}: ActivityCardProps) {
  const imageSrc = activity.imageUrl ?? "/activities/biarritz-surf-session.jpg";

  return (
    <article className="activity-card fade-in">
      <Link
        href={`/activity/${activity.id}`}
        className="activity-media-link"
        aria-label={`View details for ${activity.title}`}
      >
        <div className="activity-media">
          <Image
            src={imageSrc}
            alt={activity.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="activity-image"
          />

          <div className="activity-overlay" />

          <div className="activity-topline">
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                onToggleFavorite();
              }}
              className={`favorite-button ${isFavorite ? "favorite-button-active" : ""}`}
              aria-label={
                isFavorite
                  ? `Remove ${activity.title} from favorites`
                  : `Add ${activity.title} to favorites`
              }
            >
              {isFavorite ? "♥" : "♡"}
            </button>
          </div>

          <div className="activity-summary">
            <h3>{activity.title}</h3>
          </div>
        </div>
      </Link>

      <div className="activity-body">
        <div className="activity-meta">
          <span className="category-pill">{activity.category}</span>
          <span className="booking-pill">{activity.location}</span>
          {activity.bookingCount > 5 ? (
            <span className="trending-pill">🔥 Trending</span>
          ) : null}
        </div>

        <p className="activity-description">{activity.description}</p>

        <div className="activity-footer">
          <div>
            <p className="price-caption">Starting from</p>
            <p className="activity-price">{activity.price.toFixed(2)}€</p>
          </div>

          <Link
            href={`/activity/${activity.id}`}
            className="btn-primary"
          >
            View & Book
          </Link>
        </div>
      </div>
    </article>
  );
}
