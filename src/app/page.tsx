"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Idea = {
  id: string;
  title: string;
  description: string;
  author_nickname: string;
  created_at: string;
  votes: { id: string; voter_id: string }[];
};

export default function Home() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [nickname, setNickname] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [voterId, setVoterId] = useState("");

  useEffect(() => {
    let id = localStorage.getItem("idea_board_voter_id");

    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("idea_board_voter_id", id);
    }

    setVoterId(id);
    loadIdeas();
  }, []);

  async function loadIdeas() {
    const { data, error } = await supabase
      .from("ideas")
      .select(`
        id,
        title,
        description,
        author_nickname,
        created_at,
        votes (
          id,
          voter_id
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load ideas:", error);
    } else {
      setIdeas(data || []);
    }

    setLoading(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    const { error } = await supabase.from("ideas").insert({
      title,
      description,
      author_nickname: nickname,
    });

    if (error) {
      alert(error.message);
      setSubmitting(false);
      return;
    }

    setTitle("");
    setDescription("");
    setNickname("");

    await loadIdeas();
    setSubmitting(false);
  }

  async function handleVote(ideaId: string) {
    if (!voterId) return;

    const { error } = await supabase.from("votes").insert({
      idea_id: ideaId,
      voter_id: voterId,
    });

    if (error) {
      if (error.code === "23505") {
        alert("You already voted for this idea.");
      } else {
        alert(error.message);
      }

      return;
    }

    await loadIdeas();
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-8 text-4xl font-bold">💡 Idea Board</h1>

        <form
          onSubmit={handleSubmit}
          className="mb-10 space-y-4 rounded-xl border bg-white p-6 shadow-sm"
        >
          <h2 className="text-2xl font-semibold">Submit an Idea</h2>

          <input
            type="text"
            placeholder="Idea title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={120}
            className="w-full rounded-lg border p-3"
          />

          <textarea
            placeholder="Describe your idea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            maxLength={1000}
            rows={4}
            className="w-full rounded-lg border p-3"
          />

          <input
            type="text"
            placeholder="Your nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            required
            maxLength={40}
            className="w-full rounded-lg border p-3"
          />

          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-black px-5 py-3 text-white disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Idea"}
          </button>
        </form>

        {loading && <p>Loading...</p>}

        {!loading && ideas.length === 0 && (
          <p className="text-gray-500">No ideas yet.</p>
        )}

        <div className="space-y-4">
          {ideas.map((idea) => {
            const alreadyVoted = idea.votes?.some(
              (vote) => vote.voter_id === voterId
            );

            return (
              <div
                key={idea.id}
                className="rounded-xl border bg-white p-5 shadow-sm"
              >
                <h2 className="text-xl font-semibold">{idea.title}</h2>

                <p className="mt-2 text-gray-700">
                  {idea.description}
                </p>

                <p className="mt-3 text-sm text-gray-500">
                  by {idea.author_nickname}
                </p>

                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={() => handleVote(idea.id)}
                    disabled={alreadyVoted}
                    className="rounded-lg bg-black px-4 py-2 text-white disabled:bg-gray-300"
                  >
                    {alreadyVoted ? "Voted ✓" : "▲ Vote"}
                  </button>

                  <span className="font-medium">
                    {idea.votes?.length || 0} votes
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}