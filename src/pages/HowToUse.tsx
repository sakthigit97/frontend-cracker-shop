import React, { useState } from "react";
import { useConfigStore } from "../store/config.store";

type Tutorial = {
    id: string;
    title: string;
    description: string;
    videoUrl: string;
};

const getYouTubeEmbedUrl = (url: string) => {
    try {
        const parsedUrl = new URL(url);

        if (parsedUrl.hostname === "youtu.be") {
            return `https://www.youtube.com/embed/${parsedUrl.pathname.slice(1)}`;
        }

        if (
            parsedUrl.hostname === "youtube.com" ||
            parsedUrl.hostname === "www.youtube.com"
        ) {
            if (parsedUrl.pathname === "/watch") {
                const videoId = parsedUrl.searchParams.get("v");

                if (videoId) {
                    return `https://www.youtube.com/embed/${videoId}`;
                }
            }

            if (parsedUrl.pathname.startsWith("/embed/")) {
                return url;
            }
        }

        return url;
    } catch {
        return url;
    }
};

const HowToUse: React.FC = () => {
    const [selectedTutorial, setSelectedTutorial] =
        useState<Tutorial | null>(null);

    const config = useConfigStore((s) => s.config);

    const tutorials: Tutorial[] = Array.isArray(
        config?.tutorialVideos
    )
        ? config.tutorialVideos
            .filter(
                (tutorial: any) =>
                    tutorial.title?.trim() &&
                    tutorial.description?.trim() &&
                    tutorial.videoUrl?.trim()
            )
            .map((tutorial: any) => ({
                id: tutorial.id,
                title: tutorial.title,
                description: tutorial.description,
                videoUrl: getYouTubeEmbedUrl(
                    tutorial.videoUrl
                ),
            }))
        : [];

    const featuredTutorial = tutorials[0];
    const remainingTutorials = tutorials.slice(1);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <section className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
                    <div className="max-w-3xl mx-auto text-center">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-50 mb-5">
                            <svg
                                className="w-7 h-7 text-red-600"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        </div>

                        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
                            How to Use Our App
                        </h1>

                        <p className="mt-4 text-base sm:text-lg text-gray-600 leading-relaxed">
                            New to our application? Watch these quick tutorials
                            to learn how to browse products, place orders,
                            manage your account and more.
                        </p>
                    </div>
                </div>
            </section>

            {/* Featured Tutorial */}
            {featuredTutorial && (
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10">
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="grid grid-cols-1 lg:grid-cols-2">
                            {/* Video */}
                            <div className="bg-black aspect-video lg:aspect-auto lg:min-h-[360px]">
                                <iframe
                                    className="w-full h-full min-h-[240px] lg:min-h-[360px]"
                                    src={featuredTutorial.videoUrl}
                                    title={featuredTutorial.title}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen
                                />
                            </div>

                            {/* Content */}
                            <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
                                <span className="inline-flex w-fit items-center rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 mb-4">
                                    START HERE
                                </span>

                                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                                    {featuredTutorial.title}
                                </h2>

                                <p className="mt-4 text-gray-600 leading-relaxed">
                                    {featuredTutorial.description}
                                </p>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setSelectedTutorial(featuredTutorial)
                                    }
                                    className="mt-6 inline-flex w-fit items-center gap-2 rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 active:scale-[0.98]"
                                >
                                    <svg
                                        className="w-5 h-5"
                                        fill="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path d="M8 5v14l11-7z" />
                                    </svg>
                                    Watch Tutorial
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Tutorial List */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            More Tutorials
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Quick guides to help you get the most from the app.
                        </p>
                    </div>
                </div>

                {remainingTutorials.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {remainingTutorials.map((tutorial) => (
                            <div
                                key={tutorial.id}
                                className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition hover:shadow-md hover:-translate-y-0.5"
                            >
                                {/* Video Preview */}
                                <div className="relative aspect-video bg-gray-900">
                                    {<iframe
                                        className="w-full h-full pointer-events-none"
                                        src={tutorial.videoUrl}
                                        title={tutorial.title}
                                        loading="lazy"
                                    />}

                                    {/* Play Overlay */}
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setSelectedTutorial(tutorial)
                                        }
                                        aria-label={`Watch ${tutorial.title}`}
                                        className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/35 transition"
                                    >
                                        <span className="flex items-center justify-center w-14 h-14 rounded-full bg-white shadow-lg transition-transform hover:scale-105">
                                            <svg
                                                className="w-6 h-6 ml-1 text-red-600"
                                                fill="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path d="M8 5v14l11-7z" />
                                            </svg>
                                        </span>
                                    </button>
                                </div>

                                {/* Card Content */}
                                <div className="p-5">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        {tutorial.title}
                                    </h3>

                                    <p className="mt-2 text-sm text-gray-600 leading-relaxed line-clamp-2">
                                        {tutorial.description}
                                    </p>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setSelectedTutorial(tutorial)
                                        }
                                        className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:text-red-700"
                                    >
                                        Watch Video
                                        <svg
                                            className="w-4 h-4"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M9 5l7 7-7 7"
                                            />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
                        <p className="text-gray-500">
                            No tutorials are available at the moment.
                        </p>
                    </div>
                )}
            </section>

            {/* Video Modal */}
            {selectedTutorial && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
                    onClick={() => setSelectedTutorial(null)}
                >
                    <div
                        className="relative w-full max-w-5xl bg-black rounded-xl overflow-hidden shadow-2xl"
                        onClick={(event) => event.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            type="button"
                            onClick={() => setSelectedTutorial(null)}
                            aria-label="Close video"
                            className="absolute right-3 top-3 z-10 flex items-center justify-center w-9 h-9 rounded-full bg-black/70 text-white hover:bg-black transition"
                        >
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M6 6l12 12M18 6L6 18"
                                />
                            </svg>
                        </button>

                        {/* Video */}
                        <div className="aspect-video">
                            <iframe
                                className="w-full h-full"
                                src={`${selectedTutorial.videoUrl}?autoplay=1`}
                                title={selectedTutorial.title}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                            />
                        </div>

                        {/* Modal Information */}
                        <div className="bg-white p-5 sm:p-6">
                            <h2 className="text-xl font-bold text-gray-900">
                                {selectedTutorial.title}
                            </h2>

                            <p className="mt-2 text-sm text-gray-600">
                                {selectedTutorial.description}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HowToUse;