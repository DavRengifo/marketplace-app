"use client";

import { useEffect, useState } from "react";
import { ActivityCard } from "@/components/ActivityCard";
import { FiltersBar } from "@/components/FiltersBar";
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

const heroDestinations = [
  {
    kicker: "Curated picks",
    title: "Experiences for every kind of traveler",
    copy: "Coastal adventures, food-led discoveries, cultural visits, and slower escapes in one place.",
  },
  {
    kicker: "Global mix",
    title: "From city icons to offbeat local moments",
    copy: "The catalog now feels broader, more realistic, and more aligned with a real discovery marketplace.",
  },
  {
    kicker: "Ready to scale",
    title: "A stronger base for detail pages, maps, and user accounts",
    copy: "The UI stays polished while making room for richer data and real product flows.",
  },
];

export default function Home() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);

  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [sort, setSort] = useState("popular");
  const [page, setPage] = useState(1);

  const [favorites, setFavorites] = useState<number[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [booked, setBooked] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleFavorite = (id: number) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((favoriteId) => favoriteId !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    const stored = localStorage.getItem("favorites");
    if (stored) {
      setFavorites(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }, [favorites]);

  const handleBooking = async (id: number) => {
    setBooked((prev) => (prev.includes(id) ? prev : [...prev, id]));

    try {
      const response = await fetch(`/api/activities/${id}/book`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Booking failed");
      }

      setActivities((current) =>
        current.map((activity) =>
          activity.id === id
            ? { ...activity, bookingCount: activity.bookingCount + 1 }
            : activity
        )
      );
    } catch (error) {
      console.error("Booking error", error);
      setBooked((prev) => prev.filter((bookedId) => bookedId !== id));
    }
  };

  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);

      try {
        const params = new URLSearchParams({
          category,
          location,
          sort,
          page: String(page),
          limit: "6",
        });

        const response = await fetch(`/api/activities?${params.toString()}`);

        if (!response.ok) {
          throw new Error("API error");
        }

        const data = await response.json();
        setActivities(data.results);
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [category, location, sort, page]);

  useEffect(() => {
    setPage(1);
  }, [category, location, sort]);

  useEffect(() => {
    fetch("/api/filters")
      .then((response) => response.json())
      .then((data) => {
        setCategories(data.categories);
        setLocations(data.locations);
      })
      .catch((error) => {
        console.error("Filters fetch error:", error);
      });
  }, []);

  const filteredActivities = showFavorites
    ? activities.filter((activity) => favorites.includes(activity.id))
    : activities;

  const favoriteCount = favorites.length;
  const trendingActivities = [...activities]
    .filter((activity) => activity.bookingCount > 0)
    .sort((left, right) => right.bookingCount - left.bookingCount)
    .slice(0, 3);

  return (
    <main className="relative overflow-hidden">
      <div className="page-shell">
        <section className="hero-panel fade-in">
          <div className="hero-copy">
            <p className="eyebrow">Curated experiences worldwide</p>
            <h1 className="hero-title">Discover memorable activities for every kind of trip.</h1>
            <p className="hero-description">
              Browse a more varied collection of outdoor adventures, culinary workshops,
              cultural tours, and destination highlights across Europe and beyond.
            </p>

            <div className="hero-actions">
              <a href="#explore" className="btn-primary">
                Explore experiences
              </a>
              <a href="#trending" className="btn-secondary">
                See trending picks
              </a>
            </div>

            <div className="hero-stats" aria-label="Marketplace highlights">
              <div>
                <span>{activities.length || 6}+</span>
                Curated activities
              </div>
              <div>
                <span>{locations.length || 5}</span>
                Destinations available
              </div>
              <div>
                <span>{favoriteCount}</span>
                Saved by the visitor
              </div>
            </div>
          </div>

          <div className="hero-collection">
            {heroDestinations.map((highlight) => (
              <article key={highlight.title} className="collection-card">
                <p>{highlight.kicker}</p>
                <h2>{highlight.title}</h2>
                <span>{highlight.copy}</span>
              </article>
            ))}
          </div>
        </section>

        <section id="trending" className="section-block fade-in">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Trending now</p>
              <h2>Most booked experiences this week</h2>
            </div>
            <p>Popular picks surface quickly so visitors can spot the experiences people are booking most.</p>
          </div>

          <div className="trending-strip">
            {trendingActivities.map((activity, index) => {
              const imageSrc = activity.imageUrl ?? "/activities/biarritz-surf-session.jpg";

              return (
                <Link
                  key={activity.id}
                  href={`/activity/${activity.id}`}
                  className="trending-card"
                  style={{ backgroundImage: `linear-gradient(180deg, rgba(19, 18, 16, 0.08) 0%, rgba(19, 18, 16, 0.74) 100%), url("${imageSrc}")` }}
                >
                  <div className="trending-rank">0{index + 1}</div>
                  <div className="trending-content">
                    <span>{activity.location}</span>
                    <h3>{activity.title}</h3>
                    <p>
                      {activity.bookingCount} bookings this week • {activity.category}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section id="explore" className="section-block">
          <div className="section-heading section-heading-tight">
            <div>
              <p className="eyebrow">Explore</p>
              <h2>Explore experiences</h2>
            </div>

            <button
              type="button"
              onClick={() => setShowFavorites((prev) => !prev)}
              className={showFavorites ? "btn-primary" : "btn-secondary"}
              aria-pressed={showFavorites}
            >
              {showFavorites ? "Show all experiences" : "Show ❤️ only"}
            </button>
          </div>

          <FiltersBar
            category={category}
            categories={categories}
            location={location}
            locations={locations}
            sort={sort}
            onCategoryChange={setCategory}
            onLocationChange={setLocation}
            onSortChange={setSort}
          />

          {loading ? (
            <div className="activities-grid" aria-label="Loading activities">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="skeleton-card">
                  <div className="skeleton-media" />
                  <div className="skeleton-line skeleton-line-wide" />
                  <div className="skeleton-line skeleton-line-medium" />
                  <div className="skeleton-line skeleton-line-short" />
                </div>
              ))}
            </div>
          ) : filteredActivities.length > 0 ? (
            <div className="activities-grid">
              {filteredActivities.map((activity) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  isBooked={booked.includes(activity.id)}
                  isFavorite={favorites.includes(activity.id)}
                  onBook={() => handleBooking(activity.id)}
                  onToggleFavorite={() => toggleFavorite(activity.id)}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p className="eyebrow">No match right now</p>
              <h3>No experience matches the current filters.</h3>
              <p>
                Try another destination or category to see more of the catalog.
              </p>
            </div>
          )}

          <div className="pagination-bar">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(current - 1, 1))}
              className="btn-secondary"
            >
              Previous
            </button>
            <span>Page {page}</span>
            <button
              type="button"
              onClick={() => setPage((current) => current + 1)}
              className="btn-secondary"
            >
              Next
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
