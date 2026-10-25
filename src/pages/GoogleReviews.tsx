import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaExternalLinkAlt, FaGoogle, FaStar } from "react-icons/fa";

const placeId = "ChIJLRE_-MHOBjsRsSlC3QkkNDA";
const writeReviewUrl = `https://search.google.com/local/writereview?placeid=${placeId}`;
const googleMapsUrl =
    `https://www.google.com/maps/search/?api=1&query=Sivakasi%20Pyro%20Park&query_place_id=${placeId}`;

interface GoogleReview {
    rating?: number;
    text?: string;
    relativePublishTimeDescription?: string;
    authorAttribution?: {
        displayName?: string;
        uri?: string;
        photoURI?: string;
    };
}

interface GooglePlace {
    displayName?: string;
    rating?: number;
    userRatingCount?: number;
    reviews?: GoogleReview[];
}

interface GooglePlacesLibrary {
    Place: new (options: { id: string }) => {
        displayName?: string;
        rating?: number;
        userRatingCount?: number;
        reviews?: GoogleReview[];
        fetchFields(options: { fields: string[] }): Promise<void>;
    };
}

interface GoogleMapsApi {
    importLibrary(name: "places"): Promise<GooglePlacesLibrary>;
}

declare global {
    interface Window {
        google?: {
            maps?: GoogleMapsApi;
        };
    }
}

let googleMapsScriptPromise: Promise<void> | undefined;

function waitForGoogleMapsApi(): Promise<void> {
    return new Promise((resolve, reject) => {
        const startedAt = Date.now();
        const timeoutMs = 10000;
        const intervalId = window.setInterval(() => {
            if (window.google?.maps?.importLibrary) {
                window.clearInterval(intervalId);
                resolve();
            } else if (Date.now() - startedAt >= timeoutMs) {
                window.clearInterval(intervalId);
                reject(new Error("Google Maps did not finish initializing. Please try again."));
            }
        }, 50);
    });
}

function loadGoogleMapsScript(apiKey: string): Promise<void> {
    if (window.google?.maps?.importLibrary) return Promise.resolve();
    if (googleMapsScriptPromise) return googleMapsScriptPromise;

    googleMapsScriptPromise = new Promise<void>((resolve, reject) => {
        const existingScript = document.getElementById(
            "google-maps-javascript-api"
        ) as HTMLScriptElement | null;
        const script = existingScript ?? document.createElement("script");
        const onLoad = () => void waitForGoogleMapsApi().then(resolve, reject);
        const onError = () =>
            reject(new Error("Unable to load Google Maps. Check the API key and restrictions."));

        if (existingScript) {
            void waitForGoogleMapsApi().then(resolve, reject);
        } else {
            script.id = "google-maps-javascript-api";
            script.async = true;
            script.src =
                `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly&loading=async`;
            script.addEventListener("load", onLoad, { once: true });
            script.addEventListener("error", onError, { once: true });
            document.head.appendChild(script);
        }
    }).catch((error: unknown) => {
        googleMapsScriptPromise = undefined;
        throw error;
    });

    return googleMapsScriptPromise;
}

function formatReviewCount(count: number) {
    return `${count.toLocaleString()} ${count === 1 ? "review" : "reviews"}`;
}

function RatingStars({ rating }: { rating: number }) {
    return (
        <span className="inline-flex items-center gap-0.5 text-amber-500" aria-label={`${rating} out of 5 stars`}>
            {Array.from({ length: 5 }, (_, index) => (
                <FaStar
                    key={index}
                    className={index < Math.round(rating) ? "" : "text-gray-300"}
                    aria-hidden="true"
                />
            ))}
        </span>
    );
}

export default function GoogleReviews() {
    const navigate = useNavigate();
    const [place, setPlace] = useState<GooglePlace | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [retryCount, setRetryCount] = useState(0);
    const [showAllReviews, setShowAllReviews] = useState(false);

    const fetchReviews = useCallback(async () => {
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim();
        if (!apiKey) {
            throw new Error("Google reviews are not configured yet.");
        }

        await loadGoogleMapsScript(apiKey);
        const placesLibrary = await window.google?.maps?.importLibrary("places");
        if (!placesLibrary) {
            throw new Error("Google Places is unavailable. Check the Maps JavaScript API setup.");
        }

        const business = new placesLibrary.Place({ id: placeId });
        await business.fetchFields({
            fields: ["displayName", "rating", "userRatingCount", "reviews"],
        });
        setPlace({
            displayName: business.displayName,
            rating: business.rating,
            userRatingCount: business.userRatingCount,
            reviews: business.reviews ?? [],
        });
    }, []);
    const reviews = place?.reviews ?? [];
    const visibleReviews = showAllReviews ? reviews : reviews.slice(0, 3);

    useEffect(() => {
        let active = true;
        void Promise.resolve()
            .then(fetchReviews)
            .catch((fetchError: unknown) => {
                if (!active) return;
                console.error("Unable to load Google reviews:", fetchError);
                setError(
                    fetchError instanceof Error
                        ? fetchError.message
                        : "Unable to load Google reviews."
                );
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [fetchReviews, retryCount]);

    return (
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
            <button
                type="button"
                onClick={() => navigate(-1)}
                aria-label="Go back"
                className="mb-5 inline-flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
                <FaArrowLeft aria-hidden="true" />
                Back
            </button>
            <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-amber-50 via-white to-orange-50 shadow-sm ring-1 ring-amber-100">
                <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center lg:p-12">
                    <div>
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-amber-500 shadow-sm">
                            <FaGoogle size={23} aria-hidden="true" />
                        </div>
                        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-amber-700">
                            Google Reviews
                        </p>
                        <h1 className="max-w-2xl text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                            {place?.displayName ?? "Your experience matters to us"}
                        </h1>
                        <p className="mt-4 max-w-2xl text-base leading-7 text-gray-600">
                            Read customer feedback or share your experience with Sivakasi Pyro Park.
                        </p>
                        {place?.rating !== undefined && place.userRatingCount !== undefined && (
                            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-gray-700">
                                <span className="font-semibold">{place.rating.toFixed(1)}</span>
                                <RatingStars rating={place.rating} />
                                <span>{formatReviewCount(place.userRatingCount)}</span>
                            </div>
                        )}
                        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                            <a
                                href={writeReviewUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                            >
                                <FaStar aria-hidden="true" />
                                Write a Google Review
                                <FaExternalLinkAlt className="text-xs" aria-hidden="true" />
                            </a>
                            <a
                                href={googleMapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                            >
                                Read Reviews on Google
                                <FaExternalLinkAlt className="text-xs" aria-hidden="true" />
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                            Customer reviews
                        </h2>
                        <p className="mt-1 text-sm text-gray-600">
                            Reviews provided by Google.
                        </p>
                    </div>
                    {place?.userRatingCount !== undefined && (
                        <span className="text-sm text-gray-600">
                            {formatReviewCount(place.userRatingCount)} on Google
                        </span>
                    )}
                </div>

                {loading ? (
                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                        {Array.from({ length: 4 }, (_, index) => (
                            <div key={index} className="animate-pulse rounded-xl border border-gray-100 p-5">
                                <div className="h-4 w-28 rounded bg-gray-200" />
                                <div className="mt-4 h-3 w-full rounded bg-gray-100" />
                                <div className="mt-2 h-3 w-4/5 rounded bg-gray-100" />
                            </div>
                        ))}
                    </div>
                ) : error ? (
                    <div className="mt-5 rounded-xl bg-amber-50 p-5 text-sm text-amber-900" role="alert">
                        <p>{error}</p>
                        <p className="mt-2">
                            Confirm that Places API (New) and Maps JavaScript API are enabled,
                            billing is active, and this website is allowed by the API key restrictions.
                        </p>
                        <button
                            type="button"
                            onClick={() => {
                                setLoading(true);
                                setError("");
                                setRetryCount((count) => count + 1);
                            }}
                            className="mt-3 rounded-lg bg-amber-600 px-4 py-2 font-semibold text-white hover:bg-amber-700"
                        >
                            Try again
                        </button>
                    </div>
                ) : place?.reviews?.length ? (
                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                        {visibleReviews.map((review, index) => {
                            const author = review.authorAttribution;
                            const card = (
                                <>
                                    <div className="flex items-start gap-3">
                                        {author?.photoURI ? (
                                            <img
                                                src={author.photoURI}
                                                alt=""
                                                className="h-10 w-10 rounded-full object-cover"
                                                referrerPolicy="no-referrer"
                                            />
                                        ) : (
                                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 font-semibold text-amber-800">
                                                {(author?.displayName ?? "G").charAt(0).toUpperCase()}
                                            </span>
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate font-semibold text-gray-900">
                                                {author?.displayName ?? "Google user"}
                                            </p>
                                            {review.relativePublishTimeDescription && (
                                                <p className="mt-0.5 text-xs text-gray-500">
                                                    {review.relativePublishTimeDescription}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    {review.rating !== undefined && (
                                        <div className="mt-3">
                                            <RatingStars rating={review.rating} />
                                        </div>
                                    )}
                                    {review.text && (
                                        <p className="mt-3 whitespace-pre-line text-sm leading-6 text-gray-700">
                                            {review.text}
                                        </p>
                                    )}
                                </>
                            );

                            return author?.uri ? (
                                <a
                                    key={`${author.uri}-${index}`}
                                    href={author.uri}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="rounded-xl border border-gray-100 p-5 transition hover:border-gray-200 hover:shadow-sm"
                                >
                                    {card}
                                </a>
                            ) : (
                                <article
                                    key={index}
                                    className="rounded-xl border border-gray-100 p-5"
                                >
                                    {card}
                                </article>
                            );
                        })}
                    </div>
                ) : (
                    <p className="mt-5 rounded-xl bg-gray-50 p-5 text-sm text-gray-600">
                        Google did not return any review text for this listing. You can view all
                        available reviews on Google Maps.
                    </p>
                )}
                {!loading && !error && reviews.length > 3 && (
                    <div className="mt-5 text-center">
                        <button
                            type="button"
                            onClick={() => setShowAllReviews((visible) => !visible)}
                            className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                        >
                            {showAllReviews ? "Show fewer reviews" : "Show more reviews"}
                        </button>
                        <p className="mt-2 text-xs text-gray-500">
                            Google provides a limited selection of reviews through this API.
                            View all reviews on Google Maps.
                        </p>
                    </div>
                )}
                <p className="mt-5 flex items-center gap-2 text-xs text-gray-500">
                    <FaGoogle aria-hidden="true" />
                    Review information supplied by Google
                </p>
            </section>

        </div>
    );
}
