"use client";

import { useEffect, useState } from "react";
import { ActivityCard } from "@/components/ActivityCard";
import { FiltersBar } from "@/components/FiltersBar";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useSession, signIn } from "next-auth/react";

type Activity = {
  id: number;
  title: string;
  description: string;
  price: number;
  location: string;
  category: string;
  imageUrl?: string | null;
  bookingCount: number;
  latitude?: number | null;
  longitude?: number | null;
};

const ActivityMap = dynamic(() => import("@/components/Map"), { ssr: false });

export default function Home() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [mapActivities, setMapActivities] = useState<Activity[]>([]);

  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [sort, setSort] = useState("popular");
  const [page, setPage] = useState(1);

  const [favorites, setFavorites] = useState<number[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [loading, setLoading] = useState(false);

  const { data: session } = useSession();

  const toggleFavorite = (id: number) => {
    if (!session) {
      signIn("github");
      return;
    }

    const isFavorite = favorites.includes(id);

    setFavorites((prev) =>
      isFavorite? prev.filter((favoriteId) => favoriteId !== id) : [...prev, id]
    );

    fetch("/api/favorites", {
      method: isFavorite? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activityId: id }),
    }).catch((error) => {
      console.error("Favorite toggle error:", error);
      setFavorites((prev) =>
        isFavorite? [...prev, id] : prev.filter((favoriteId) => favoriteId !== id)
      );
    });
  };

  useEffect(() => {
    if (!session) {
      setFavorites([]);
      return;
    }
    fetch("/api/favorites")
    .then((response) => response.json())
    .then((ids) => {
      if (Array.isArray(ids)) {
        setFavorites(ids);
      }
    })
    .catch((error) => {
      console.error("Favorites fetch error:", error);
    });
  }, [session]);

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

  useEffect(() => {
    fetch("/api/activities?limit=100")
      .then((response) => response.json())
      .then((data) => {
        setMapActivities(data.results);
      })
      .catch((error) => {
        console.error("Map activities fetch error:", error);
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

        <section className="section-block fade-in">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Explore by location</p>
              <h2>Find experiences on the map</h2>
            </div>
            <p>Click any marker to discover the activity.</p>
          </div>
          <ActivityMap activities={mapActivities} />
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
                  isFavorite={favorites.includes(activity.id)}
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
