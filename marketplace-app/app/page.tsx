"use client";

import { useEffect, useState } from "react";

type Activity = {
  id: number;
  title: string;
  description: string;
  price: number;
  location: string;
  category: string;
};

export default function Home() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);

  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [sort, setSort] = useState("");
  const [page, setPage] = useState(1);

  const [favorites, setFavorites] = useState<number[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);

  const [booked, setBooked] = useState<number[]>([]);

  const [loading, setLoading] = useState(false);

  // Favorites toggle
  const toggleFavorite = (id: number) => {
    setFavorites((prev) =>
      prev.includes(id)
        ? prev.filter((f) => f !== id)
        : [...prev, id]
    );
  };

  // booking action
  const handleBooking = async (id: number) => {
    // instantaneous UI feedback
    setBooked((prev) =>
      prev.includes(id)
        ? prev.filter((b) => b !== id)
        : [...prev, id]
    );

    try {
      await fetch(`/api/activities/${id}/book`, {
        method: "POST",
      });
    } catch (err) {
      console.error("Booking error", err);

      // rollback
      setBooked((prev) =>
        prev.includes(id)
          ? prev.filter((b) => b !== id)
          : [...prev, id]
      );
    }
  };

  // Fetch activities with loading state and error handling
  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);

      try {
        const url = `/api/activities?category=${category}&location=${location}&sort=${sort}&page=${page}&limit=6`;

        const res = await fetch(url);

        if (!res.ok) throw new Error("API error");

        const data = await res.json();
        setActivities(data.results);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [category, location, sort, page]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [category, location, sort]);

  // Fetch filter options
  useEffect(() => {
  fetch("/api/filters")
    .then((res) => res.json())
    .then((data) => {
      setCategories(data.categories);
      setLocations(data.locations);
    });
  }, []);

  // favorites filtering
  const filteredActivities = showFavorites
    ? activities.filter((a) => favorites.includes(a.id))
    : activities;

  return (
    <main className="p-10">
      <h1 className="text-2xl font-bold mb-6">Marketplace</h1>

      {/* TOGGLE FAVORITES */}
      <button
        onClick={() => setShowFavorites((prev) => !prev)}
        className="border px-4 py-2 rounded mb-4"
      >
        {showFavorites ? "Show all" : "Show favorites ❤️"}
      </button>

      {/* FILTERS */}
      <div className="flex gap-4 mb-6 flex-wrap">
        <select onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select onChange={(e) => setLocation(e.target.value)}>
        <option value="">All locations</option>
        {locations.map((l) => (
          <option key={l} value={l}>
            {l}
          </option>
        ))}
        </select>

        <select onChange={(e) => setSort(e.target.value)}>
          <option value="">Default</option>
          <option value="price_asc">Price ↑</option>
          <option value="price_desc">Price ↓</option>
          <option value="popular">Popular</option>
        </select>
      </div>

      {/* LOADING */}
      {loading && <p>Loading...</p>}

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {filteredActivities.map((activity) => (
          <div key={activity.id} className="border rounded-xl p-4 shadow-sm hover:shadow-md hover:-translate-y-1 transition">

            {/* IMAGE PLACEHOLDER */}
            <div className="h-40 bg-gray-200 rounded mb-3"></div>

            {/* FAVORITE */}
            <button onClick={() => toggleFavorite(activity.id)}>
              {favorites.includes(activity.id) ? "❤️" : "🤍"}
            </button>

            <h2 className="font-semibold text-lg">{activity.title}</h2>
            <p className="text-sm text-gray-500">{activity.location}</p>
            <p className="text-xs bg-gray-100 inline-block px-2 py-1 rounded mt-1">{activity.category}</p>
            <p className="mt-2 text-sm">{activity.description}</p>
            <p className="mt-4 text-lg font-bold">
              {Number(activity.price).toFixed(2)}€
            </p>

            {/* BOOK BUTTON */}
            <button
              onClick={() => handleBooking(activity.id)}
              className={`mt-3 w-full py-2 rounded transition ${
                booked.includes(activity.id)
                  ? "bg-green-600 text-white"
                  : "bg-black text-white hover:bg-gray-800"
              }`}
            >
              {booked.includes(activity.id) ? "Booked ✅" : "Book now"}
            </button>

          </div>
        ))}
      </div>

      {/* PAGINATION */}
      <div className="flex gap-4 mt-6 items-center">
        <button
          onClick={() => setPage((p) => Math.max(p - 1, 1))}
          className="border px-4 py-2 rounded"
        >
          Previous
        </button>

        <span>Page {page}</span>

        <button
          onClick={() => setPage((p) => p + 1)}
          className="border px-4 py-2 rounded"
        >
          Next
        </button>
      </div>
    </main>
  );
}