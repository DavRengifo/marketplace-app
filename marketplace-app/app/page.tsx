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

  useEffect(() => {
    const url = `/api/activities?category=${category}&location=${location}&sort=${sort}`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setActivities(data.results);
      });
  }, [category, location, sort]);

  useEffect(() => {
  fetch("/api/filters")
    .then((res) => res.json())
    .then((data) => {
      setCategories(data.categories);
      setLocations(data.locations);
    });
  }, []);

  return (
    <main className="p-10">
      <h1 className="text-2xl font-bold mb-6">Marketplace</h1>

      {/* FILTERS */}
      <div className="flex gap-4 mb-6">
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

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {activities.map((activity) => (
          <div key={activity.id} className="border p-4 rounded">
            <h2 className="font-semibold">{activity.title}</h2>
            <p>{activity.location}</p>
            <p>{activity.category}</p>
            <p>{activity.description}</p>
            <p className="text-lg font-bold">
              {Number(activity.price).toFixed(2)}€
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}